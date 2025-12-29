import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subjectsApi, drugUnitsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();

    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const response = await subjectsApi.list();
            return response.data;
        },
    });

    const { data: drugUnits = [] } = useQuery({
        queryKey: ['drug-units'],
        queryFn: async () => {
            const response = await drugUnitsApi.list();
            return response.data;
        },
    });

    const activeSubjects = subjects.filter((s: any) => s.status === 'Active').length;
    const availableDrugs = drugUnits.filter((d: any) => d.status === 'Available').length;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">CTMS Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
                        <button onClick={logout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-sm font-medium text-gray-500">Total Subjects</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{subjects.length}</p>
                        <p className="mt-1 text-sm text-green-600">{activeSubjects} active</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-sm font-medium text-gray-500">Drug Units</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{drugUnits.length}</p>
                        <p className="mt-1 text-sm text-green-600">{availableDrugs} available</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-sm font-medium text-gray-500">Sites</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">3</p>
                        <p className="mt-1 text-sm text-green-600">All active</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            to="/subjects/new"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <h3 className="font-medium text-gray-900">+ Enroll New Subject</h3>
                            <p className="text-sm text-gray-500 mt-1">Add a new subject to the trial</p>
                        </Link>
                        <Link
                            to="/subjects"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <h3 className="font-medium text-gray-900">View All Subjects</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage enrolled subjects</p>
                        </Link>
                        <Link
                            to="/drugs"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <h3 className="font-medium text-gray-900">Drug Inventory</h3>
                            <p className="text-sm text-gray-500 mt-1">View drug units and accountability</p>
                        </Link>
                        <Link
                            to="/reports"
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <h3 className="font-medium text-gray-900">View Reports</h3>
                            <p className="text-sm text-gray-500 mt-1">Generate trial reports</p>
                        </Link>
                    </div>
                </div>

                {/* Recent Subjects */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Subjects</h2>
                    <div className="space-y-3">
                        {subjects.slice(0, 5).map((subject: any) => (
                            <Link
                                key={subject.subject_id}
                                to={`/subjects/${subject.subject_id}`}
                                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded"
                            >
                                <div>
                                    <p className="font-medium">{subject.subject_number}</p>
                                    <p className="text-sm text-gray-500">
                                        Enrolled {new Date(subject.enrollment_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${subject.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {subject.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
