import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { logAudit } from '../services/auditService.js';

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
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const {
            subject_id,
            visit_id,
            drug_unit_id,
            qty_dispensed,
            qty_returned,
            reconciliation_date,
            comments,
            date_of_first_dose,  // Captured at dispense time
            pills_per_day        // Captured at dispense time (from protocol)
        } = req.body;

        // Check if record already exists
        const { data: existing } = await supabase
            .from('accountability')
            .select('*')
            .eq('subject_id', subject_id)
            .eq('visit_id', visit_id)
            .eq('drug_unit_id', drug_unit_id)
            .single();

        let result;
        let action: 'CREATE' | 'UPDATE' = 'CREATE';
        let oldValues = null;

        if (existing) {
            action = 'UPDATE';
            oldValues = { ...existing };

            // Update existing record
            const { data, error } = await supabase
                .from('accountability')
                .update({
                    qty_dispensed,
                    qty_returned,
                    reconciliation_date,
                    comments,
                    date_of_first_dose: date_of_first_dose || existing.date_of_first_dose,
                    pills_per_day: pills_per_day || existing.pills_per_day || 1,
                    updated_at: new Date().toISOString()
                })
                .eq('accountability_id', existing.accountability_id)
                .select();

            if (error) throw error;
            result = data[0];
        } else {
            // Create new record with first dose date captured at dispense
            const { data, error } = await supabase
                .from('accountability')
                .insert({
                    subject_id,
                    visit_id,
                    drug_unit_id,
                    qty_dispensed,
                    qty_returned,
                    reconciliation_date,
                    comments,
                    date_of_first_dose: date_of_first_dose || new Date().toISOString().split('T')[0], // Default to today
                    pills_per_day: pills_per_day || 1
                })
                .select();

            if (error) throw error;
            result = data[0];
        }

        // Log audit trail for DISPENSE action
        await logAudit({
            user_id: req.user?.userId,
            username: req.user?.username,
            action: action === 'CREATE' ? 'DISPENSE' : 'UPDATE',
            table_name: 'accountability',
            record_id: result.accountability_id.toString(),
            old_values: oldValues,
            new_values: {
                subject_id,
                visit_id,
                drug_unit_id,
                qty_dispensed,
                date_of_first_dose: result.date_of_first_dose,
                pills_per_day: result.pills_per_day,
                comments
            }
        });

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

// Update accountability record (for comments, dates, pills_per_day)
router.put('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { comments, date_of_first_dose, date_of_last_dose, pills_per_day, reason_for_change } = req.body;

        // Get existing record for audit trail
        const { data: existingRecord } = await supabase
            .from('accountability')
            .select('*')
            .eq('accountability_id', id)
            .single();

        // Build update object with only provided fields
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (comments !== undefined) updateData.comments = comments;
        if (date_of_first_dose !== undefined) updateData.date_of_first_dose = date_of_first_dose;
        if (date_of_last_dose !== undefined) updateData.date_of_last_dose = date_of_last_dose;
        if (pills_per_day !== undefined) updateData.pills_per_day = pills_per_day;

        // Recalculate compliance if dates are being updated
        if (date_of_first_dose !== undefined || date_of_last_dose !== undefined) {
            const { data: existing } = await supabase
                .from('accountability')
                .select('qty_dispensed, qty_returned, date_of_first_dose, date_of_last_dose, pills_per_day')
                .eq('accountability_id', id)
                .single();

            if (existing) {
                const effectiveFirstDose = date_of_first_dose || existing.date_of_first_dose;
                const effectiveLastDose = date_of_last_dose || existing.date_of_last_dose;
                const effectivePillsPerDay = pills_per_day || existing.pills_per_day || 1;

                if (effectiveFirstDose && effectiveLastDose && existing.qty_returned !== null) {
                    const firstDose = new Date(effectiveFirstDose);
                    const lastDose = new Date(effectiveLastDose);
                    const timeDiff = lastDose.getTime() - firstDose.getTime();
                    const days_used = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
                    const theoreticalExpected = days_used * effectivePillsPerDay;

                    // CRITICAL: Cap expected at qty_dispensed - can't expect more pills than were given!
                    const expected_pills = Math.min(theoreticalExpected, existing.qty_dispensed);

                    const pills_used = existing.qty_dispensed - existing.qty_returned;
                    const compliance_percentage = expected_pills > 0
                        ? Math.round((pills_used / expected_pills) * 10000) / 100
                        : null;

                    updateData.days_used = days_used;
                    updateData.expected_pills = expected_pills;
                    updateData.pills_used = pills_used;
                    updateData.compliance_percentage = compliance_percentage;
                }
            }
        }

        const { data, error } = await supabase
            .from('accountability')
            .update(updateData)
            .eq('accountability_id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Accountability record not found' });
        }

        // Log audit trail for UPDATE action
        await logAudit({
            user_id: req.user?.userId,
            username: req.user?.username,
            action: 'UPDATE',
            table_name: 'accountability',
            record_id: id,
            old_values: existingRecord ? {
                comments: existingRecord.comments,
                date_of_first_dose: existingRecord.date_of_first_dose,
                date_of_last_dose: existingRecord.date_of_last_dose,
                pills_per_day: existingRecord.pills_per_day
            } : undefined,
            new_values: {
                comments,
                date_of_first_dose,
                date_of_last_dose,
                pills_per_day
            },
            reason_for_change: reason_for_change || 'Data correction'
        });

        res.json(data[0]);
    } catch (error: any) {
        console.error('Error updating accountability:', error);
        res.status(500).json({ error: error.message });
    }
});

// Record return for existing accountability record with enhanced compliance calculation
router.put('/:id/return', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const {
            qty_returned,
            return_date,
            date_of_first_dose,
            date_of_last_dose,
            pills_per_day,
            return_status,  // RETURNED, NOT_RETURNED, WASTED, LOST, DESTROYED
            comments
        } = req.body;

        // Validate qty_returned doesn't exceed qty_dispensed and get existing data
        const { data: existing, error: fetchError } = await supabase
            .from('accountability')
            .select('*')
            .eq('accountability_id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ error: 'Accountability record not found' });
        }

        if (qty_returned > existing.qty_dispensed) {
            return res.status(400).json({
                error: `Cannot return more than dispensed (${existing.qty_dispensed})`
            });
        }

        // Calculate compliance metrics
        let days_used = null;
        let expected_pills = null;
        let pills_used = null;
        let compliance_percentage = null;

        // Pills used = dispensed - returned (in bottle)
        pills_used = existing.qty_dispensed - qty_returned;

        // Calculate days used if both dates provided
        if (date_of_first_dose && date_of_last_dose) {
            const firstDose = new Date(date_of_first_dose);
            const lastDose = new Date(date_of_last_dose);
            const timeDiff = lastDose.getTime() - firstDose.getTime();
            days_used = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days

            // Calculate expected pills
            const pillsPerDayValue = pills_per_day || 1;
            const theoreticalExpected = days_used * pillsPerDayValue;

            // CRITICAL: Cap expected at qty_dispensed - can't expect more pills than were given!
            expected_pills = Math.min(theoreticalExpected, existing.qty_dispensed);

            // Calculate compliance percentage
            // Compliance = (Pills Used / Expected Pills) × 100
            if (expected_pills > 0) {
                compliance_percentage = Math.round((pills_used / expected_pills) * 10000) / 100; // Round to 2 decimal places
            }
        }

        // Update the accountability record with return data and compliance calculations
        const { data, error } = await supabase
            .from('accountability')
            .update({
                qty_returned,
                return_date: return_date || new Date().toISOString(),
                date_of_first_dose: date_of_first_dose || null,
                date_of_last_dose: date_of_last_dose || null,
                pills_per_day: pills_per_day || 1,
                return_status: return_status || 'RETURNED',  // Default to RETURNED
                days_used,
                expected_pills,
                pills_used,
                compliance_percentage,
                reconciliation_date: new Date().toISOString(),
                comments,
                updated_at: new Date().toISOString()
            })
            .eq('accountability_id', id)
            .select();

        if (error) throw error;

        // Optionally update the drug unit status to reflect return
        if (existing.drug_unit_id) {
            await supabase
                .from('drug_units')
                .update({
                    status: 'Returned',
                    updated_at: new Date().toISOString()
                })
                .eq('drug_unit_id', existing.drug_unit_id);
        }

        // Log audit trail for RETURN action
        await logAudit({
            user_id: req.user?.userId,
            username: req.user?.username,
            action: 'RETURN',
            table_name: 'accountability',
            record_id: id,
            old_values: {
                qty_returned: existing.qty_returned,
                return_date: existing.return_date,
                date_of_last_dose: existing.date_of_last_dose,
                compliance_percentage: existing.compliance_percentage
            },
            new_values: {
                qty_returned,
                return_date: return_date || new Date().toISOString(),
                date_of_first_dose,
                date_of_last_dose,
                pills_per_day,
                pills_used,
                compliance_percentage,
                comments
            },
            reason_for_change: comments || 'Medication return processed' // Use comments as reason
        });

        res.json(data[0]);
    } catch (error: any) {
        console.error('Error recording return:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
