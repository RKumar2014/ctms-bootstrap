import { supabase } from '../config/supabase.js';

async function verifyAndUpdate() {
    console.log('🔍 Verifying Schema and Updating Data\n');

    // Check drug_units for new columns
    const { data: drugUnits } = await supabase
        .from('drug_units')
        .select('drug_unit_id, drug_code, quantity_per_unit, unit_description')
        .limit(5);

    console.log('📦 drug_units with new columns:');
    drugUnits?.forEach(du => {
        console.log(`  [${du.drug_unit_id}] ${du.drug_code}: qty=${du.quantity_per_unit}, desc=${du.unit_description || 'null'}`);
    });

    // Check accountability for qty_missing
    const { data: accRecords } = await supabase
        .from('accountability')
        .select('accountability_id, subject_id, qty_dispensed, qty_returned, qty_missing')
        .limit(5);

    console.log('\n📋 accountability with qty_missing:');
    accRecords?.forEach(acc => {
        console.log(`  [${acc.accountability_id}] dispensed=${acc.qty_dispensed}, returned=${acc.qty_returned}, missing=${acc.qty_missing}`);
    });

    // Update drug units that have null quantity_per_unit
    if (drugUnits && drugUnits[0]?.quantity_per_unit === null) {
        console.log('\n📝 Updating drug units with default quantity...');
        const { data: updated } = await supabase
            .from('drug_units')
            .update({
                quantity_per_unit: 30,
                unit_description: '30-count bottle'
            })
            .is('quantity_per_unit', null)
            .select();
        console.log(`   Updated ${updated?.length || 0} records`);
    }

    // Verify update
    const { data: finalCheck } = await supabase
        .from('drug_units')
        .select('drug_unit_id, drug_code, quantity_per_unit')
        .limit(3);

    console.log('\n✅ Final verification:');
    finalCheck?.forEach(du => {
        console.log(`  [${du.drug_unit_id}] ${du.drug_code}: ${du.quantity_per_unit} pills`);
    });
}

verifyAndUpdate().then(() => process.exit(0)).catch(console.error);
