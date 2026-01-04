import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Log pill counter API responses for debugging (console only - no file IO)
router.post('/log-pill-count', authenticateToken, async (req: any, res) => {
    try {
        const { timestamp, imageFileName, apiResponse, filteredCount, totalCount, wholePills, halfPills, fragments } = req.body;

        // Format log entry
        const logEntry = {
            timestamp: timestamp || new Date().toISOString(),
            user: req.user?.username,
            imageFileName,
            totalDetections: totalCount,
            filteredCount,
            wholePills,
            halfPills,
            fragments,
            predictions: apiResponse?.predictions?.length || 0
        };

        // Log to console (viewable in Cloud Run logs)
        console.log('📊 PILL COUNT LOG:', JSON.stringify(logEntry, null, 2));

        res.json({ success: true, message: 'Logged successfully' });
    } catch (error: any) {
        console.error('Error logging pill count:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
