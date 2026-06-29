import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
const DB_NAME = process.env.DB_NAME || 'quotationms';

let pool;

export async function initializeDatabase() {
  // 1. Create connection without database to ensure DB exists
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD
    });

    console.log(`Connecting to MySQL on ${DB_HOST}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.end();
    console.log(`Database "${DB_NAME}" verified/created successfully.`);
  } catch (error) {
    console.error('Error creating database:', error.message);
    throw error;
  }

  // 2. Initialize connection pool with database
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // 3. Create tables
  try {
    // Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        kpay_name VARCHAR(255),
        kpay_phone VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Modules table (pre-defined software systems)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        features JSON,
        price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quotations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote_number VARCHAR(100) NOT NULL UNIQUE,
        client_id INT NOT NULL,
        quote_date DATE NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Sent, Partially Paid, Fully Paid, Cancelled
        notes TEXT,
        server_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        server_fee_duration INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
      )
    `);

    // Add server_fee column dynamically if it does not exist (for existing tables)
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM quotations LIKE 'server_fee'");
      if (columns.length === 0) {
        await pool.query("ALTER TABLE quotations ADD COLUMN server_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00 AFTER notes");
        console.log("Database Migration: server_fee column added to quotations table.");
      }
    } catch (migError) {
      console.error("Database Migration Error: Failed to add server_fee column:", migError.message);
    }

    // Add server_fee_duration column dynamically if it does not exist (for existing tables)
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM quotations LIKE 'server_fee_duration'");
      if (columns.length === 0) {
        await pool.query("ALTER TABLE quotations ADD COLUMN server_fee_duration INT NOT NULL DEFAULT 1 AFTER server_fee");
        console.log("Database Migration: server_fee_duration column added to quotations table.");
      }
    } catch (migError) {
      console.error("Database Migration Error: Failed to add server_fee_duration column:", migError.message);
    }

    // Quotation details table (stores modules selected in a quotation with captured states/pricing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotation_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        module_name VARCHAR(255) NOT NULL,
        description TEXT,
        features JSON,
        price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      )
    `);

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(100) NOT NULL, -- KPay, WavePay, Cash, Bank Transfer, etc.
        reference_no VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      )
    `);

    // Users table for database authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables verified/created successfully.');

    // 4. Seed default settings and modules if empty
    await seedDefaultData();

  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

async function seedDefaultData() {
  try {
    // Seed settings
    const [settingsRows] = await pool.query('SELECT COUNT(*) as count FROM settings');
    if (settingsRows[0].count === 0) {
      await pool.query(`
        INSERT INTO settings (company_name, phone, email, address, kpay_name, kpay_phone)
        VALUES (
          'Alpha Software Co., Ltd.', 
          '09-450012345, 09-780012345', 
          'info@alphasoftware.com', 
          'No. 123, Pyay Road, Kamayut Township, Yangon', 
          'U Zaw Min Oo', 
          '09450012345'
        )
      `);
      console.log('Seeded default settings.');
    }

    // Seed modules
    const [moduleRows] = await pool.query('SELECT COUNT(*) as count FROM modules');
    if (moduleRows[0].count === 0) {
      const defaultModules = [
        {
          name: 'POS & Retail Management System',
          description: 'A complete point of sale system for shops, supermarkets, and restaurants to manage sales, invoices, and payment tracking.',
          features: JSON.stringify([
            'Real-time retail barcode scanning & billing',
            'Multiple payment method support (Cash, KPay, Cards)',
            'Dynamic receipt and invoice layout printing (80mm/A4)',
            'End-of-day sales summary & cashier shift reports',
            'Customer membership and discount loyalty points logic'
          ]),
          price: 650000.00
        },
        {
          name: 'Smart Inventory & Warehouse System',
          description: 'A professional stocks tracking system that helps monitor warehouse inventory levels, supplier purchases, and stock valuations.',
          features: JSON.stringify([
            'Multi-warehouse stock levels tracking',
            'Real-time low stock automatic warnings and notifications',
            'Supplier profiles & Purchase Order (PO) flow',
            'Stock adjustments, damage logs & stock valuation',
            'Fast barcode printing and item SKU tracking'
          ]),
          price: 550000.00
        },
        {
          name: 'HR & Salary Payroll Management System',
          description: 'Simplify human resource tracking, attendance, leave approvals, and automated monthly payroll calculations.',
          features: JSON.stringify([
            'Comprehensive employee digital service files',
            'Biometric fingerprint/RFID device excel attendance import',
            'Automatic monthly salary calculations with tax & bonuses',
            'Leave balance request approvals and tracking history',
            'Professional PDF payslip automated emailing'
          ]),
          price: 750000.00
        },
        {
          name: 'Professional E-Commerce Web System',
          description: 'An elegant online store allowing customers to browse items, add to cart, checkout, and pay digitally.',
          features: JSON.stringify([
            'Clean modern storefront web layout',
            'Dynamic product inventory categories & options (size, color)',
            'Integrated mobile payments (KBZPay, WavePay, AYA Pay)',
            'Instant email & Telegram notification on new orders',
            'Powerful admin dashboard panel for order and content updates'
          ]),
          price: 950000.00
        }
      ];

      for (const m of defaultModules) {
        await pool.query(
          'INSERT INTO modules (name, description, features, price) VALUES (?, ?, ?, ?)',
          [m.name, m.description, m.features, m.price]
        );
      }
      console.log('Seeded default modules.');
    }

    // Seed admin user
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      await pool.query("INSERT INTO users (username, password) VALUES ('admin', 'admin123')");
      console.log('Seeded default user admin / admin123.');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool;
}
