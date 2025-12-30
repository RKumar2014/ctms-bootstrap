import { supabase } from '../config/supabase.js';

async function addAvailableDrugs() {
    console.log('💊 Adding Available Drug Units to Site 1384...\n');

    // Site 1384 = site_id 11
    const site1384Id = 11;

    // Add 8 new drug units with status "Available"
    const newDrugUnits = [
        {
            drug_code: 'DRUG-A',
            lot_number: 'LOT-2024-001',
            expiration_date: '2026-06-30',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-A',
            lot_number: 'LOT-2024-001',
            expiration_date: '2026-06-30',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-A',
            lot_number: 'LOT-2024-002',
            expiration_date: '2026-09-30',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-B',
            lot_number: 'LOT-2024-003',
            expiration_date: '2026-08-31',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-B',
            lot_number: 'LOT-2024-003',
            expiration_date: '2026-08-31',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-C',
            lot_number: 'LOT-2024-004',
            expiration_date: '2026-12-31',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-C',
            lot_number: 'LOT-2024-004',
            expiration_date: '2026-12-31',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        },
        {
            drug_code: 'DRUG-C',
            lot_number: 'LOT-2024-005',
            expiration_date: '2027-01-31',
            status: 'Available',
            site_id: site1384Id,
            subject_id: null,
            assigned_date: null
        }
    ];

    const { data, error } = await supabase
        .from('drug_units')
        .insert(newDrugUnits)
        .select();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Added ${data?.length || 0} new drug units to Site 1384\n`);

    // Show summary
    const { data: allDrugs } = await supabase
        .from('drug_units')
        .select('*')
        .eq('site_id', site1384Id);

    const available = allDrugs?.filter(d => d.status === 'Available').length || 0;
    const dispensed = allDrugs?.filter(d => d.status === 'Dispensed').length || 0;

    console.log('📊 Site 1384 Drug Inventory:');
    console.log(`   Total: ${allDrugs?.length || 0}`);
    console.log(`   Available: ${available}`);
    console.log(`   Dispensed: ${dispensed}`);

    console.log('\n📋 New Drug Units:');
    data?.forEach(du => {
        console.log(`   [${du.drug_unit_id}] ${du.drug_code} - ${du.lot_number} - ${du.status}`);
    });
}

addAvailableDrugs().then(() => process.exit(0)).catch(console.error);
