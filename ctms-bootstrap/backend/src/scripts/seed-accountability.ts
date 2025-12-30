import { supabase } from '../config/supabase.js';

async function seedAccountability() {
    console.log('🌱 Seeding accountability records...\n');

    // Get drug units
    const { data: drugUnits } = await supabase
        .from('drug_units')
        .select('drug_unit_id, drug_code, site_id, status')
        .limit(10);

    // Get subjects
    const { data: subjects } = await supabase
        .from('subjects')
        .select('subject_id, subject_number, site_id')
        .limit(10);

    // Get subject_visits (which links subjects to visits)
    const { data: subjectVisits } = await supabase
        .from('subject_visits')
        .select('subject_visit_id, subject_id, visit_id, visits(visit_name)')
        .limit(20);

    console.log('Found:');
    console.log(`- ${drugUnits?.length || 0} drug units`);
    console.log(`- ${subjects?.length || 0} subjects`);
    console.log(`- ${subjectVisits?.length || 0} subject visits\n`);

    if (!drugUnits || !subjects || !subjectVisits || drugUnits.length === 0 || subjectVisits.length === 0) {
        console.log('❌ Need drug units and subject visits in database first!');
        return;
    }

    // Create accountability records
    const accountabilityRecords = [];

    // Find subject 1384-001
    const subject1 = subjects.find(s => s.subject_number === '1384-001');

    if (subject1) {
        // Get this subject's visits
        const subject1Visits = subjectVisits.filter(sv => sv.subject_id === subject1.subject_id);

        console.log(`Found ${subject1Visits.length} visits for subject ${subject1.subject_number}`);

        // Add accountability for first 2 visits
        if (subject1Visits[0] && drugUnits[0]) {
            accountabilityRecords.push({
                subject_id: subject1.subject_id,
                visit_id: subject1Visits[0].subject_visit_id,
                drug_unit_id: drugUnits[0].drug_unit_id,
                qty_dispensed: 30,
                qty_returned: 0,
                reconciliation_date: new Date('2024-01-15').toISOString(),
                comments: 'Initial dispensing at enrollment'
            });
        }

        if (subject1Visits[1] && drugUnits[1]) {
            accountabilityRecords.push({
                subject_id: subject1.subject_id,
                visit_id: subject1Visits[1].subject_visit_id,
                drug_unit_id: drugUnits[1].drug_unit_id,
                qty_dispensed: 30,
                qty_returned: 5,
                reconciliation_date: new Date('2024-02-15').toISOString(),
                comments: 'Visit 2 - patient returned 5 unused tablets'
            });
        }
    }

    // Find subject 1384-002
    const subject2 = subjects.find(s => s.subject_number === '1384-002');
    if (subject2) {
        const subject2Visits = subjectVisits.filter(sv => sv.subject_id === subject2.subject_id);

        if (subject2Visits[0] && drugUnits[2]) {
            accountabilityRecords.push({
                subject_id: subject2.subject_id,
                visit_id: subject2Visits[0].subject_visit_id,
                drug_unit_id: drugUnits[2].drug_unit_id,
                qty_dispensed: 30,
                qty_returned: 0,
                reconciliation_date: new Date('2024-01-20').toISOString(),
                comments: 'Initial dispensing'
            });
        }
    }

    if (accountabilityRecords.length === 0) {
        console.log('❌ No accountability records to create - need subject_visits data');
        return;
    }

    console.log(`\nInserting ${accountabilityRecords.length} accountability records...`);

    const { data, error } = await supabase
        .from('accountability')
        .insert(accountabilityRecords)
        .select();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`✅ Successfully created ${data?.length || 0} accountability records\n`);
    console.log('Records:');
    data?.forEach(record => {
        console.log(`  - Subject ${record.subject_id}, Visit ${record.visit_id}, Drug Unit ${record.drug_unit_id}`);
        console.log(`    Dispensed: ${record.qty_dispensed}, Returned: ${record.qty_returned}`);
    });
}

seedAccountability().then(() => process.exit(0)).catch(console.error);
