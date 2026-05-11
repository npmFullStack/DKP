import pool from '../config/database.js';

export const Settings = {
  async getByUserId(userId) {
    const result = await pool.query(
      `SELECT notification_new_checkpoint, notification_checkpoint_expired
       FROM user_settings WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || {
      notification_new_checkpoint: true,
      notification_checkpoint_expired: false
    };
  },

  async update(userId, data) {
    const result = await pool.query(
      `UPDATE user_settings 
       SET notification_new_checkpoint = COALESCE($1, notification_new_checkpoint),
           notification_checkpoint_expired = COALESCE($2, notification_checkpoint_expired)
       WHERE user_id = $3
       RETURNING *`,
      [data.notification_new_checkpoint, data.notification_checkpoint_expired, userId]
    );
    return result.rows[0];
  }
};