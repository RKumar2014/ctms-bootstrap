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

async function checkDrugUnits() {
    console.log('📊 Checking current drug units...\n');

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

        console.log('📦 Drug Units by Code:\n');
        Object.entries(groupedByCode).forEach(([code, units]) => {
            console.log(`${code}: ${units.length} units`);
            units.forEach((unit, index) => {
                console.log(`  ${index + 1}. ID: ${unit.drug_unit_id}, Lot: ${unit.lot_number}, Status: ${unit.status}`);
            });
            console.log('');
        });

        console.log(`\n📊 Total: ${drugUnits?.length || 0} drug units across ${Object.keys(groupedByCode).length} drug codes`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

checkDrugUnits();
