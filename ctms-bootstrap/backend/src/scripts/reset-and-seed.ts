import { supabase } from '../config/supabase.js';

async function resetAndSeedPreserveAdmin() {
    console.log('🔐 Preserving admin user...');

    try {
        // Step 1: Set all users' site_id to NULL to break foreign key constraint
        console.log('  Breaking foreign key constraints on users...');
        const { error: nullifyError } = await supabase
            .from('users')
            .update({ site_id: null })
            .not('site_id', 'is', null);

        if (nullifyError) {
            console.log('  Note: Could not nullify user site_ids:', nullifyError.message);
        }

        console.log('\n🗑️  Clearing all data (except users)...\n');

        // Step 2: Delete all data in dependency order
        console.log('  Clearing accountability...');
        let { data: acc } = await supabase.from('accountability').select('accountability_id');
        if (acc && acc.length > 0) {
            for (const record of acc) {
                await supabase.from('accountability').delete().eq('accountability_id', record.accountability_id);
            }
        }

        console.log('  Clearing subject_visits...');
        let { data: sv } = await supabase.from('subject_visits').select('subject_visit_id');
        if (sv && sv.length > 0) {
            for (const record of sv) {
                await supabase.from('subject_visits').delete().eq('subject_visit_id', record.subject_visit_id);
            }
        }

        console.log('  Clearing drug_units...');
        let { data: du } = await supabase.from('drug_units').select('drug_unit_id');
        if (du && du.length > 0) {
            for (const record of du) {
                await supabase.from('drug_units').delete().eq('drug_unit_id', record.drug_unit_id);
            }
        }

        console.log('  Clearing subjects...');
        let { data: subj } = await supabase.from('subjects').select('subject_id');
        if (subj && subj.length > 0) {
            for (const record of subj) {
                await supabase.from('subjects').delete().eq('subject_id', record.subject_id);
            }
        }

        console.log('  Clearing visits...');
        let { data: vis } = await supabase.from('visits').select('visit_id');
        if (vis && vis.length > 0) {
            for (const record of vis) {
                await supabase.from('visits').delete().eq('visit_id', record.visit_id);
            }
        }

        console.log('  Clearing sites...');
        let { data: sites_del } = await supabase.from('sites').select('site_id');
        if (sites_del && sites_del.length > 0) {
            for (const record of sites_del) {
                await supabase.from('sites').delete().eq('site_id', record.site_id);
            }
        }

        console.log('✅ All data cleared (admin user preserved)');
        console.log('\n🌱 Starting fresh seed...\n');

        // ==================== SITES ====================
        console.log('📍 Seeding sites...');
        const { data: sites, error: sitesError } = await supabase.from('sites').insert([
            { site_number: '1384', site_name: 'Memorial Hospital', pi_name: 'Dr. Smith', country: 'USA', status: 'Active', activated_date: '2024-01-01' },
            { site_number: '1385', site_name: 'City Medical Center', pi_name: 'Dr. Johnson', country: 'USA', status: 'Active', activated_date: '2024-02-01' },
            { site_number: '1386', site_name: 'University Hospital', pi_name: 'Dr. Williams', country: 'Canada', status: 'Active', activated_date: '2024-03-01' },
        ]).select();

        if (sitesError) throw sitesError;
        console.log(`  ✓ Created ${sites.length} sites`);

        const site1 = sites.find(s => s.site_number === '1384')?.site_id;
        const site2 = sites.find(s => s.site_number === '1385')?.site_id;

        // Update admin user to be associated with site 1384
        console.log('\n👤 Updating admin user to site 1384...');
        const { error: adminUpdateError } = await supabase
            .from('users')
            .update({ site_id: site1 })
            .eq('username', 'admin');

        if (adminUpdateError) {
            console.log('  Note: Could not update admin user:', adminUpdateError.message);
        } else {
            console.log('  ✓ Admin user updated');
        }

        // ==================== VISITS ====================
        console.log('\n📅 Seeding visit definitions...');
        const { data: visits, error: visitsError } = await supabase.from('visits').insert([
            { visit_name: 'Rollover', visit_sequence: 0, expected_offset_days: 0, expected_range_days: 0 },
            { visit_name: 'Enrollment (Visit 1)', visit_sequence: 1, expected_offset_days: 0, expected_range_days: 0 },
            { visit_name: 'Visit 2', visit_sequence: 2, expected_offset_days: 35, expected_range_days: 7 },
            { visit_name: 'Visit 3', visit_sequence: 3, expected_offset_days: 90, expected_range_days: 7 },
            { visit_name: 'Visit 4', visit_sequence: 4, expected_offset_days: 150, expected_range_days: 7 },
            { visit_name: 'Visit 5', visit_sequence: 5, expected_offset_days: 210, expected_range_days: 7 },
            { visit_name: 'Early Termination', visit_sequence: 99, expected_offset_days: 0, expected_range_days: 0 }
        ]).select();

        if (visitsError) throw visitsError;
        console.log(`  ✓ Created ${visits.length} visit definitions`);

        // ==================== SUBJECTS ====================
        console.log('\n👥 Seeding subjects...');
        const { data: subjects, error: subjectsError } = await supabase.from('subjects').insert([
            // Active subjects (Site 1384)
            { subject_number: '1384-001', site_id: site1, dob: '1985-03-15', sex: 'Male', status: 'Active', consent_date: '2024-10-01 09:00:00', enrollment_date: '2024-10-01 10:00:00' },
            { subject_number: '1384-002', site_id: site1, dob: '1992-07-22', sex: 'Female', status: 'Active', consent_date: '2024-10-05 14:30:00', enrollment_date: '2024-10-05 15:00:00' },
            { subject_number: '1384-005', site_id: site1, dob: '1978-11-30', sex: 'Male', status: 'Active', consent_date: '2024-10-15 11:00:00', enrollment_date: '2024-10-15 11:30:00' },
            { subject_number: '1384-008', site_id: site1, dob: '1990-02-14', sex: 'Female', status: 'Active', consent_date: '2024-11-01 10:00:00', enrollment_date: '2024-11-01 10:30:00' },

            // Active subjects (Site 1385)
            { subject_number: '1385-001', site_id: site2, dob: '1987-06-20', sex: 'Male', status: 'Active', consent_date: '2024-10-10 09:00:00', enrollment_date: '2024-10-10 09:30:00' },
            { subject_number: '1385-002', site_id: site2, dob: '1993-09-12', sex: 'Female', status: 'Active', consent_date: '2024-10-20 14:00:00', enrollment_date: '2024-10-20 14:30:00' },

            // Completed subjects
            { subject_number: '1384-006', site_id: site1, dob: '1988-05-12', sex: 'Female', status: 'Completed', consent_date: '2024-06-01 10:00:00', enrollment_date: '2024-06-01 11:00:00' },
            { subject_number: '1384-007', site_id: site1, dob: '1995-09-08', sex: 'Male', status: 'Completed', consent_date: '2024-07-10 13:00:00', enrollment_date: '2024-07-10 14:00:00' },

            // Terminated subjects
            { subject_number: '1384-003', site_id: site1, dob: '1950-05-01', sex: 'Male', status: 'Terminated', consent_date: '2024-10-10 14:29:00', enrollment_date: '2024-10-10 15:00:00', termination_date: '2025-10-31' },
            { subject_number: '1384-009', site_id: site1, dob: '1965-04-20', sex: 'Male', status: 'Terminated', consent_date: '2024-08-15 09:00:00', enrollment_date: '2024-08-15 10:00:00', termination_date: '2024-11-20' },
            { subject_number: '1384-015', site_id: site1, dob: '1963-09-10', sex: 'Male', status: 'Terminated', consent_date: '2024-09-01 11:00:00', enrollment_date: '2024-09-01 12:00:00', termination_date: '2024-12-15' },
            { subject_number: '1384-019', site_id: site1, dob: '1974-06-25', sex: 'Male', status: 'Terminated', consent_date: '2024-09-20 10:30:00', enrollment_date: '2024-09-20 11:00:00', termination_date: '2025-01-10' },
            { subject_number: '1384-022', site_id: site1, dob: '1982-03-14', sex: 'Male', status: 'Terminated', consent_date: '2024-10-12 13:00:00', enrollment_date: '2024-10-12 14:00:00', termination_date: '2025-02-05' },
            { subject_number: '1384-023', site_id: site1, dob: '1970-09-18', sex: 'Female', status: 'Terminated', consent_date: '2024-10-18 15:00:00', enrollment_date: '2024-10-18 16:00:00', termination_date: '2025-03-01' },
        ]).select();

        if (subjectsError) throw subjectsError;
        console.log(`  ✓ Created ${subjects.length} subjects`);

        // ==================== SUBJECT VISITS ====================
        console.log('\n📋 Seeding subject visits...');
        const subjectVisits = [];

        for (const subject of subjects) {
            const enrollDate = new Date(subject.enrollment_date);

            for (const visit of visits) {
                // Skip future visits for terminated subjects
                if (subject.status === 'Terminated' && visit.visit_sequence > 3 && visit.visit_sequence !== 99) {
                    continue;
                }

                const expectedDate = new Date(enrollDate);
                expectedDate.setDate(expectedDate.getDate() + visit.expected_offset_days);

                let status = 'Scheduled';
                let actualDate = null;

                // Mark completed visits
                if (visit.visit_sequence === 0 || visit.visit_sequence === 1) {
                    status = 'Completed';
                    actualDate = new Date(enrollDate);
                    actualDate.setHours(actualDate.getHours() + visit.visit_sequence);
                } else if (visit.visit_sequence === 2 && subject.status !== 'Active') {
                    status = 'Completed';
                    actualDate = new Date(enrollDate);
                    actualDate.setDate(actualDate.getDate() + visit.expected_offset_days);
                } else if (visit.visit_sequence === 99 && subject.status === 'Terminated') {
                    status = 'Completed';
                    actualDate = subject.termination_date; // Already a string, don't convert
                }

                subjectVisits.push({
                    subject_id: subject.subject_id,
                    visit_id: visit.visit_id,
                    expected_date: expectedDate.toISOString().split('T')[0],
                    actual_date: actualDate ? (actualDate instanceof Date ? actualDate.toISOString() : actualDate) : null,
                    status
                });
            }
        }

        const { data: svData, error: svError } = await supabase.from('subject_visits').insert(subjectVisits).select();
        if (svError) throw svError;
        console.log(`  ✓ Created ${svData.length} subject visits`);

        // ==================== DRUG UNITS ====================
        console.log('\n💊 Seeding drug units...');
        const { data: drugUnits, error: drugError } = await supabase.from('drug_units').insert([
            // Available at Site 1384
            { drug_code: 'DRUG-A', lot_number: 'LOT-12345', expiration_date: '2025-12-31', status: 'Available', site_id: site1 },
            { drug_code: 'DRUG-A', lot_number: 'LOT-12345', expiration_date: '2025-12-31', status: 'Available', site_id: site1 },
            { drug_code: 'DRUG-B', lot_number: 'LOT-67890', expiration_date: '2025-11-30', status: 'Available', site_id: site1 },
            { drug_code: 'DRUG-B', lot_number: 'LOT-67890', expiration_date: '2025-11-30', status: 'Available', site_id: site1 },

            // Dispensed
            { drug_code: 'DRUG-A', lot_number: 'LOT-12345', expiration_date: '2025-12-31', status: 'Dispensed', site_id: site1, subject_id: subjects[0].subject_id, assigned_date: '2024-10-01' },
            { drug_code: 'DRUG-B', lot_number: 'LOT-67890', expiration_date: '2025-11-30', status: 'Dispensed', site_id: site1, subject_id: subjects[1].subject_id, assigned_date: '2024-10-05' },

            // Available at Site 1385
            { drug_code: 'DRUG-A', lot_number: 'LOT-12346', expiration_date: '2025-12-31', status: 'Available', site_id: site2 },
            { drug_code: 'DRUG-B', lot_number: 'LOT-67891', expiration_date: '2025-11-30', status: 'Available', site_id: site2 },
        ]).select();

        if (drugError) throw drugError;
        console.log(`  ✓ Created ${drugUnits.length} drug units`);

        // ==================== ACCOUNTABILITY ====================
        console.log('\n📊 Seeding accountability records...');
        const { data: accountability, error: accountabilityError } = await supabase.from('accountability').insert([
            {
                subject_id: subjects[0].subject_id,
                visit_id: svData.find(sv => sv.subject_id === subjects[0].subject_id && visits.find(v => v.visit_id === sv.visit_id)?.visit_sequence === 1)?.subject_visit_id,
                drug_unit_id: drugUnits[4].drug_unit_id,
                qty_dispensed: 30,
                qty_returned: 0,
                reconciliation_date: '2024-10-01',
                comments: 'Initial dispense'
            },
            {
                subject_id: subjects[1].subject_id,
                visit_id: svData.find(sv => sv.subject_id === subjects[1].subject_id && visits.find(v => v.visit_id === sv.visit_id)?.visit_sequence === 1)?.subject_visit_id,
                drug_unit_id: drugUnits[5].drug_unit_id,
                qty_dispensed: 30,
                qty_returned: 0,
                reconciliation_date: '2024-10-05',
                comments: 'Initial dispense'
            }
        ]).select();

        if (accountabilityError) throw accountabilityError;
        console.log(`  ✓ Created ${accountability.length} accountability records`);

        console.log('\n✅ Database reset and seed complete!\n');
        console.log('📊 Summary:');
        console.log(`  - ${sites.length} sites`);
        console.log(`  - ${visits.length} visit definitions`);
        console.log(`  - ${subjects.length} subjects (${subjects.filter(s => s.status === 'Active').length} active, ${subjects.filter(s => s.status === 'Completed').length} completed, ${subjects.filter(s => s.status === 'Terminated').length} terminated)`);
        console.log(`  - ${svData.length} subject visits`);
        console.log(`  - ${drugUnits.length} drug units`);
        console.log(`  - ${accountability.length} accountability records`);
        console.log('\n🔐 Admin user preserved with login: admin / Admin123!');

    } catch (error) {
        console.error('\n❌ Error during reset and seed:', error);
        throw error;
    }
}

resetAndSeedPreserveAdmin()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
