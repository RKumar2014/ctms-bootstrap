import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env from current directory
dotenv.config();

console.log('🔍 Testing Supabase connection...');
console.log('URL from .env:', process.env.SUPABASE_URL);
console.log('Key present:', !!process.env.SUPABASE_ANON_KEY);
console.log('Service key present:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('---');

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Test: Try to query users table
console.log('Test: Attempting to query users table...');
supabase
    .from('users')
    .select('username')
    .limit(1)
    .then(({ data, error }) => {
        if (error) {
            console.error('❌ Query failed:', error);
        } else {
            console.log('✅ Query successful!');
            console.log('Data:', data);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection error:', err);
        process.exit(1);
    });
