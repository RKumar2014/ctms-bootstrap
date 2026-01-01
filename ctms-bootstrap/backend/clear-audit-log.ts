import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAuditLog() {
    console.log('🗑️  Clearing audit log...\n');

    try {
        // Get count of audit log entries before deletion
        const { count: beforeCount } = await supabase
            .from('audit_log')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Current audit log entries: ${beforeCount || 0}`);

        // Delete all audit log entries
        const { error: deleteError, count: deletedCount } = await supabase
            .from('audit_log')
            .delete()
            .neq('audit_id', 0); // Delete all (neq 0 matches everything)

        if (deleteError) {
            throw new Error(`Failed to delete audit log: ${deleteError.message}`);
        }

        console.log(`\n✅ Successfully deleted ${beforeCount || 0} audit log entries`);
        console.log('\n⚠️  NOTE: In production, audit logs should be ARCHIVED, not deleted!');
        console.log('   This is only for development/testing purposes.');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

clearAuditLog();
