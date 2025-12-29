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

// Drug Units API
export const drugUnitsApi = {
    list: (params?: { site?: string; status?: string }) =>
        api.get('/drug-units', { params }),
    create: (data: any) => api.post('/drug-units', data),
};

// Reports API
export const reportsApi = {
    subjectSummary: () => api.get('/reports/subject-summary'),
    siteEnrollment: () => api.get('/reports/site-enrollment'),
    drugAccountability: () => api.get('/reports/drug-accountability'),
};
