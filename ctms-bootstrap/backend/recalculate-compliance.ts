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

async function recalculateCompliance() {
    console.log('🔄 Recalculating compliance with correct formula (capping expected pills)...\n');

    try {
        // Get all accountability records with returns
        const { data: records, error } = await supabase
            .from('accountability')
            .select('*')
            .not('qty_returned', 'is', null);

        if (error) throw error;

        console.log(`Found ${records?.length || 0} accountability records with returns\n`);

        for (const record of records || []) {
            if (!record.date_of_first_dose || !record.date_of_last_dose) {
                console.log(`⏭️  Skipping record ${record.accountability_id} - missing dates`);
                continue;
            }

            const firstDose = new Date(record.date_of_first_dose);
            const lastDose = new Date(record.date_of_last_dose);
            const timeDiff = lastDose.getTime() - firstDose.getTime();
            const days_used = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
            const pillsPerDay = record.pills_per_day || 1;
            const theoreticalExpected = days_used * pillsPerDay;

            // CRITICAL: Cap expected at qty_dispensed
            const expected_pills = Math.min(theoreticalExpected, record.qty_dispensed);

            const pills_used = record.qty_dispensed - record.qty_returned;
            const compliance_percentage = expected_pills > 0
                ? Math.round((pills_used / expected_pills) * 10000) / 100
                : null;

            console.log(`\n🔹 Accountability ID: ${record.accountability_id}`);
            console.log(`   Drug Unit: ${record.drug_unit_id}`);
            console.log(`   OLD: Expected=${record.expected_pills}, Compliance=${record.compliance_percentage}%`);
            console.log(`   NEW: Expected=${expected_pills}, Compliance=${compliance_percentage}%`);

            // Update the record
            const { error: updateError } = await supabase
                .from('accountability')
                .update({
                    days_used,
                    expected_pills,
                    pills_used,
                    compliance_percentage
                })
                .eq('accountability_id', record.accountability_id);

            if (updateError) {
                console.error(`   ❌ Failed to update: ${updateError.message}`);
            } else {
                console.log(`   ✅ Updated successfully`);
            }
        }

        console.log('\n✅ Compliance recalculation complete!');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

recalculateCompliance();
