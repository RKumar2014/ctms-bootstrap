import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
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
        sites (site_number, site_name)
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

        res.json(data);
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
