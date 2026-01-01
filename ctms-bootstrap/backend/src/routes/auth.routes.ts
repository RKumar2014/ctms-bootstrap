import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { z } from 'zod';

const router = Router();

// Validation schemas
const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        // Fetch user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        console.log('🔍 Login attempt for username:', username);
        console.log('👤 User found:', !!user);
        console.log('❌ Supabase error:', error);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Password valid:', validPassword);
        console.log('📝 Hash from DB:', user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                siteId: user.site_id,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                siteId: user.site_id,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: 'Logged out successfully' });
});

export default router;
