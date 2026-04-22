const bcrypt = require('bcryptjs')

const DEFAULT_ADMIN = {
  name: 'Moran Studio Admin',
  email: 'admin@moranstudio.local',
  password: 'MoranAdmin123!',
  role: 'admin',
}

const seedDatabase = (db) => {
  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
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
  }
}

module.exports = {
  DEFAULT_ADMIN,
  seedDatabase,
}