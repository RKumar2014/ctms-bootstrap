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

async function keepOnly4PerDrugCode() {
    console.log('🧹 Keeping only 4 drug units per drug code...\n');

    try {
        // Get all drug units
        const { data: drugUnits, error } = await supabase
            .from('drug_units')
            .select('drug_unit_id, drug_code, lot_number, status')
            .order('drug_code', { ascending: true })
            .order('drug_unit_id', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch drug units: ${error.message}`);
        }

        // Group by drug_code
        const groupedByCode: Record<string, any[]> = {};
        drugUnits?.forEach(unit => {
            if (!groupedByCode[unit.drug_code]) {
                groupedByCode[unit.drug_code] = [];
            }
            groupedByCode[unit.drug_code].push(unit);
        });

        console.log('📊 Current state:\n');
        Object.entries(groupedByCode).forEach(([code, units]) => {
            console.log(`${code}: ${units.length} units`);
        });

        // Identify units to delete (keep first 4, delete rest)
        const unitsToDelete: number[] = [];
        const unitsToKeep: number[] = [];

        Object.entries(groupedByCode).forEach(([code, units]) => {
            console.log(`\n📦 Processing ${code}:`);

            units.forEach((unit, index) => {
                if (index < 4) {
                    // Keep first 4
                    unitsToKeep.push(unit.drug_unit_id);
                    console.log(`  ✅ KEEP: ID ${unit.drug_unit_id} (${unit.lot_number})`);
                } else {
                    // Delete the rest
                    unitsToDelete.push(unit.drug_unit_id);
                    console.log(`  ❌ DELETE: ID ${unit.drug_unit_id} (${unit.lot_number})`);
                }
            });
        });

        if (unitsToDelete.length === 0) {
            console.log('\n✅ No units to delete. All drug codes already have 4 or fewer units.');
            return;
        }

        console.log(`\n🗑️  Deleting ${unitsToDelete.length} drug units...`);
        console.log(`📌 Keeping ${unitsToKeep.length} drug units\n`);

        // Delete the excess units
        const { error: deleteError } = await supabase
            .from('drug_units')
            .delete()
            .in('drug_unit_id', unitsToDelete);

        if (deleteError) {
            throw new Error(`Failed to delete drug units: ${deleteError.message}`);
        }

        console.log('✅ Deletion completed successfully!\n');

        // Verify the result
        console.log('✅ Verifying final state...\n');
        const { data: remainingUnits, error: verifyError } = await supabase
            .from('drug_units')
            .select('drug_unit_id, drug_code, lot_number')
            .order('drug_code', { ascending: true })
            .order('drug_unit_id', { ascending: true });

        if (verifyError) {
            throw new Error(`Failed to verify: ${verifyError.message}`);
        }

        const finalGrouped: Record<string, any[]> = {};
        remainingUnits?.forEach(unit => {
            if (!finalGrouped[unit.drug_code]) {
                finalGrouped[unit.drug_code] = [];
            }
            finalGrouped[unit.drug_code].push(unit);
        });

        console.log('📦 Final drug units:\n');
        Object.entries(finalGrouped).forEach(([code, units]) => {
            console.log(`${code}: ${units.length} units`);
            units.forEach((unit, index) => {
                console.log(`  ${index + 1}. ID: ${unit.drug_unit_id}, Lot: ${unit.lot_number}`);
            });
            console.log('');
        });

        console.log(`\n✨ Cleanup completed!`);
        console.log(`📋 Summary:`);
        console.log(`   - Deleted: ${unitsToDelete.length} drug units`);
        console.log(`   - Remaining: ${remainingUnits?.length || 0} drug units`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

keepOnly4PerDrugCode();
