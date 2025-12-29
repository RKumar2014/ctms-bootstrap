// backend/routes/user.routes.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // User info is already attached to req.user by authenticateToken middleware
    // Remove sensitive data before sending
    const { password_hash, ...userProfile } = req.user;

    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Update user in database
    const { data, error } = await req.supabase
      .from('users')
      .update({ email })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Remove sensitive data
    const { password_hash, ...userProfile } = data;
    res.json(userProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;