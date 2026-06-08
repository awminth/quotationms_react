import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './database.js';
import apiRouter from './routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main APIs
app.use('/api', apiRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quotation Management API is running' });
});

// Serve frontend static build files
const frontendDistPath = path.join(__dirname, 'dist');
app.use(express.static(frontendDistPath));

// Fallback all non-API GET requests to serve index.html (for client-side routing)
app.get('*any', (req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Initialize DB and start server
async function startServer() {
  try {
    console.log('Initializing database connection...');
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start due to database error:', error);
    process.exit(1);
  }
}

startServer(); // trigger reload
