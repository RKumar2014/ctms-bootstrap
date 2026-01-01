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

async function clearAccountabilityAndMasterLog() {
    console.log('🧹 Starting cleanup of accountability table and master log records...\n');

    try {
        // Step 1: Get counts before deletion
        console.log('📊 Checking current record counts...');
        const { count: accountabilityCount } = await supabase
            .from('accountability')
            .select('*', { count: 'exact', head: true });

        const { count: drugUnitsCount } = await supabase
            .from('drug_units')
            .select('*', { count: 'exact', head: true });

        console.log(`   - Accountability records: ${accountabilityCount}`);
        console.log(`   - Drug units: ${drugUnitsCount}\n`);

        // Step 2: Delete all accountability records
        console.log('🗑️  Deleting all accountability records...');
        const { error: deleteError } = await supabase
            .from('accountability')
            .delete()
            .neq('accountability_id', 0); // Delete all records

        if (deleteError) {
            throw new Error(`Failed to delete accountability records: ${deleteError.message}`);
        }
        console.log('✅ Accountability table cleared successfully\n');

        // Step 3: Optional - Reset drug_units to Available status
        console.log('🔄 Resetting drug units to Available status...');
        const { error: updateError } = await supabase
            .from('drug_units')
            .update({
                status: 'Available',
                subject_id: null,
                assigned_date: null,
                updated_at: new Date().toISOString()
            })
            .neq('drug_unit_id', 0); // Update all records

        if (updateError) {
            console.warn(`⚠️  Warning: Failed to reset drug units: ${updateError.message}`);
        } else {
            console.log('✅ Drug units reset to Available status\n');
        }

        // Step 4: Verify cleanup
        console.log('✅ Verifying cleanup...');
        const { count: newAccountabilityCount } = await supabase
            .from('accountability')
            .select('*', { count: 'exact', head: true });

        const { data: drugUnitsStatus } = await supabase
            .from('drug_units')
            .select('status')
            .eq('status', 'Available');

        console.log(`   - Accountability records remaining: ${newAccountabilityCount}`);
        console.log(`   - Drug units with Available status: ${drugUnitsStatus?.length || 0}`);

        console.log('\n✨ Cleanup completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Deleted ${accountabilityCount} accountability records`);
        console.log(`   - Reset ${drugUnitsCount} drug units to Available status`);

    } catch (error: any) {
        console.error('\n❌ Error during cleanup:', error.message);
        process.exit(1);
    }
}

// Run the cleanup
clearAccountabilityAndMasterLog();
