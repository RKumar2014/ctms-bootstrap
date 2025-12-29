import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/drug-units
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { site, status } = req.query;

        let query = supabase
            .from('drug_units')
            .select('*')
            .order('created_at', { ascending: false });

        if (site) query = query.eq('site_id', site);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get drug units error:', error);
        res.status(500).json({ error: 'Failed to fetch drug units' });
    }
});

// POST /api/drug-units
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { drugCode, lotNumber, expirationDate, siteId } = req.body;

        const { data, error } = await supabase
            .from('drug_units')
            .insert([{
                drug_code: drugCode,
                lot_number: lotNumber,
                expiration_date: expirationDate,
                site_id: siteId || req.user?.siteId,
                status: 'Available',
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Create drug unit error:', error);
        res.status(500).json({ error: 'Failed to create drug unit' });
    }
});

export default router;
