export interface User {
    userId: string;
    username: string;
    email: string;
    role: string;
    siteId?: number;
}

export interface Subject {
    subject_id: number;
    subject_number: string;
    site_id: number;
    dob: string;
    sex: 'Male' | 'Female' | 'Other';
    status: 'Active' | 'Completed' | 'Terminated';
    consent_date: string;
    enrollment_date: string;
    termination_date?: string;
    next_visit_name?: string | null;
    next_visit_date?: string | null;
}

export interface DrugUnit {
    drug_unit_id: number;
    drug_code: string;
    lot_number: string;
    expiration_date: string;
    status: 'Available' | 'Dispensed' | 'Destroyed' | 'Missing';
    site_id: number;
    subject_id?: number;
}

export interface Site {
    site_id: number;
    site_number: string;
    site_name: string;
    pi_name?: string;
    country?: string;
    status: string;
}
