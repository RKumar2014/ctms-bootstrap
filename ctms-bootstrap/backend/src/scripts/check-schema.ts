import { supabase } from '../config/supabase.js';

async function checkSchema() {
    console.log('🔍 Checking Database Schema\n');

    // Check drug_units columns
    const { data: drugUnit } = await supabase
        .from('drug_units')
        .select('*')
        .limit(1);

    console.log('📦 drug_units sample record:');
    console.log(JSON.stringify(drugUnit?.[0], null, 2));

    // Check accountability columns
    const { data: acc } = await supabase
        .from('accountability')
        .select('*')
        .limit(1);

    console.log('\n📋 accountability sample record:');
    console.log(JSON.stringify(acc?.[0], null, 2));

    // List column names
    if (drugUnit?.[0]) {
        console.log('\n📦 drug_units columns:', Object.keys(drugUnit[0]).join(', '));
        const hasQtyPerUnit = 'quantity_per_unit' in drugUnit[0];
        console.log(`   quantity_per_unit: ${hasQtyPerUnit ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    if (acc?.[0]) {
        console.log('\n📋 accountability columns:', Object.keys(acc[0]).join(', '));
        const hasQtyMissing = 'qty_missing' in acc[0];
        console.log(`   qty_missing: ${hasQtyMissing ? '✅ EXISTS' : '❌ MISSING'}`);
    }
}

checkSchema().then(() => process.exit(0)).catch(console.error);
