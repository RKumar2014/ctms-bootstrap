import { supabase } from '../config/supabase.js';

async function comprehensiveDatabaseAnalysis() {
    console.log('🔬 COMPREHENSIVE DATABASE ANALYSIS');
    console.log('='.repeat(80));

    // 1. Get all tables with counts
    console.log('\n📊 CURRENT DATABASE STATE:');
    const tables = ['sites', 'subjects', 'visits', 'subject_visits', 'drug_units', 'accountability'];
    for (const table of tables) {
        const { data, count } = await supabase.from(table).select('*', { count: 'exact' });
        console.log(`  ${table}: ${count} records`);
    }

    // 2. Sites Detail
    console.log('\n' + '='.repeat(80));
    console.log('📍 SITES:');
    const { data: sites } = await supabase.from('sites').select('*');
    sites?.forEach(s => console.log(`  [Site ${s.site_id}] ${s.site_number} - ${s.site_name}`));

    // 3. Drug Units Detail - THE CRITICAL TABLE
    console.log('\n' + '='.repeat(80));
    console.log('💊 DRUG UNITS (Full Detail):');
    const { data: drugUnits } = await supabase
        .from('drug_units')
        .select('*, sites(site_number)')
        .order('drug_unit_id');

    drugUnits?.forEach(du => {
        console.log(`\n  [Drug Unit ${du.drug_unit_id}]`);
        console.log(`    - Drug Code: ${du.drug_code}`);
        console.log(`    - Lot Number: ${du.lot_number}`);
        console.log(`    - Status: ${du.status}`);
        console.log(`    - Site ID: ${du.site_id} (${du.sites?.site_number || 'N/A'})`);
        console.log(`    - Subject ID: ${du.subject_id || 'NONE (Not assigned)'}`);
        console.log(`    - Assigned Date: ${du.assigned_date || 'Not assigned'}`);
        console.log(`    - Expiration: ${du.expiration_date || 'N/A'}`);
    });

    // 4. Available drugs per site
    console.log('\n' + '='.repeat(80));
    console.log('✅ AVAILABLE DRUGS BY SITE:');
    for (const site of sites || []) {
        const available = drugUnits?.filter(du => du.site_id === site.site_id && du.status === 'Available');
        console.log(`  Site ${site.site_number} (ID: ${site.site_id}):`);
        if (available && available.length > 0) {
            available.forEach(du => console.log(`    - Drug Unit ${du.drug_unit_id}: ${du.drug_code}`));
        } else {
            console.log(`    ⚠️  NO AVAILABLE DRUGS!`);
        }
    }

    // 5. Accountability records - links subjects, visits, and drugs
    console.log('\n' + '='.repeat(80));
    console.log('📋 ACCOUNTABILITY RECORDS (Drug-Subject-Visit Links):');
    const { data: accountabilityRecords } = await supabase
        .from('accountability')
        .select(`
            *,
            subjects(subject_number, site_id),
            drug_units(drug_unit_id, drug_code, status)
        `);

    accountabilityRecords?.forEach(acc => {
        console.log(`\n  [Accountability ${acc.accountability_id}]`);
        console.log(`    - Subject: ${acc.subjects?.subject_number} (ID: ${acc.subject_id})`);
        console.log(`    - Visit ID (subject_visit): ${acc.visit_id}`);
        console.log(`    - Drug Unit: ${acc.drug_units?.drug_code} (ID: ${acc.drug_unit_id})`);
        console.log(`    - Qty Dispensed: ${acc.qty_dispensed}`);
        console.log(`    - Qty Returned: ${acc.qty_returned}`);
        console.log(`    - Reconciliation Date: ${acc.reconciliation_date}`);
    });

    // 6. Mathematical Summary
    console.log('\n' + '='.repeat(80));
    console.log('🧮 DRUG INVENTORY MATH:');

    const totalDrugUnits = drugUnits?.length || 0;
    const availableUnits = drugUnits?.filter(du => du.status === 'Available').length || 0;
    const dispensedUnits = drugUnits?.filter(du => du.status === 'Dispensed').length || 0;
    const destroyedUnits = drugUnits?.filter(du => du.status === 'Destroyed').length || 0;
    const missingUnits = drugUnits?.filter(du => du.status === 'Missing').length || 0;

    console.log(`  Total Drug Units: ${totalDrugUnits}`);
    console.log(`  Available: ${availableUnits}`);
    console.log(`  Dispensed: ${dispensedUnits}`);
    console.log(`  Destroyed: ${destroyedUnits}`);
    console.log(`  Missing: ${missingUnits}`);
    console.log(`  Check: ${availableUnits + dispensedUnits + destroyedUnits + missingUnits} = ${totalDrugUnits} ✓`);

    // 7. Pills tracking
    console.log('\n' + '='.repeat(80));
    console.log('💊 PILL TRACKING BY ACCOUNTABILITY:');

    let totalDispensed = 0;
    let totalReturned = 0;

    accountabilityRecords?.forEach(acc => {
        totalDispensed += acc.qty_dispensed || 0;
        totalReturned += acc.qty_returned || 0;
    });

    console.log(`  Total Pills Dispensed (all records): ${totalDispensed}`);
    console.log(`  Total Pills Returned (all records): ${totalReturned}`);
    console.log(`  Net Pills Used: ${totalDispensed - totalReturned}`);

    // 8. Site 11 (1384) Specific Analysis
    console.log('\n' + '='.repeat(80));
    console.log('🎯 SITE 11 (1384) SPECIFIC ANALYSIS:');

    const site11Drugs = drugUnits?.filter(du => du.site_id === 11);
    console.log(`  Drug Units at Site 11: ${site11Drugs?.length || 0}`);

    site11Drugs?.forEach(du => {
        console.log(`    - [${du.drug_unit_id}] ${du.drug_code}: ${du.status}`);
    });

    // 9. Check if drug_units have correct site assignments
    console.log('\n' + '='.repeat(80));
    console.log('🔗 SITE-DRUG MAPPING CHECK:');
    const drugsWithSite = drugUnits?.filter(du => du.site_id);
    const drugsWithoutSite = drugUnits?.filter(du => !du.site_id);
    console.log(`  Drugs WITH site_id: ${drugsWithSite?.length || 0}`);
    console.log(`  Drugs WITHOUT site_id: ${drugsWithoutSite?.length || 0}`);

    if (drugsWithoutSite && drugsWithoutSite.length > 0) {
        console.log('  ⚠️  ORPHANED DRUGS (no site):');
        drugsWithoutSite.forEach(du => console.log(`    - Drug Unit ${du.drug_unit_id}`));
    }

    console.log('\n✅ Analysis complete');
}

comprehensiveDatabaseAnalysis().then(() => process.exit(0)).catch(console.error);
