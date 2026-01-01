import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, sitesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface User {
    user_id: string;
    username: string;
    email: string;
    role: string;
    site_id: number | null;
    is_active: boolean;
    created_at: string;
    sites?: { site_number: string; site_name: string };
}

interface Site {
    site_id: number;
    site_number: string;
    site_name: string;
}

const ROLES = [
    { value: 'admin', label: 'Admin', description: 'Full system access' },
    { value: 'coordinator', label: 'Coordinator', description: 'Site coordinator, manages subjects' },
    { value: 'monitor', label: 'Monitor', description: 'Clinical monitor, read-only' },
    { value: 'auditor', label: 'Auditor', description: 'Audit access, can view logs' },
    { value: 'doctor', label: 'Doctor', description: 'Physician/Investigator' },
];

const AdminPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        role: 'coordinator',
        site_id: '',
    });
    const [formError, setFormError] = useState('');

    // Fetch users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await userApi.list();
            return response.data as User[];
        }
    });

    // Fetch sites for dropdown
    const { data: sites = [] } = useQuery({
        queryKey: ['sites-list'],
        queryFn: async () => {
            const response = await sitesApi.list();
            return response.data as Site[];
        }
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            return userApi.create({
                username: data.username,
                password: data.password,
                email: data.email,
                role: data.role,
                site_id: data.site_id ? parseInt(data.site_id) : undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error: any) => {
            setFormError(error.response?.data?.error || 'Failed to create user');
        }
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return userApi.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUser(null);
            resetForm();
        },
        onError: (error: any) => {
            setFormError(error.response?.data?.error || 'Failed to update user');
        }
    });

    // Deactivate user mutation
    const deactivateUserMutation = useMutation({
        mutationFn: async (id: string) => {
            return userApi.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const resetForm = () => {
        setFormData({ username: '', password: '', email: '', role: 'coordinator', site_id: '' });
        setFormError('');
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            email: user.email,
            role: user.role,
            site_id: user.site_id?.toString() || '',
        });
        setFormError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            const updateData: any = {
                email: formData.email,
                role: formData.role,
                site_id: formData.site_id ? parseInt(formData.site_id) : null
            };
            if (formData.password) {
                updateData.password = formData.password;
            }
            updateUserMutation.mutate({ id: editingUser.user_id, data: updateData });
        } else {
            createUserMutation.mutate(formData);
        }
    };

    const handleDeactivate = (user: User) => {
        if (confirm(`Are you sure you want to deactivate ${user.username}?`)) {
            deactivateUserMutation.mutate(user.user_id);
        }
    };

    const handleReactivate = (user: User) => {
        updateUserMutation.mutate({ id: user.user_id, data: { is_active: true } });
    };

    // Role badge color
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'coordinator': return 'bg-blue-100 text-blue-800';
            case 'monitor': return 'bg-green-100 text-green-800';
            case 'auditor': return 'bg-purple-100 text-purple-800';
            case 'doctor': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-800">You do not have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage system users and their access</p>
                </div>
                <button
                    onClick={() => { setShowCreateModal(true); resetForm(); }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                    ➕ Add User
                </button>
            </div>

            {/* User List Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.user_id} className={!user.is_active ? 'bg-gray-50 opacity-60' : ''}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {user.sites ? `${user.sites.site_number} - ${user.sites.site_name}` : 'All Sites'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            Edit
                                        </button>
                                        {user.is_active ? (
                                            <button
                                                onClick={() => handleDeactivate(user)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleReactivate(user)}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                Reactivate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingUser) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h2>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {editingUser && '(leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required={!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    {ROLES.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label} - {role.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.role !== 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Site</label>
                                    <select
                                        value={formData.site_id}
                                        onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required={formData.role !== 'admin'}
                                    >
                                        <option value="">Select a site...</option>
                                        {sites.map(site => (
                                            <option key={site.site_id} value={site.site_id}>
                                                {site.site_number} - {site.site_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                                >
                                    {createUserMutation.isPending || updateUserMutation.isPending
                                        ? 'Saving...'
                                        : editingUser ? 'Update' : 'Create'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
