// src/models/User.js
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = {
  async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );
    
    // Create default settings for user
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)`,
      [result.rows[0].id]
    );
    
    return result.rows[0];
  },

  async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT id, username, email, avatar, created_at, last_login 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  },

  async updateUser(id, { username, email, avatar }) {
    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           avatar = COALESCE($3, avatar)
       WHERE id = $4
       RETURNING id, username, email, avatar, created_at`,
      [username, email, avatar, id]
    );
    return result.rows[0];
  },

  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, id]
    );
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
};