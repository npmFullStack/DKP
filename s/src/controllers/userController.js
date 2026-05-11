// src/controllers/userController.js
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';

export const updateProfile = async (req, res) => {
  try {
    const { username, email, avatar } = req.body;
    const user = await User.updateUser(req.user.id, { username, email, avatar });
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    const fullUser = await User.findByUsername(user.username);
    
    const isValid = await User.verifyPassword(fullUser, currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    await User.updatePassword(req.user.id, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getByUserId(req.user.id);
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { notification_new_checkpoint, notification_checkpoint_expired } = req.body;
    const settings = await Settings.update(req.user.id, {
      notification_new_checkpoint,
      notification_checkpoint_expired
    });
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};