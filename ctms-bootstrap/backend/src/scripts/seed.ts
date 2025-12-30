import { supabase } from '../config/supabase.js';

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Visits
    console.log('Inserting visits...');
    const { error: visitsError } = await supabase.from('visits').upsert([
        { visit_name: 'Rollover', visit_sequence: 0, expected_offset_days: 0, expected_range_days: 0 },
        { visit_name: 'Enrollment (Visit 1)', visit_sequence: 1, expected_offset_days: 0, expected_range_days: 0 },
        { visit_name: 'Visit 2', visit_sequence: 2, expected_offset_days: 35, expected_range_days: 7 },
        { visit_name: 'Visit 3', visit_sequence: 3, expected_offset_days: 90, expected_range_days: 7 },
        { visit_name: 'Visit 4', visit_sequence: 4, expected_offset_days: 150, expected_range_days: 7 },
        { visit_name: 'Visit 5', visit_sequence: 5, expected_offset_days: 210, expected_range_days: 7 },
        { visit_name: 'Early Termination', visit_sequence: 99, expected_offset_days: 0, expected_range_days: 0 }
    ], { onConflict: 'visit_sequence' }); // Assumption: visit_sequence or similar is unique, or just let duplicates fail if not unique constraint
    if (visitsError) console.error('Error seeding visits:', visitsError);

    // 2. Sites
    console.log('Inserting sites...');
    const { data: siteData, error: sitesError } = await supabase.from('sites').upsert([
        { site_number: '1384', site_name: 'Memorial Hospital', pi_name: 'Dr. Smith', country: 'USA', status: 'Active', activated_date: '2024-01-01' }
    ], { onConflict: 'site_number' }).select();
    if (sitesError) console.error('Error seeding sites:', sitesError);
    const siteId = siteData?.[0]?.site_id;

    if (!siteId) {
        console.error('Could not get site_id, aborting subject seed.');
        return;
    }

    // 3. Subjects
    console.log('Inserting subjects...');
    const subjects = [
        { subject_number: '1384-001', site_id: siteId, dob: '1985-03-15', sex: 'Male', status: 'Active', consent_date: '2024-10-01 09:00:00', enrollment_date: '2024-10-01 10:00:00' },
        { subject_number: '1384-002', site_id: siteId, dob: '1992-07-22', sex: 'Female', status: 'Active', consent_date: '2024-10-05 14:30:00', enrollment_date: '2024-10-05 15:00:00' },
        { subject_number: '1384-005', site_id: siteId, dob: '1978-11-30', sex: 'Male', status: 'Active', consent_date: '2024-10-15 11:00:00', enrollment_date: '2024-10-15 11:30:00' },
        { subject_number: '1384-006', site_id: siteId, dob: '1988-05-12', sex: 'Female', status: 'Completed', consent_date: '2024-06-01 10:00:00', enrollment_date: '2024-06-01 11:00:00' },
        { subject_number: '1384-007', site_id: siteId, dob: '1995-09-08', sex: 'Male', status: 'Completed', consent_date: '2024-07-10 13:00:00', enrollment_date: '2024-07-10 14:00:00' },
        { subject_number: '1384-003', site_id: siteId, dob: '1950-05-01', sex: 'Male', status: 'Terminated', consent_date: '2024-10-10 14:29:00', enrollment_date: '2024-10-10 15:00:00', termination_date: '2025-10-31' },
        { subject_number: '1384-009', site_id: siteId, dob: '1965-04-20', sex: 'Male', status: 'Terminated', consent_date: '2024-08-15 09:00:00', enrollment_date: '2024-08-15 10:00:00', termination_date: '2024-11-20' },
        { subject_number: '1384-015', site_id: siteId, dob: '1963-09-10', sex: 'Male', status: 'Terminated', consent_date: '2024-09-01 11:00:00', enrollment_date: '2024-09-01 12:00:00', termination_date: '2024-12-15' },
        { subject_number: '1384-019', site_id: siteId, dob: '1974-06-25', sex: 'Male', status: 'Terminated', consent_date: '2024-09-20 10:30:00', enrollment_date: '2024-09-20 11:00:00', termination_date: '2025-01-10' },
        { subject_number: '1384-022', site_id: siteId, dob: '1982-03-14', sex: 'Male', status: 'Terminated', consent_date: '2024-10-12 13:00:00', enrollment_date: '2024-10-12 14:00:00', termination_date: '2025-02-05' },
        { subject_number: '1384-023', site_id: siteId, dob: '1970-09-18', sex: 'Female', status: 'Terminated', consent_date: '2024-10-18 15:00:00', enrollment_date: '2024-10-18 16:00:00', termination_date: '2025-03-01' }
    ];

    const { data: subjectData, error: subjectError } = await supabase.from('subjects').upsert(subjects, { onConflict: 'subject_number' }).select();
    if (subjectError) console.error('Error seeding subjects:', subjectError);

    // 4. Subject Visits (simplified logic for now)
    // We need visit IDs first
    const { data: visits } = await supabase.from('visits').select('visit_id, visit_name, visit_sequence');

    if (subjectData && visits) {
        console.log('Inserting subject visits...');
        const subjectVisits = [];

        for (const subj of subjectData) {
            // For active/completed, schedule standard visits
            const enrollmentDate = new Date(subj.enrollment_date);

            for (const v of visits) {
                if (subj.status === 'Terminated' && v.visit_name !== 'Early Termination' && v.visit_sequence > 3) continue; // Skip later visits for terminated basic logic

                let expectedDate = new Date(enrollmentDate);
                // Just simple offset logic
                if (v.visit_sequence === 2) expectedDate.setDate(expectedDate.getDate() + 35);
                if (v.visit_sequence === 3) expectedDate.setDate(expectedDate.getDate() + 90);
                if (v.visit_sequence === 4) expectedDate.setDate(expectedDate.getDate() + 150);
                if (v.visit_sequence === 5) expectedDate.setDate(expectedDate.getDate() + 210);

                let status = 'Scheduled';
                let actualDate = null;

                // Mark some as completed
                if (v.visit_sequence <= 1) {
                    status = 'Completed';
                    actualDate = enrollmentDate.toISOString();
                }

                // Special case for Terminated subject's Early Termination visit
                if (subj.status === 'Terminated' && v.visit_name === 'Early Termination') {
                    status = 'Completed';
                    actualDate = subj.termination_date;
                    expectedDate = null; // No expected date usually for ET until triggered
                }

                subjectVisits.push({
                    subject_id: subj.subject_id,
                    visit_id: v.visit_id,
                    expected_date: expectedDate ? expectedDate.toISOString() : null,
                    actual_date: actualDate,
                    status: status
                });
            }
        }

        const { error: svError } = await supabase.from('subject_visits').upsert(subjectVisits, { onConflict: 'subject_id, visit_id' });
        if (svError) console.error('Error seeding subject visits:', svError);
    }

    console.log('✅ Scaling complete!');
}

seed().catch(console.error);
