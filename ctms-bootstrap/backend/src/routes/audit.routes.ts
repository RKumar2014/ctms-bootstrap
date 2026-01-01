// backend/src/routes/audit.routes.ts
// Audit Trail API Endpoints

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getAuditLogs, getAuditLogCount, getAuditEntry, formatAuditLogsForExport } from '../services/auditService.js';

const router = Router();

// Get audit logs with filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            user_id,
            action,
            table_name,
            record_id,
            start_date,
            end_date,
            limit = '50',
            offset = '0'
        } = req.query;

        const filters = {
            user_id: user_id as string,
            action: action as string,
            table_name: table_name as string,
            record_id: record_id as string,
            start_date: start_date as string,
            end_date: end_date as string,
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10)
        };

        const [logs, totalCount] = await Promise.all([
            getAuditLogs(filters),
            getAuditLogCount(filters)
        ]);

        res.json({
            data: logs,
            pagination: {
                total: totalCount,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: filters.offset + filters.limit < totalCount
            }
        });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single audit entry
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await getAuditEntry(parseInt(id, 10));

        if (!entry) {
            return res.status(404).json({ error: 'Audit entry not found' });
        }

        res.json(entry);
    } catch (error: any) {
        console.error('Error fetching audit entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export audit logs as CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
    try {
        const {
            user_id,
            action,
            table_name,
            start_date,
            end_date
        } = req.query;

        const filters = {
            user_id: user_id as string,
            action: action as string,
            table_name: table_name as string,
            start_date: start_date as string,
            end_date: end_date as string,
            limit: 10000, // Max export limit
            offset: 0
        };

        const logs = await getAuditLogs(filters);
        const exportData = formatAuditLogsForExport(logs);

        // Generate CSV
        if (exportData.length === 0) {
            return res.status(404).json({ error: 'No audit logs found for export' });
        }

        const headers = Object.keys(exportData[0]);
        const csvRows = [
            headers.join(','),
            ...exportData.map(row =>
                headers.map(header => {
                    const value = (row as any)[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value || '');
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ];

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit_log_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error: any) {
        console.error('Error exporting audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get distinct values for filters (for dropdown options)
router.get('/filters/options', authenticateToken, async (req, res) => {
    try {
        // Return available filter options
        const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'DISPENSE', 'RETURN', 'DESTROY', 'VIEW'];
        const tables = ['subjects', 'drug_units', 'accountability', 'sites', 'users', 'subject_visits'];

        res.json({
            actions,
            tables
        });
    } catch (error: any) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
