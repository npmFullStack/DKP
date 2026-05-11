// src/models/Checkpoint.js
import pool from '../config/database.js';

export const Checkpoint = {
  async create(data) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 5); // Active for 5 hours

    const result = await pool.query(
      `INSERT INTO checkpoints (
        title, province, municipality, barangay, street, 
        full_address, latitude, longitude, image_urls, reported_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.title, data.province, data.municipality,
        data.barangay, data.street, data.fullAddress, data.latitude,
        data.longitude, data.imageUrls || [], data.reportedBy, expiresAt
      ]
    );
    return result.rows[0];
  },

  async findAll({ status = 'active', limit = 50, offset = 0, search = '' } = {}) {
    let query = `
      SELECT c.*, u.username as reporter_name, u.avatar as reporter_avatar,
             COALESCE((
               SELECT json_agg(json_build_object(
                 'id', com.id, 'content', com.content, 'created_at', com.created_at,
                 'user_id', com.user_id, 'username', u2.username, 'avatar', u2.avatar
               ) ORDER BY com.created_at DESC
               FROM comments com
               LEFT JOIN users u2 ON com.user_id = u2.id
               WHERE com.checkpoint_id = c.id
             ), '[]'::json) as comments
      FROM checkpoints c
      LEFT JOIN users u ON c.reported_by = u.id
      WHERE c.status = $1
    `;
    const params = [status];
    let paramIndex = 2;

    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.full_address ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM checkpoints WHERE status = $1';
    const countParams = [status];
    if (search) {
      countQuery += ` AND (title ILIKE $2 OR full_address ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);

    return {
      checkpoints: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT c.*, u.username as reporter_name, u.avatar as reporter_avatar,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id', com.id, 'content', com.content, 'created_at', com.created_at,
                  'user_id', com.user_id, 'username', u2.username, 'avatar', u2.avatar
                ) ORDER BY com.created_at DESC
                FROM comments com
                LEFT JOIN users u2 ON com.user_id = u2.id
                WHERE com.checkpoint_id = c.id
              ), '[]'::json) as comments
       FROM checkpoints c
       LEFT JOIN users u ON c.reported_by = u.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE checkpoints SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async addReaction(userId, checkpointId, type) {
    // Check if reaction exists
    const existing = await pool.query(
      'SELECT reaction_type FROM checkpoint_reactions WHERE user_id = $1 AND checkpoint_id = $2',
      [userId, checkpointId]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].reaction_type === type) {
        // Remove reaction
        await pool.query(
          'DELETE FROM checkpoint_reactions WHERE user_id = $1 AND checkpoint_id = $2',
          [userId, checkpointId]
        );
        await pool.query(
          `UPDATE checkpoints SET 
            ${type === 'like' ? 'likes = likes - 1' : 'dislikes = dislikes - 1'}
           WHERE id = $1`,
          [checkpointId]
        );
        return { reaction: null };
      } else {
        // Change reaction
        await pool.query(
          'UPDATE checkpoint_reactions SET reaction_type = $1 WHERE user_id = $2 AND checkpoint_id = $3',
          [type, userId, checkpointId]
        );
        await pool.query(
          `UPDATE checkpoints SET 
            likes = likes ${type === 'like' ? '+ 1' : '- 1'},
            dislikes = dislikes ${type === 'dislike' ? '+ 1' : '- 1'}
           WHERE id = $1`,
          [checkpointId]
        );
        return { reaction: type };
      }
    } else {
      // Add new reaction
      await pool.query(
        'INSERT INTO checkpoint_reactions (user_id, checkpoint_id, reaction_type) VALUES ($1, $2, $3)',
        [userId, checkpointId, type]
      );
      await pool.query(
        `UPDATE checkpoints SET ${type === 'like' ? 'likes = likes + 1' : 'dislikes = dislikes + 1'}
         WHERE id = $1`,
        [checkpointId]
      );
      return { reaction: type };
    }
  },

  async getUserReaction(userId, checkpointId) {
    const result = await pool.query(
      'SELECT reaction_type FROM checkpoint_reactions WHERE user_id = $1 AND checkpoint_id = $2',
      [userId, checkpointId]
    );
    return result.rows[0]?.reaction_type || null;
  },

  async addComment(userId, checkpointId, content) {
    const result = await pool.query(
      `INSERT INTO comments (user_id, checkpoint_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, checkpointId, content]
    );
    
    // Get user info for the comment
    const userResult = await pool.query(
      'SELECT username, avatar FROM users WHERE id = $1',
      [userId]
    );
    
    return {
      ...result.rows[0],
      username: userResult.rows[0].username,
      avatar: userResult.rows[0].avatar
    };
  },

  async getComments(checkpointId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT c.*, u.username, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.checkpoint_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [checkpointId, limit, offset]
    );
    return result.rows;
  },

  async expireOldCheckpoints() {
    const result = await pool.query(
      `UPDATE checkpoints 
       SET status = 'expired' 
       WHERE status = 'active' AND expires_at < NOW()
       RETURNING id`
    );
    return result.rows;
  }
};