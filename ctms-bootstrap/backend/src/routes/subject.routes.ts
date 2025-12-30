import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createSubjectSchema = z.object({
    subjectNumber: z.string().min(1),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sex: z.enum(['Male', 'Female', 'Other']),
    consentDate: z.string(),
    siteId: z.number().optional(),
});

// GET /api/subjects
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { site, status } = req.query;

        let query = supabase
            .from('subjects')
            .select(`
        *,
        sites (site_number, site_name),
        subject_visits!inner (
          visit_id,
          expected_date,
          actual_date,
          status,
          visits (visit_name, visit_sequence)
        )
      `)
            .order('created_at', { ascending: false });

        if (site) {
            query = query.eq('site_id', site);
        }
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Process data to add next visit info
        const processedData = data?.map(subject => {
            // Find next scheduled visit (not completed)
            const nextVisit = subject.subject_visits
                ?.filter((sv: any) => sv.status === 'Scheduled' && !sv.actual_date)
                .sort((a: any, b: any) => {
                    const aSeq = a.visits?.visit_sequence || 0;
                    const bSeq = b.visits?.visit_sequence || 0;
                    return aSeq - bSeq;
                })[0];

            return {
                ...subject,
                next_visit_name: nextVisit?.visits?.visit_name || null,
                next_visit_date: nextVisit?.expected_date || null
            };
        });

        res.json(processedData);
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// GET /api/subjects/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('subjects')
            .select(`
        *,
        sites (site_number, site_name),
        subject_visits (
          *,
          visits (visit_name, visit_sequence)
        )
      `)
            .eq('subject_id', id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ error: 'Failed to fetch subject' });
    }
});

// GET /api/subjects/:id/visits - Get visits for a specific subject
router.get('/:id/visits', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('subject_visits')
            .select(`
                subject_visit_id,
                visit_id,
                expected_date,
                actual_date,
                status,
                visits (visit_id, visit_name, visit_sequence)
            `)
            .eq('subject_id', id)
            .order('visits(visit_sequence)', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get subject visits error:', error);
        res.status(500).json({ error: 'Failed to fetch subject visits' });
    }
});

// POST /api/subjects
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = createSubjectSchema.parse(req.body);

        const { data, error } = await supabase
            .from('subjects')
            .insert([{
                subject_number: validatedData.subjectNumber,
                dob: validatedData.dob,
                sex: validatedData.sex,
                consent_date: validatedData.consentDate,
                enrollment_date: new Date().toISOString(),
                site_id: validatedData.siteId || req.user?.siteId,
                status: 'Active',
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Create subject error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

// PUT /api/subjects/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { dob, sex, status } = req.body;

        const { data, error } = await supabase
            .from('subjects')
            .update({ dob, sex, status })
            .eq('subject_id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: 'Failed to update subject' });
    }
});

export default router;
