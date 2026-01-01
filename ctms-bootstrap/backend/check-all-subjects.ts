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

async function checkAllSubjects() {
    console.log('📊 Checking ALL subjects in database...\n');

    try {
        // Get ALL subjects with site information
        const { data: subjects, error } = await supabase
            .from('subjects')
            .select(`
                subject_id,
                subject_number,
                status,
                enrollment_date,
                termination_date,
                site:sites(site_id, site_number, site_name)
            `)
            .order('subject_id', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch subjects: ${error.message}`);
        }

        console.log(`📋 Total Subjects: ${subjects?.length || 0}\n`);

        if (subjects && subjects.length > 0) {
            // Group by status
            const active = subjects.filter(s => s.status === 'Active');
            const completed = subjects.filter(s => s.status === 'Completed');
            const terminated = subjects.filter(s => s.status === 'Terminated');

            console.log('📊 By Status:');
            console.log(`   Active: ${active.length}`);
            console.log(`   Completed: ${completed.length}`);
            console.log(`   Terminated: ${terminated.length}\n`);

            // Group by site
            const bySite: Record<string, any[]> = {};
            subjects.forEach(s => {
                const siteNum = s.site?.site_number || 'Unknown';
                if (!bySite[siteNum]) {
                    bySite[siteNum] = [];
                }
                bySite[siteNum].push(s);
            });

            console.log('📊 By Site:');
            Object.entries(bySite).forEach(([siteNum, subs]) => {
                console.log(`\n   Site ${siteNum}: ${subs.length} subjects`);
                subs.forEach(s => {
                    console.log(`      - ${s.subject_number}: ${s.status}`);
                });
            });

            console.log('\n\n📋 All Subjects Details:');
            subjects.forEach(s => {
                console.log(`   ${s.subject_number} (ID: ${s.subject_id})`);
                console.log(`      Site: ${s.site?.site_number || 'Unknown'}`);
                console.log(`      Status: ${s.status}`);
                console.log(`      Enrolled: ${s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : 'N/A'}`);
                console.log(`      Terminated: ${s.termination_date ? new Date(s.termination_date).toLocaleDateString() : 'N/A'}`);
                console.log('');
            });

        } else {
            console.log('   No subjects found');
        }

        console.log('✅ Check complete!');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

checkAllSubjects();
