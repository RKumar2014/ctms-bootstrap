import { supabase } from '../config/supabase.js';

async function manualDelete() {
    console.log('🗑️  Manually deleting site 1384...');
    const { error } = await supabase.from('sites').delete().eq('site_number', '1384');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('✅ Site 1384 deleted');
    }
}

manualDelete().then(() => process.exit(0)).catch(console.error);
