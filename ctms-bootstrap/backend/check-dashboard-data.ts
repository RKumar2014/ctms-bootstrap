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

async function checkDatabaseData() {
    console.log('📊 Checking database data for dashboard...\n');

    try {
        // Get subjects count
        const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .select('subject_id, subject_number, status')
            .order('subject_id', { ascending: true });

        if (subjectsError) {
            throw new Error(`Failed to fetch subjects: ${subjectsError.message}`);
        }

        console.log('👥 Subjects:');
        console.log(`   Total: ${subjects?.length || 0}`);
        if (subjects && subjects.length > 0) {
            const activeSubjects = subjects.filter(s => s.status === 'Active' || s.status === 'Enrolled');
            console.log(`   Active/Enrolled: ${activeSubjects.length}`);
            subjects.forEach(s => {
                console.log(`   - ${s.subject_number}: ${s.status}`);
            });
        } else {
            console.log('   No subjects found');
        }

        // Get drug units count
        const { data: drugUnits, error: drugUnitsError } = await supabase
            .from('drug_units')
            .select('drug_unit_id, drug_code, status')
            .order('drug_unit_id', { ascending: true });

        if (drugUnitsError) {
            throw new Error(`Failed to fetch drug units: ${drugUnitsError.message}`);
        }

        console.log('\n💊 Drug Units:');
        console.log(`   Total: ${drugUnits?.length || 0}`);
        if (drugUnits && drugUnits.length > 0) {
            const available = drugUnits.filter(d => d.status === 'Available');
            const dispensed = drugUnits.filter(d => d.status === 'Dispensed');
            const returned = drugUnits.filter(d => d.status === 'Returned');

            console.log(`   Available: ${available.length}`);
            console.log(`   Dispensed: ${dispensed.length}`);
            console.log(`   Returned: ${returned.length}`);

            drugUnits.forEach(d => {
                console.log(`   - ID ${d.drug_unit_id}: ${d.drug_code} - ${d.status}`);
            });
        } else {
            console.log('   No drug units found');
        }

        console.log('\n✅ Data check complete!');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabaseData();
