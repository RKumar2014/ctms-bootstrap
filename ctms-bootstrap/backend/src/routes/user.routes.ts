// backend/routes/user.routes.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Valid roles for the system
const VALID_ROLES = ['admin', 'coordinator', 'monitor', 'auditor', 'doctor'];

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, username, email, role, site_id, created_at')
      .eq('user_id', authReq.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { email } = req.body;
    const userId = authReq.user.userId;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ email })
      .eq('user_id', userId)
      .select('user_id, username, email, role, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================

// GET /api/user/list - List all users (admin only)
router.get('/list', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
                user_id,
                username,
                email,
                role,
                site_id,
                is_active,
                created_at,
                sites (site_number, site_name)
            `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/user - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, role, site_id } = req.body;

    // Validate required fields
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: 'Username, password, email, and role are required' });
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    // Non-admin roles should have a site assigned
    if (role !== 'admin' && !site_id) {
      return res.status(400).json({
        error: 'Non-admin users must be assigned to a site'
      });
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        email,
        role,
        site_id: role === 'admin' ? null : site_id,
        is_active: true
      })
      .select('user_id, username, email, role, site_id, is_active, created_at')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/user/:id - Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role, site_id, is_active, password } = req.body;

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };

    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
        });
      }
      updateData.role = role;
    }
    if (site_id !== undefined) updateData.site_id = site_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    // If password is being changed, hash it
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', id)
      .select('user_id, username, email, role, site_id, is_active, created_at')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/user/:id - Deactivate user (admin only, soft delete)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete - just deactivate
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/roles - Get available roles
router.get('/roles', authenticateToken, async (req: AuthRequest, res: Response) => {
  res.json({
    roles: VALID_ROLES,
    descriptions: {
      admin: 'Full system access, can manage all sites and users',
      coordinator: 'Site coordinator, manages subjects and drug dispensing',
      monitor: 'Clinical monitor, read-only access for oversight',
      auditor: 'Audit access, can view audit logs and reports',
      doctor: 'Physician/Investigator, can view and approve clinical data'
    }
  });
});

export default router;