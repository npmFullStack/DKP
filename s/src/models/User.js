// src/models/User.js
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = {
  async create({ username, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2) 
       RETURNING id, username, created_at`,
      [username, hashedPassword]
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

  async findById(id) {
    const result = await pool.query(
      `SELECT id, username, avatar, created_at, last_login 
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

  async updateUser(id, { username, avatar }) {
    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           avatar = COALESCE($2, avatar)
       WHERE id = $3
       RETURNING id, username, avatar, created_at`,
      [username, avatar, id]
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