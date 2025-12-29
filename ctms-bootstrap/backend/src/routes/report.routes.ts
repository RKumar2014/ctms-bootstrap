import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken);

// GET /api/reports/subject-summary
router.get('/subject-summary', async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('subjects')
            .select(`
        subject_id,
        subject_number,
        dob,
        sex,
        status,
        consent_date,
        enrollment_date,
        sites (site_number, site_name)
      `)
            .order('enrollment_date', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Subject summary report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// GET /api/reports/site-enrollment
router.get('/site-enrollment', async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await supabase.rpc('get_site_enrollment_summary');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Site enrollment report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// GET /api/reports/drug-accountability
router.get('/drug-accountability', async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('accountability')
            .select(`
        *,
        subjects (subject_number),
        drug_units (drug_code, lot_number),
        subject_visits (
          visits (visit_name)
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Drug accountability report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

export default router;
