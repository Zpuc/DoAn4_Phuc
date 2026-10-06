import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.resolve(__dirname, '../../../database/schema.sql')

async function runSeed() {
  console.log('--- Connecting to MySQL server ---')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  })

  try {
    console.log('Reading database/schema.sql...')
    const sql = fs.readFileSync(schemaPath, 'utf8')
    console.log('Executing schema and seed scripts...')
    await connection.query(sql)
    console.log('✅ Database `autobot_store` successfully initialized & seeded!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

runSeed()
