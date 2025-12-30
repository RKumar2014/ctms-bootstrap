import { supabase } from '../config/supabase.js';

async function analyzeDatabaseRelationships() {
    console.log('🔍 DEEP DATABASE ANALYSIS\n');
    console.log('='.repeat(60));

    // 1. Check all table counts
    console.log('\n📊 TABLE COUNTS:');
    const tables = ['sites', 'subjects', 'visits', 'subject_visits', 'drug_units', 'accountability'];
    for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`  ${table}: ${count} records`);
    }

    // 2. Show relationship diagram
    console.log('\n📐 DATABASE RELATIONSHIPS:');
    console.log(`
    sites ─────────────────────────────────────────────────┐
      │                                                    │
      │ (site_id)                                          │
      ▼                                                    │
    subjects ◄────────── drug_units ◄─────────────────────┘
      │                    │
      │ (subject_id)       │ (drug_unit_id)
      ▼                    │
    subject_visits         │
      │  (subject_visit_id)│
      │                    │
      ▼                    ▼
    accountability ────────┘
    `);

    // 3. Check accountability records in detail
    console.log('='.repeat(60));
    console.log('\n🔎 ACCOUNTABILITY RECORDS DETAIL:');

    const { data: accountabilityRecords, error } = await supabase
        .from('accountability')
        .select('*');

    if (error) {
        console.log('  Error:', error);
        return;
    }

    console.log(`  Total records: ${accountabilityRecords?.length || 0}`);

    for (const record of accountabilityRecords || []) {
        console.log(`\n  [Accountability ID: ${record.accountability_id}]`);
        console.log(`    - subject_id: ${record.subject_id}`);
        console.log(`    - visit_id (subject_visits FK): ${record.visit_id}`);
        console.log(`    - drug_unit_id: ${record.drug_unit_id}`);
        console.log(`    - qty_dispensed: ${record.qty_dispensed}`);

        // Verify foreign keys
        const { data: subject } = await supabase
            .from('subjects')
            .select('subject_number, site_id')
            .eq('subject_id', record.subject_id)
            .single();
        console.log(`    → Subject: ${subject?.subject_number || 'NOT FOUND'} (site: ${subject?.site_id || 'N/A'})`);

        const { data: subjectVisit } = await supabase
            .from('subject_visits')
            .select('subject_visit_id, visit_id, visits(visit_name)')
            .eq('subject_visit_id', record.visit_id)
            .single();
        console.log(`    → Subject Visit: ${subjectVisit?.subject_visit_id || 'NOT FOUND'}`);
        // @ts-ignore
        console.log(`    → Actual Visit: ${subjectVisit?.visits?.visit_name || 'NOT FOUND'}`);

        const { data: drugUnit } = await supabase
            .from('drug_units')
            .select('drug_unit_id, drug_code, status, site_id')
            .eq('drug_unit_id', record.drug_unit_id)
            .single();
        console.log(`    → Drug Unit: ${drugUnit?.drug_unit_id || 'NOT FOUND'} (${drugUnit?.drug_code || 'N/A'}, site: ${drugUnit?.site_id || 'N/A'})`);
    }

    // 4. Check if subject 1384-002 has accountability records
    console.log('\n='.repeat(60));
    console.log('\n🎯 SPECIFIC CHECK: Subject 1384-002');

    const { data: subject1384002 } = await supabase
        .from('subjects')
        .select('*')
        .eq('subject_number', '1384-002')
        .single();

    if (subject1384002) {
        console.log(`  Subject ID: ${subject1384002.subject_id}`);
        console.log(`  Site ID: ${subject1384002.site_id}`);

        // Check accountability for this subject
        const { data: subjectAccountability } = await supabase
            .from('accountability')
            .select('*')
            .eq('subject_id', subject1384002.subject_id);

        console.log(`  Accountability records: ${subjectAccountability?.length || 0}`);

        // Check what API would return for this subject
        const { data: apiResult } = await supabase
            .from('accountability')
            .select(`
                *,
                subject:subjects(subject_number, site_id),
                visit:subject_visits(visit_id, visits(visit_name)),
                drug_unit:drug_units(drug_unit_id, drug_code, lot_number, status)
            `)
            .eq('subject_id', subject1384002.subject_id);

        console.log('\n  API Query Result:');
        console.log(JSON.stringify(apiResult, null, 2));
    } else {
        console.log('  Subject 1384-002 NOT FOUND!');
    }

    // 5. Site 11 analysis
    console.log('\n='.repeat(60));
    console.log('\n🔍 SITE 11 (1384) ANALYSIS:');

    const { data: site11Drug } = await supabase
        .from('drug_units')
        .select('*')
        .eq('site_id', 11);
    console.log(`  Drug units at site 11: ${site11Drug?.length || 0}`);

    const { data: site11Subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('site_id', 11);
    console.log(`  Subjects at site 11: ${site11Subjects?.length || 0}`);
}

analyzeDatabaseRelationships().then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
}).catch(console.error);
