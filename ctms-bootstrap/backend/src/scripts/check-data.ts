import { supabase } from '../config/supabase.js';

async function checkData() {
    console.log('📊 Checking current database state...\n');

    const { data: sites } = await supabase.from('sites').select('site_id, site_number, site_name');
    console.log(`Sites (${sites?.length || 0}):`, sites);

    const { data: subjects } = await supabase.from('subjects').select('subject_id, subject_number, status');
    console.log(`\nSubjects (${subjects?.length || 0}):`, subjects);

    const { data: visits } = await supabase.from('visits').select('visit_id, visit_name');
    console.log(`\nVisits (${visits?.length || 0}):`, visits);
}

checkData().then(() => process.exit(0)).catch(console.error);
