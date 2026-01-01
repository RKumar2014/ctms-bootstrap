import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get sites (filtered by user's assigned site for non-admin users)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        // Get user's site and role from JWT for HIPAA filtering
        const userSiteId = req.user?.siteId;
        const isAdmin = req.user?.role === 'admin';

        let query = supabase
            .from('sites')
            .select('*')
            .order('site_number');

        // HIPAA: Non-admin users can only see their assigned site
        if (!isAdmin && userSiteId) {
            query = query.eq('site_id', userSiteId);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

