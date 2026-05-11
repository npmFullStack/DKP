import pool from '../config/database.js';

export const Notification = {
  async create({ userId, type, title, message, checkpointId = null }) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, checkpoint_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, checkpointId]
    );
    return result.rows[0];
  },

  async findByUser(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND is_read = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );
    
    return {
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      unreadCount: await Notification.getUnreadCount(userId)
    };
  },

  async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  async markAsRead(notificationId, userId) {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  },

  async markAllAsRead(userId) {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
  },

  async deleteAll(userId) {
    await pool.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );
  },

  async createNewCheckpointNotification(checkpointId, reporterId, checkpointTitle, barangay) {
    // Find users who want notifications (excluding the reporter)
    const users = await pool.query(
      `SELECT u.id FROM users u
       JOIN user_settings us ON u.id = us.user_id
       WHERE u.id != $1 AND us.notification_new_checkpoint = true`,
      [reporterId]
    );
    
    const notifications = [];
    for (const user of users.rows) {
      const notif = await Notification.create({
        userId: user.id,
        type: 'new_checkpoint',
        title: 'New Checkpoint Reported',
        message: `New checkpoint "${checkpointTitle}" reported in ${barangay || 'your area'}`,
        checkpointId
      });
      notifications.push(notif);
    }
    
    return notifications;
  }
};