import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Get accountability records with filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { site_id, subject_id, visit_id } = req.query;

        let query = supabase
            .from('accountability')
            .select(`
                *,
                subject:subjects(subject_number, site_id),
                subject_visit:subject_visits(subject_visit_id, visit_id, visit_details:visits(visit_name)),
                drug_unit:drug_units(drug_unit_id, drug_code, lot_number, status, quantity_per_unit, unit_description)
            `);

        // Apply filters
        if (subject_id) {
            query = query.eq('subject_id', subject_id);
        }

        // If visit_id is not 'all', filter by it
        if (visit_id && visit_id !== 'all') {
            query = query.eq('visit_id', visit_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Filter by site if needed (since accountability doesn't have direct site_id)
        let filteredData = data;
        if (site_id) {
            filteredData = data?.filter((record: any) =>
                record.subject?.site_id?.toString() === site_id.toString()
            ) || [];
        }

        res.json(filteredData);
    } catch (error: any) {
        console.error('Error fetching accountability records:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create or update accountability record
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { subject_id, visit_id, drug_unit_id, qty_dispensed, qty_returned, reconciliation_date, comments } = req.body;

        // Check if record already exists
        const { data: existing } = await supabase
            .from('accountability')
            .select('*')
            .eq('subject_id', subject_id)
            .eq('visit_id', visit_id)
            .eq('drug_unit_id', drug_unit_id)
            .single();

        let result;
        if (existing) {
            // Update existing record
            const { data, error } = await supabase
                .from('accountability')
                .update({
                    qty_dispensed,
                    qty_returned,
                    reconciliation_date,
                    comments,
                    updated_at: new Date().toISOString()
                })
                .eq('accountability_id', existing.accountability_id)
                .select();

            if (error) throw error;
            result = data[0];
        } else {
            // Create new record
            const { data, error } = await supabase
                .from('accountability')
                .insert({
                    subject_id,
                    visit_id,
                    drug_unit_id,
                    qty_dispensed,
                    qty_returned,
                    reconciliation_date,
                    comments
                })
                .select();

            if (error) throw error;
            result = data[0];
        }

        res.json(result);
    } catch (error: any) {
        console.error('Error creating/updating accountability:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk submit accountability records
router.post('/bulk-submit', authenticateToken, async (req, res) => {
    try {
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'Records array is required' });
        }

        const results = [];
        for (const record of records) {
            const { subject_id, visit_id, drug_unit_id, qty_dispensed, qty_returned, reconciliation_date, comments } = record;

            // Check if exists
            const { data: existing } = await supabase
                .from('accountability')
                .select('*')
                .eq('subject_id', subject_id)
                .eq('visit_id', visit_id)
                .eq('drug_unit_id', drug_unit_id)
                .single();

            if (existing) {
                // Update
                const { data, error } = await supabase
                    .from('accountability')
                    .update({
                        qty_dispensed,
                        qty_returned,
                        reconciliation_date,
                        comments,
                        updated_at: new Date().toISOString()
                    })
                    .eq('accountability_id', existing.accountability_id)
                    .select();

                if (error) throw error;
                results.push(data[0]);
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('accountability')
                    .insert({
                        subject_id,
                        visit_id,
                        drug_unit_id,
                        qty_dispensed,
                        qty_returned,
                        reconciliation_date,
                        comments
                    })
                    .select();

                if (error) throw error;
                results.push(data[0]);
            }
        }

        res.json({
            message: `Successfully processed ${results.length} accountability record(s)`,
            count: results.length,
            data: results
        });
    } catch (error: any) {
        console.error('Error bulk submitting accountability:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
