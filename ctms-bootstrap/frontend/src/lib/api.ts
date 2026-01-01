import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
    logout: () => api.post('/auth/logout'),
};

// Subjects API
export const subjectsApi = {
    list: (params?: { site?: string; status?: string }) =>
        api.get('/subjects', { params }),
    get: (id: string) => api.get(`/subjects/${id}`),
    create: (data: any) => api.post('/subjects', data),
    update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
};

// Sites API
export const sitesApi = {
    list: () => api.get('/sites'),
};

// Drug Units API
export const drugUnitsApi = {
    list: (params?: { site?: string; status?: string }) =>
        api.get('/drug-units', { params }),
    getSiteDrugUnits: (siteId: string) =>
        api.get(`/drug-units/site/${siteId}`),
    update: (id: string, data: any) => api.put(`/drug-units/${id}`, data),
    bulkUpdateSite: (siteId: string, status: string) =>
        api.put(`/drug-units/bulk-update-site/${siteId}`, { status }),
    create: (data: any) => api.post('/drug-units', data),
};

// Accountability API
export const accountabilityApi = {
    list: (params?: { site_id?: string; subject_id?: string; visit_id?: string }) =>
        api.get('/accountability', { params }),
    create: (data: any) => api.post('/accountability', data),
    bulkSubmit: (records: any[]) => api.post('/accountability/bulk-submit', { records }),
    // Record return with enhanced compliance calculation
    recordReturn: (id: string, data: {
        qty_returned: number;
        return_date?: string;
        date_of_first_dose?: string;
        date_of_last_dose?: string;
        pills_per_day?: number;
        return_status?: string;  // RETURNED, NOT_RETURNED, WASTED, LOST, DESTROYED
        comments?: string;
    }) => api.put(`/accountability/${id}/return`, data),
    // Update accountability record (for fixing dates, comments, etc.)
    update: (id: string, data: {
        date_of_first_dose?: string;
        date_of_last_dose?: string;
        pills_per_day?: number;
        comments?: string;
        reason_for_change?: string;
    }) => api.put(`/accountability/${id}`, data),
};

// Inventory API (Master Log)
export const inventoryApi = {
    getMasterLog: (siteId?: string) =>
        api.get('/drug/master-log', { params: { site_id: siteId } }),
};

// Reports API
export const reportsApi = {
    subjectSummary: () => api.get('/reports/subject-summary'),
    siteEnrollment: () => api.get('/reports/site-enrollment'),
    drugAccountability: () => api.get('/reports/drug-accountability'),
};

// Audit Trail API
export const auditApi = {
    list: (params?: {
        user_id?: string;
        action?: string;
        table_name?: string;
        record_id?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
    }) => api.get('/audit', { params }),
    get: (id: string) => api.get(`/audit/${id}`),
    exportCsv: (params?: {
        user_id?: string;
        action?: string;
        table_name?: string;
        start_date?: string;
        end_date?: string;
    }) => api.get('/audit/export/csv', { params, responseType: 'blob' }),
    getFilterOptions: () => api.get('/audit/filters/options'),
};

// User Management API (Admin)
export const userApi = {
    list: () => api.get('/user/list'),
    create: (data: {
        username: string;
        password: string;
        email: string;
        role: string;
        site_id?: number;
    }) => api.post('/user', data),
    update: (id: string, data: {
        email?: string;
        role?: string;
        site_id?: number;
        is_active?: boolean;
        password?: string;
    }) => api.put(`/user/${id}`, data),
    delete: (id: string) => api.delete(`/user/${id}`),
    getRoles: () => api.get('/user/roles'),
};
