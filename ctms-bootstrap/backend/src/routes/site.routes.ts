import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Get all sites
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('site_number');

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
