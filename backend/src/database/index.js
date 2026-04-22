const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const env = require('../config/env')
const { createTables } = require('./schema')
const { seedDatabase } = require('./seed')

fs.mkdirSync(path.dirname(env.DATABASE_PATH), { recursive: true })

const db = new Database(env.DATABASE_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

createTables(db)
seedDatabase(db)

module.exports = db
