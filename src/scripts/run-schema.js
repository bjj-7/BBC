import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;
const projectId = 'ihkuewyivfrprbeabcrp';
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const connectionString = `postgresql://postgres:${password}@db.${projectId}.supabase.co:5432/postgres`;

const client = new Client({
  connectionString,
});

async function runSchema() {
  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await client.connect();
    
    console.log("Reading schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260917000000_init.sql'), 'utf8');
    
    console.log("Executing schema.sql on database...");
    await client.query(schemaSql);
    
    console.log("Reading security_fixes.sql...");
    const fixesSql = fs.readFileSync(path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260917000001_security_fixes.sql'), 'utf8');
    
    console.log("Executing security_fixes.sql on database...");
    await client.query(fixesSql);

    console.log("Schema applied successfully!");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

runSchema();
