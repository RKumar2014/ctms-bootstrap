import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

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
        // Get all subjects with site information
        const { data: subjects, error } = await supabase
            .from('subjects')
            .select(`
                subject_id,
                subject_number,
                status,
                enrollment_date,
                termination_date,
                site_id,
                sites!inner(site_id, site_number, site_name)
            `);

        if (error) throw error;

        // Get all sites to ensure we show all sites even if they have no subjects
        const { data: allSites, error: sitesError } = await supabase
            .from('sites')
            .select('site_id, site_number, site_name')
            .order('site_number', { ascending: true });

        if (sitesError) throw sitesError;

        // Calculate enrollment statistics per site
        const siteStats = (allSites || []).map(site => {
            const siteSubjects = (subjects || []).filter(s => s.site_id === site.site_id);

            const enrolled = siteSubjects.filter(s => s.status === 'Active').length;
            const completed = siteSubjects.filter(s => s.status === 'Completed').length;
            const terminated = siteSubjects.filter(s => s.status === 'Terminated').length;

            return {
                site: site.site_number,
                site_name: site.site_name,
                enrolled,
                completed,
                terminated,
                total: siteSubjects.length
            };
        });

        // Calculate totals
        const totals = {
            enrolled: siteStats.reduce((sum, s) => sum + s.enrolled, 0),
            completed: siteStats.reduce((sum, s) => sum + s.completed, 0),
            terminated: siteStats.reduce((sum, s) => sum + s.terminated, 0),
            total: siteStats.reduce((sum, s) => sum + s.total, 0)
        };

        res.json({
            sites: siteStats,
            totals
        });
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
 