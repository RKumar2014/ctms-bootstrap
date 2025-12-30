import { supabase } from '../config/supabase.js';

async function fixDatabaseSchema() {
    console.log('🔧 Fixing Database Schema for Drug Quantities\n');
    console.log('='.repeat(60));

    // 1. Add quantity_per_unit to drug_units
    console.log('\n📦 Step 1: Adding quantity_per_unit to drug_units...');

    const { error: alterDrugUnits1 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE drug_units ADD COLUMN IF NOT EXISTS quantity_per_unit INTEGER DEFAULT 30;`
    }).catch(async () => {
        // Try direct SQL if RPC fails
        return await supabase.from('drug_units').select('quantity_per_unit').limit(1);
    });

    // 2. Add unit_description to drug_units
    console.log('📦 Step 2: Adding unit_description to drug_units...');

    const { error: alterDrugUnits2 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE drug_units ADD COLUMN IF NOT EXISTS unit_description VARCHAR(255);`
    }).catch(() => ({ error: null }));

    // 3. Add qty_missing to accountability
    console.log('📋 Step 3: Adding qty_missing to accountability...');

    const { error: alterAccountability } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE accountability ADD COLUMN IF NOT EXISTS qty_missing INTEGER DEFAULT 0;`
    }).catch(() => ({ error: null }));

    // Check the current schema by querying
    console.log('\n📊 Checking current schema...');

    const { data: drugUnitSample } = await supabase
        .from('drug_units')
        .select('*')
        .limit(1);

    const { data: accountabilitySample } = await supabase
        .from('accountability')
        .select('*')
        .limit(1);

    console.log('\n📦 drug_units columns:', drugUnitSample?.[0] ? Object.keys(drugUnitSample[0]) : 'No data');
    console.log('📋 accountability columns:', accountabilitySample?.[0] ? Object.keys(accountabilitySample[0]) : 'No data');

    // Update existing drug units to have quantity_per_unit = 30 if column exists
    if (drugUnitSample?.[0] && 'quantity_per_unit' in drugUnitSample[0]) {
        console.log('\n✅ quantity_per_unit column exists! Updating existing records...');

        const { data: updated, error: updateError } = await supabase
            .from('drug_units')
            .update({ quantity_per_unit: 30 })
            .is('quantity_per_unit', null)
            .select();

        if (!updateError) {
            console.log(`   Updated ${updated?.length || 0} drug units with quantity_per_unit = 30`);
        }
    } else {
        console.log('\n⚠️  quantity_per_unit column needs to be added via Supabase dashboard:');
        console.log('   ALTER TABLE drug_units ADD COLUMN quantity_per_unit INTEGER DEFAULT 30;');
    }

    // Check if qty_missing exists
    if (accountabilitySample?.[0] && 'qty_missing' in accountabilitySample[0]) {
        console.log('\n✅ qty_missing column exists in accountability table!');
    } else {
        console.log('\n⚠️  qty_missing column needs to be added via Supabase dashboard:');
        console.log('   ALTER TABLE accountability ADD COLUMN qty_missing INTEGER DEFAULT 0;');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Schema check complete');
}

fixDatabaseSchema().then(() => process.exit(0)).catch(console.error);
