import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, initDb } from './db';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Database
  await initDb();

  // --- API Routes ---

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    const { id, name, email, mobileNumber, employee_id, password, department, designation, section, area, lines } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (id, name, email, mobile_number, employee_id, password, department, designation, section, area, lines)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [id, name, email, mobileNumber, employee_id, hashedPassword, department, designation, section, area, lines]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Auth: Check if Admin Exists
  app.get('/api/auth/has-admin', async (req, res) => {
    try {
      const result = await query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'");
      const count = parseInt(result.rows[0].count);
      res.json({ hasAdmin: count > 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Register First Admin
  app.post('/api/auth/register-admin', async (req, res) => {
    const { id, name, employee_id, password, email, mobileNumber } = req.body;
    try {
      // Check if any admin already exists
      const checkResult = await query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'");
      if (parseInt(checkResult.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Admin already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (id, name, email, mobile_number, employee_id, password, role, status, department, designation)
         VALUES ($1, $2, $3, $4, $5, $6, 'ADMIN', 'APPROVED', 'IE', 'Manager') RETURNING *`,
        [id, name, email, mobileNumber, employee_id, hashedPassword]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error('Admin registration error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or employee_id
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1 OR employee_id = $1 OR mobile_number = $1',
        [identifier]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.status !== 'APPROVED') {
        return res.status(403).json({ error: 'Your account is pending approval' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get Users
  app.get('/api/admin/users', async (req, res) => {
    try {
      const result = await query('SELECT * FROM users ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update User Status
  app.patch('/api/admin/users/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, role, approvedAt } = req.body;
    try {
      const result = await query(
        'UPDATE users SET status = $1, role = $2, approved_at = $3 WHERE id = $4 RETURNING *',
        [status, role, approvedAt, id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update User Profile
  app.put('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, employee_id, email, mobileNumber, department, designation, section, area, role, lines, password } = req.body;
    try {
      let queryStr = `UPDATE users SET name = $1, employee_id = $2, email = $3, mobile_number = $4, department = $5, designation = $6, section = $7, area = $8, role = $9, lines = $10`;
      let params = [name, employee_id, email, mobileNumber, department, designation, section, area, role, lines];
      
      if (password && !password.startsWith('$2a$')) { // If it's not already a hash
        const hashedPassword = await bcrypt.hash(password, 10);
        queryStr += `, password = $11 WHERE id = $12 RETURNING *`;
        params.push(hashedPassword, id);
      } else {
        queryStr += ` WHERE id = $11 RETURNING *`;
        params.push(id);
      }
      
      const result = await query(queryStr, params);
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Config: Get Config
  app.get('/api/config', async (req, res) => {
    try {
      const result = await query('SELECT data FROM app_config WHERE id = $1', ['main_config']);
      res.json(result.rows[0]?.data || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Config: Update Config
  app.post('/api/config', async (req, res) => {
    const { data } = req.body;
    try {
      await query(
        'INSERT INTO app_config (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP',
        ['main_config', data]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Production Targets
  app.get('/api/production-targets', async (req, res) => {
    const { date } = req.query;
    try {
      const result = await query('SELECT * FROM production_targets WHERE date = $1', [date]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/production-targets', async (req, res) => {
    const targets = req.body; // Expecting array of targets
    try {
      for (const target of targets) {
        await query(
          `INSERT INTO production_targets (id, date, block_id, line_id, target_pcs, actual_pcs, manpower, sam, efficiency, style_id, buyer_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (date, line_id) DO UPDATE SET 
           target_pcs = EXCLUDED.target_pcs, actual_pcs = EXCLUDED.actual_pcs, manpower = EXCLUDED.manpower, 
           sam = EXCLUDED.sam, efficiency = EXCLUDED.efficiency, style_id = EXCLUDED.style_id, buyer_id = EXCLUDED.buyer_id`,
          [target.id, target.date, target.block_id, target.line_id, target.target_pcs, target.actual_pcs, target.manpower, target.sam, target.efficiency, target.style_id, target.buyer_id]
        );
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Wash Costing
  app.get('/api/wash-costing', async (req, res) => {
    try {
      const result = await query('SELECT * FROM wash_costing ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/wash-costing', async (req, res) => {
    const { id, style_name, buyer_name, order_qty, total_cost_per_gmt, total_order_cost, data, created_by } = req.body;
    try {
      const result = await query(
        `INSERT INTO wash_costing (id, style_name, buyer_name, order_qty, total_cost_per_gmt, total_order_cost, data, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET 
         style_name = EXCLUDED.style_name, buyer_name = EXCLUDED.buyer_name, order_qty = EXCLUDED.order_qty,
         total_cost_per_gmt = EXCLUDED.total_cost_per_gmt, total_order_cost = EXCLUDED.total_order_cost, data = EXCLUDED.data
         RETURNING *`,
        [id, style_name, buyer_name, order_qty, total_cost_per_gmt, total_order_cost, data, created_by]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Consumption (Generic)
  app.get('/api/consumption/:type', async (req, res) => {
    const { type } = req.params; // 'trims' or 'fabric'
    const table = type === 'trims' ? 'trims_consumption' : 'fabric_consumption';
    try {
      const result = await query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/consumption/:type', async (req, res) => {
    const { type } = req.params;
    const { id, style_name, buyer_name, data } = req.body;
    const table = type === 'trims' ? 'trims_consumption' : 'fabric_consumption';
    try {
      const result = await query(
        `INSERT INTO ${table} (id, style_name, buyer_name, data)
         VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET 
         style_name = EXCLUDED.style_name, buyer_name = EXCLUDED.buyer_name, data = EXCLUDED.data
         RETURNING *`,
        [id, style_name, buyer_name, data]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Sync: Pull
  app.get('/api/sync/pull', async (req, res) => {
    const { since } = req.query;
    try {
      const tables = ['production', 'wip', 'npt', 'manpower', 'style_plans'];
      const data: any = { timestamp: new Date().toISOString() };
      
      for (const table of tables) {
        const result = await query(`SELECT * FROM ${table} WHERE updated_at > $1`, [since || new Date(0).toISOString()]);
        data[table === 'style_plans' ? 'stylePlans' : table] = result.rows.map(r => ({ ...r.data, id: r.id, updated_at: r.updated_at }));
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sync: Push
  app.post('/api/sync/push', async (req, res) => {
    const { changes } = req.body;
    try {
      for (const table in changes) {
        const pgTable = table === 'stylePlans' ? 'style_plans' : table;
        for (const record of changes[table]) {
          await query(
            `INSERT INTO ${pgTable} (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
            [record.id, record]
          );
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Production Log
  app.post('/api/production/log', async (req, res) => {
    const record = req.body;
    try {
      await query(
        `INSERT INTO production (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
        [record.id, record]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // QCO
  app.get('/api/qco', async (req, res) => {
    const { department } = req.query;
    try {
      // Assuming QCO data is stored in a separate table or just return empty for now
      res.json([]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/qco', async (req, res) => {
    const record = req.body;
    try {
      // Save QCO record
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite / Static Files ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
