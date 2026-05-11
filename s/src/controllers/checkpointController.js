// src/controllers/checkpointController.js
import { Checkpoint } from '../models/Checkpoint.js';
import { Notification } from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/checkpoints');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
}).array('images', 5);

// Upload images endpoint
export const uploadImages = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }
      
      const imageUrls = files.map(file => {
        return `/uploads/checkpoints/${file.filename}`;
      });
      
      res.json({ imageUrls });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

// Create a new checkpoint
export const createCheckpoint = async (req, res) => {
  try {
    const checkpointData = {
      title: req.body.title,
      province: req.body.province,
      municipality: req.body.municipality,
      barangay: req.body.barangay,
      street: req.body.street,
      fullAddress: req.body.fullAddress,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      imageUrls: req.body.imageUrls || [],
      reportedBy: req.user.id
    };

    // Validate required fields
    const requiredFields = ['title', 'province', 'municipality', 'barangay', 'street', 'fullAddress', 'latitude', 'longitude'];
    for (const field of requiredFields) {
      if (!checkpointData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate coordinates
    if (isNaN(checkpointData.latitude) || isNaN(checkpointData.longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const checkpoint = await Checkpoint.create(checkpointData);
    
    // Create notifications for other users
    try {
      await Notification.createNewCheckpointNotification(
        checkpoint.id,
        req.user.id,
        checkpoint.title,
        checkpoint.barangay
      );
    } catch (notifError) {
      console.error('Notification creation error:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({ error: 'Failed to create checkpoint' });
  }
};

// Get all checkpoints with pagination and search
export const getCheckpoints = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      search = '', 
      status = 'active',
      province,
      municipality,
      barangay
    } = req.query;
    
    const filters = {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      search
    };
    
    // Add optional location filters
    if (province) filters.province = province;
    if (municipality) filters.municipality = municipality;
    if (barangay) filters.barangay = barangay;
    
    const result = await Checkpoint.findAll(filters);
    res.json(result);
  } catch (error) {
    console.error('Get checkpoints error:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
};

// Get a single checkpoint by ID
export const getCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.id);
    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }
    res.json(checkpoint);
  } catch (error) {
    console.error('Get checkpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoint' });
  }
};

// Get checkpoints reported by the current user
export const getUserCheckpoints = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = 'active' } = req.query;
    const result = await Checkpoint.findByUser(req.user.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(result);
  } catch (error) {
    console.error('Get user checkpoints error:', error);
    res.status(500).json({ error: 'Failed to fetch user checkpoints' });
  }
};

// Get nearby checkpoints within radius
export const getNearbyCheckpoints = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const checkpoints = await Checkpoint.findNearby(latitude, longitude, radiusKm);
    res.json(checkpoints);
  } catch (error) {
    console.error('Get nearby checkpoints error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby checkpoints' });
  }
};

// Add reaction (like/dislike) to checkpoint
export const reactToCheckpoint = async (req, res) => {
  try {
    const { type } = req.body;
    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    const result = await Checkpoint.addReaction(req.user.id, req.params.id, type);
    res.json(result);
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

// Get user's reaction to a checkpoint
export const getCheckpointReaction = async (req, res) => {
  try {
    const reaction = await Checkpoint.getUserReaction(req.user.id, req.params.id);
    res.json({ reaction });
  } catch (error) {
    console.error('Get reaction error:', error);
    res.status(500).json({ error: 'Failed to get reaction' });
  }
};

// Add comment to checkpoint
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment cannot exceed 1000 characters' });
    }

    const comment = await Checkpoint.addComment(req.user.id, req.params.id, content);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get comments for a checkpoint
export const getComments = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const comments = await Checkpoint.getComments(
      req.params.id,
      parseInt(limit),
      parseInt(offset)
    );
    res.json({ comments, limit, offset });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};

// Report a checkpoint as suspicious/fake
export const reportCheckpoint = async (req, res) => {
  try {
    const { reason } = req.body;
    const checkpointId = req.params.id;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Report reason is required' });
    }
    
    // Check if checkpoint exists
    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }
    
    // Check if user already reported this checkpoint
    const alreadyReported = await Checkpoint.hasUserReported(req.user.id, checkpointId);
    if (alreadyReported) {
      return res.status(400).json({ error: 'You have already reported this checkpoint' });
    }
    
    // Add report
    await Checkpoint.addReport(req.user.id, checkpointId, reason);
    
    // Get report count
    const reportCount = await Checkpoint.getReportCount(checkpointId);
    
    // If 5 or more reports, mark as suspicious
    if (reportCount >= 5) {
      await Checkpoint.updateStatus(checkpointId, 'suspicious');
    }
    
    res.json({ 
      message: 'Checkpoint reported successfully',
      reportCount
    });
  } catch (error) {
    console.error('Report checkpoint error:', error);
    res.status(500).json({ error: 'Failed to report checkpoint' });
  }
};

// Update checkpoint status (admin only - optional)
export const updateCheckpointStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const checkpointId = req.params.id;
    
    if (!['active', 'expired', 'suspicious', 'removed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const checkpoint = await Checkpoint.updateStatus(checkpointId, status);
    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }
    
    res.json({ message: 'Checkpoint status updated', checkpoint });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update checkpoint status' });
  }
};

// Delete a checkpoint (user can delete their own, admin can delete any)
export const deleteCheckpoint = async (req, res) => {
  try {
    const checkpointId = req.params.id;
    const checkpoint = await Checkpoint.findById(checkpointId);
    
    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }
    
    // Check if user owns this checkpoint or is admin (you can implement admin role)
    if (checkpoint.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own checkpoints' });
    }
    
    await Checkpoint.delete(checkpointId);
    res.json({ message: 'Checkpoint deleted successfully' });
  } catch (error) {
    console.error('Delete checkpoint error:', error);
    res.status(500).json({ error: 'Failed to delete checkpoint' });
  }
};