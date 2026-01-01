import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all drug units (filtered by site for non-admin users)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        // Get user's site and role from JWT for HIPAA filtering
        const userSiteId = req.user?.siteId;
        const isAdmin = req.user?.role === 'admin';

        let query = supabase
            .from('drug_units')
            .select('*')
            .order('drug_unit_id');

        // HIPAA: Non-admin users can only see drug units from their assigned site
        if (!isAdmin && userSiteId) {
            query = query.eq('site_id', userSiteId);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching drug units:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get drug units by site
router.get('/site/:siteId', authenticateToken, async (req, res) => {
    try {
        const { siteId } = req.params;

        const { data, error } = await supabase
            .from('drug_units')
            .select('*')
            .eq('site_id', siteId)
            .order('drug_unit_id');

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching drug units by site:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update drug unit status
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, subject_id, assigned_date } = req.body;

        // Build update object with only provided fields
        const updateData: any = {};
        if (status) updateData.status = status;
        if (subject_id !== undefined) updateData.subject_id = subject_id;
        if (assigned_date) updateData.assigned_date = assigned_date;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('drug_units')
            .update(updateData)
            .eq('drug_unit_id', id)
            .select();

        if (error) throw error;

        console.log(`Drug unit ${id} updated:`, updateData);
        res.json(data[0]);
    } catch (error: any) {
        console.error('Error updating drug unit:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk update drug units by site
router.put('/bulk-update-site/:siteId', authenticateToken, async (req, res) => {
    try {
        const { siteId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        // Update all drug units at the site
        const { data, error } = await supabase
            .from('drug_units')
            .update({ status })
            .eq('site_id', siteId)
            .select();

        if (error) throw error;

        res.json({
            message: `Successfully updated ${data.length} drug unit(s) to ${status}`,
            count: data.length,
            data
        });
    } catch (error: any) {
        console.error('Error bulk updating drug units:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
