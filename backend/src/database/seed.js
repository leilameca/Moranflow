const bcrypt = require('bcryptjs')
const env = require('../config/env')

const DEFAULT_ADMIN = {
  name: env.ADMIN_NAME,
  email: env.ADMIN_EMAIL,
  password: env.ADMIN_PASSWORD,
  role: env.ADMIN_ROLE,
}

const seedDatabase = (db) => {
  const existingUser = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = ?')
    .get(DEFAULT_ADMIN.email)

  if (!existingUser) {
    const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN.password, 10)

    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(
      DEFAULT_ADMIN.name,
      DEFAULT_ADMIN.email,
      passwordHash,
      DEFAULT_ADMIN.role
    )

    console.log(`[seed] Admin user created for ${DEFAULT_ADMIN.email}`)
    return
  }

  if (env.ADMIN_SYNC_ON_BOOT) {
    const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN.password, 10)

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, password_hash = ?, role = ?
      WHERE id = ?
    `).run(
      DEFAULT_ADMIN.name,
      DEFAULT_ADMIN.email,
      passwordHash,
      DEFAULT_ADMIN.role,
      existingUser.id
    )

    console.log(`[seed] Admin user synchronized for ${DEFAULT_ADMIN.email}`)
  }
}

module.exports = {
  DEFAULT_ADMIN,
  seedDatabase,
}
