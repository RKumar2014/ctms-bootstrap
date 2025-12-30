import { supabase } from '../config/supabase.js';

async function checkDrugUnits() {
    console.log('📊 Checking drug units in database...\n');

    const { data: drugUnits, error } = await supabase
        .from('drug_units')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total drug units: ${drugUnits?.length || 0}\n`);

    if (drugUnits && drugUnits.length > 0) {
        console.log('Drug units:');
        drugUnits.forEach(unit => {
            console.log(`  - ID: ${unit.drug_unit_id}, Code: ${unit.drug_code}, Lot: ${unit.lot_number}, Site: ${unit.site_id}, Status: ${unit.status}`);
        });
    } else {
        console.log('❌ No drug units found in database!');
    }
}

checkDrugUnits().then(() => process.exit(0)).catch(console.error);
