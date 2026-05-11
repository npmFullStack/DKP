import { Checkpoint } from '../models/Checkpoint.js';
import { Notification } from '../models/Notification.js';

export const createCheckpoint = async (req, res) => {
  try {
    const checkpointData = {
      ...req.body,
      reportedBy: req.user.id,
      imageUrls: req.body.imageUrls || []
    };

    const checkpoint = await Checkpoint.create(checkpointData);
    
    // Create notifications for other users
    await Notification.createNewCheckpointNotification(
      checkpoint.id,
      req.user.id,
      checkpoint.title,
      checkpoint.barangay
    );

    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({ error: 'Failed to create checkpoint' });
  }
};

export const getCheckpoints = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    const result = await Checkpoint.findAll({
      status: 'active',
      limit: parseInt(limit),
      offset: parseInt(offset),
      search
    });
    res.json(result);
  } catch (error) {
    console.error('Get checkpoints error:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
};

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

export const getCheckpointReaction = async (req, res) => {
  try {
    const reaction = await Checkpoint.getUserReaction(req.user.id, req.params.id);
    res.json({ reaction });
  } catch (error) {
    console.error('Get reaction error:', error);
    res.status(500).json({ error: 'Failed to get reaction' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await Checkpoint.addComment(req.user.id, req.params.id, content);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

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