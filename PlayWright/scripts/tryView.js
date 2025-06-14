import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './PlayWright/supabase.env' });

async function test() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time:', res.rows[0]);
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await client.end();
  }
}

test();