import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDb = async () => {
  try {
    // Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        mobile_number TEXT,
        employee_id TEXT UNIQUE,
        password TEXT NOT NULL,
        department TEXT,
        designation TEXT,
        section TEXT,
        area TEXT,
        lines TEXT[],
        role TEXT DEFAULT 'USER',
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create Config Table
    await query(`
      CREATE TABLE IF NOT EXISTS app_config (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Planning/Target Sheets Table
    await query(`
      CREATE TABLE IF NOT EXISTS production_targets (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        block_id TEXT NOT NULL,
        line_id TEXT NOT NULL,
        target_pcs INTEGER,
        actual_pcs INTEGER DEFAULT 0,
        manpower INTEGER,
        sam DECIMAL,
        efficiency DECIMAL,
        style_id TEXT,
        buyer_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, line_id)
      );
    `);

    // Create Wash Costing Table
    await query(`
      CREATE TABLE IF NOT EXISTS wash_costing (
        id TEXT PRIMARY KEY,
        style_name TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        order_qty INTEGER,
        total_cost_per_gmt DECIMAL,
        total_order_cost DECIMAL,
        data JSONB NOT NULL,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Trims Consumption Table
    await query(`
      CREATE TABLE IF NOT EXISTS trims_consumption (
        id TEXT PRIMARY KEY,
        style_name TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Fabric Consumption Table
    await query(`
      CREATE TABLE IF NOT EXISTS fabric_consumption (
        id TEXT PRIMARY KEY,
        style_name TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

export default pool;
