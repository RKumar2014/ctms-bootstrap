import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/drug/master-log - Get full bottle lifecycle for site (Master Accountability Log)
router.get('/master-log', authenticateToken, async (req, res) => {
    try {
        const { site_id } = req.query;

        let query = supabase
            .from('drug_units')
            .select(`
                *,
                site:sites(site_id, site_number, site_name),
                subject:subjects(subject_id, subject_number),
                accountability(
                    accountability_id,
                    qty_dispensed,
                    qty_returned,
                    return_date,
                    reconciliation_date,
                    comments,
                    created_at,
                    date_of_first_dose,
                    date_of_last_dose,
                    pills_per_day,
                    days_used,
                    expected_pills,
                    pills_used,
                    compliance_percentage,
                    subject_visit:subject_visits(
                        subject_visit_id,
                        visit_id,
                        visit:visits(visit_id, visit_name, visit_sequence)
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (site_id) {
            query = query.eq('site_id', site_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform to flat structure for table display
        // Use STORED VALUES from accountability - no recalculation needed!
        const flattenedData = data?.map((unit: any) => {
            const accountability = unit.accountability?.[0];

            return {
                drugUnitId: unit.drug_unit_id,
                drugCode: unit.drug_code,
                lotNumber: unit.lot_number,
                expirationDate: unit.expiration_date,
                quantityPerUnit: unit.quantity_per_unit || 30,
                status: unit.status,
                siteId: unit.site?.site_id,
                siteNumber: unit.site?.site_number,
                siteName: unit.site?.site_name,
                // Subject info (from drug_unit or accountability)
                subjectId: unit.subject?.subject_id,
                subjectNumber: unit.subject?.subject_number,
                // From accountability (STORED VALUES - not recalculated)
                accountabilityId: accountability?.accountability_id,
                qtyDispensed: accountability?.qty_dispensed || 0,
                qtyReturned: accountability?.qty_returned || 0,
                pillsUsed: accountability?.pills_used,
                compliance: accountability?.compliance_percentage,
                daysUsed: accountability?.days_used,
                expectedPills: accountability?.expected_pills,
                returnDate: accountability?.return_date,
                reconciliationDate: accountability?.reconciliation_date,
                dispenseDate: accountability?.created_at,
                visitName: accountability?.subject_visit?.visit?.visit_name,
                visitSequence: accountability?.subject_visit?.visit?.visit_sequence,
                comments: accountability?.comments,
                // Audit fields
                assignedDate: unit.assigned_date,
                createdAt: unit.created_at,
                updatedAt: unit.updated_at
            };
        });

        res.json(flattenedData);
    } catch (error: any) {
        console.error('Error fetching master log:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/drug/master-log/summary - Get summary statistics
router.get('/master-log/summary', authenticateToken, async (req, res) => {
    try {
        const { site_id } = req.query;

        let query = supabase
            .from('drug_units')
            .select('status, drug_code');

        if (site_id) {
            query = query.eq('site_id', site_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Calculate summary statistics
        const summary = {
            total: data?.length || 0,
            available: data?.filter((d: any) => d.status === 'Available').length || 0,
            dispensed: data?.filter((d: any) => d.status === 'Dispensed').length || 0,
            returned: data?.filter((d: any) => d.status === 'Returned').length || 0,
            destroyed: data?.filter((d: any) => d.status === 'Destroyed').length || 0,
            missing: data?.filter((d: any) => d.status === 'Missing').length || 0,
            byDrugCode: {} as Record<string, number>
        };

        // Group by drug code
        data?.forEach((d: any) => {
            const code = d.drug_code || 'Unknown';
            summary.byDrugCode[code] = (summary.byDrugCode[code] || 0) + 1;
        });

        res.json(summary);
    } catch (error: any) {
        console.error('Error fetching master log summary:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
