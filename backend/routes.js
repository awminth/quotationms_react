import express from 'express';
import { getPool } from './database.js';

const router = express.Router();

// Helper to parse JSON fields safely
const parseFeaturesField = (features) => {
  if (!features) return [];
  if (typeof features === 'object') return features;
  try {
    return JSON.parse(features);
  } catch (e) {
    return [];
  }
};

// ==========================================
// 0. Authentication Routes
// ==========================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT username FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ success: true, message: 'Login successful', username: rows[0].username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 1. Settings Routes
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM settings LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', async (req, res) => {
  const { company_name, phone, email, address, kpay_name, kpay_phone } = req.body;
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id FROM settings LIMIT 1');
    if (rows.length === 0) {
      // Create if doesn't exist
      await pool.query(
        `INSERT INTO settings (company_name, phone, email, address, kpay_name, kpay_phone) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company_name, phone, email, address, kpay_name, kpay_phone]
      );
    } else {
      // Update first row
      const id = rows[0].id;
      await pool.query(
        `UPDATE settings SET company_name = ?, phone = ?, email = ?, address = ?, kpay_name = ?, kpay_phone = ? 
         WHERE id = ?`,
        [company_name, phone, email, address, kpay_name, kpay_phone, id]
      );
    }
    const [updatedRows] = await pool.query('SELECT * FROM settings LIMIT 1');
    res.json(updatedRows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Clients Routes
// ==========================================
router.get('/clients', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clients', async (req, res) => {
  const { name, company_name, phone, email, address } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Client name is required' });
  }
  try {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO clients (name, company_name, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
      [name, company_name, phone, email, address]
    );
    res.json({ id: result.insertId, name, company_name, phone, email, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Pre-defined Modules Routes
// ==========================================
router.get('/modules', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM modules ORDER BY name ASC');
    const processed = rows.map(m => ({
      ...m,
      features: parseFeaturesField(m.features)
    }));
    res.json(processed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/modules', async (req, res) => {
  const { name, description, features, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Module name is required' });
  }
  try {
    const pool = getPool();
    const featuresStr = JSON.stringify(Array.isArray(features) ? features : []);
    const basePrice = price || 0;
    const [result] = await pool.query(
      `INSERT INTO modules (name, description, features, price) VALUES (?, ?, ?, ?)`,
      [name, description, featuresStr, basePrice]
    );
    res.json({ id: result.insertId, name, description, features, price: basePrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/modules/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, features, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Module name is required' });
  }
  try {
    const pool = getPool();
    const featuresStr = JSON.stringify(Array.isArray(features) ? features : []);
    const basePrice = price || 0;
    await pool.query(
      `UPDATE modules SET name = ?, description = ?, features = ?, price = ? WHERE id = ?`,
      [name, description, featuresStr, basePrice, id]
    );
    res.json({ id, name, description, features, price: basePrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/modules/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.query('DELETE FROM modules WHERE id = ?', [id]);
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Quotations Routes
// ==========================================
router.get('/quotations', async (req, res) => {
  try {
    const pool = getPool();
    // Get all quotations with client details
    const [rows] = await pool.query(`
      SELECT q.*, c.name as client_name, c.company_name as client_company
      FROM quotations q
      JOIN clients c ON q.client_id = c.id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/quotations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    
    // Get quotation header
    const [quotes] = await pool.query(`
      SELECT q.*, c.name as client_name, c.company_name as client_company, 
             c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM quotations q
      JOIN clients c ON q.client_id = c.id
      WHERE q.id = ?
    `, [id]);

    if (quotes.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = quotes[0];

    // Get quotation modules
    const [modules] = await pool.query(
      'SELECT * FROM quotation_details WHERE quotation_id = ?', 
      [id]
    );
    quotation.modules = modules.map(m => ({
      ...m,
      features: parseFeaturesField(m.features)
    }));

    // Get quotation payments
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE quotation_id = ? ORDER BY payment_date DESC', 
      [id]
    );
    quotation.payments = payments;

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quotations', async (req, res) => {
  const { client_id, modules, notes } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: 'Client is required' });
  }
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    return res.status(400).json({ error: 'At least one module must be selected' });
  }

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    // Calculate total amount
    let totalAmount = 0;
    for (const m of modules) {
      totalAmount += Number(m.price || 0);
    }

    // Generate unique Quotation Number: QT-YYYYMMDD-XXXX (random/sequential)
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const quoteNumber = `QT-${todayStr}-${randSuffix}`;

    const quoteDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Insert Quotation Header
    const [quoteResult] = await connection.query(`
      INSERT INTO quotations (quote_number, client_id, quote_date, total_amount, paid_amount, balance, status, notes)
      VALUES (?, ?, ?, ?, 0.00, ?, 'Draft', ?)
    `, [quoteNumber, client_id, quoteDate, totalAmount, totalAmount, notes || '']);

    const quotationId = quoteResult.insertId;

    // Insert Quotation Details
    for (const m of modules) {
      const featuresStr = JSON.stringify(Array.isArray(m.features) ? m.features : []);
      await connection.query(`
        INSERT INTO quotation_details (quotation_id, module_name, description, features, price)
        VALUES (?, ?, ?, ?, ?)
      `, [quotationId, m.name, m.description || '', featuresStr, m.price || 0]);
    }

    await connection.commit();
    res.json({ id: quotationId, quote_number: quoteNumber, total_amount: totalAmount });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// 5. Payment Routes
// ==========================================
router.post('/quotations/:id/payments', async (req, res) => {
  const { id } = req.params;
  const { amount, payment_date, payment_method, reference_no, notes } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }
  if (!payment_date) {
    return res.status(400).json({ error: 'Payment date is required' });
  }
  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check quotation details
    const [quotes] = await connection.query(
      'SELECT total_amount, paid_amount, balance FROM quotations WHERE id = ? FOR UPDATE', 
      [id]
    );

    if (quotes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const { total_amount, paid_amount, balance } = quotes[0];
    const newPaidAmount = Number(paid_amount) + Number(amount);
    const newBalance = Number(total_amount) - newPaidAmount;

    if (newPaidAmount > total_amount) {
      connection.release();
      return res.status(400).json({ error: `Payment exceeds total outstanding balance of ${balance} MMK` });
    }

    // 2. Insert payment record
    await connection.query(`
      INSERT INTO payments (quotation_id, amount, payment_date, payment_method, reference_no, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, amount, payment_date, payment_method, reference_no || null, notes || null]);

    // 3. Determine new status
    let newStatus = 'Partially Paid';
    if (newBalance <= 0) {
      newStatus = 'Fully Paid';
    }

    // 4. Update quotation totals and status
    await connection.query(`
      UPDATE quotations SET paid_amount = ?, balance = ?, status = ? WHERE id = ?
    `, [newPaidAmount, newBalance, newStatus, id]);

    await connection.commit();
    res.json({ message: 'Payment recorded successfully', newPaidAmount, newBalance, status: newStatus });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// 6. Dashboard Stats Routes
// ==========================================
router.get('/dashboard/stats', async (req, res) => {
  try {
    const pool = getPool();

    // Total quotations stats
    const [totals] = await pool.query(`
      SELECT 
        COUNT(*) as total_count,
        SUM(total_amount) as total_revenue,
        SUM(paid_amount) as total_collected,
        SUM(balance) as total_outstanding
      FROM quotations
    `);

    // Status breakdown
    const [statusRows] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM quotations 
      GROUP BY status
    `);

    // Recent quotations (limit 5)
    const [recentRows] = await pool.query(`
      SELECT q.*, c.name as client_name, c.company_name as client_company
      FROM quotations q
      JOIN clients c ON q.client_id = c.id
      ORDER BY q.created_at DESC
      LIMIT 5
    `);

    res.json({
      summary: {
        total_count: totals[0].total_count || 0,
        total_revenue: totals[0].total_revenue || 0,
        total_collected: totals[0].total_collected || 0,
        total_outstanding: totals[0].total_outstanding || 0
      },
      status_breakdown: statusRows,
      recent_quotations: recentRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
