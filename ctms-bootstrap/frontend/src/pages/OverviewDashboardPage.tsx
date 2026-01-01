import React, { useEffect, useState } from 'react';
import { Users, Package, FileText } from 'lucide-react';
import { subjectsApi, drugUnitsApi } from '../lib/api';

interface DashboardStats {
    activeSubjects: number;
    availableDrugUnits: number;
    dispensedUnits: number;
}

const OverviewDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        activeSubjects: 0,
        availableDrugUnits: 0,
        dispensedUnits: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            // Fetch subjects count using centralized API
            const subjectsRes = await subjectsApi.list();
            const subjects = subjectsRes.data;
            const activeSubjects = Array.isArray(subjects)
                ? subjects.filter((s: any) => s.status === 'Active' || s.status === 'Enrolled').length
                : 0;

            // Fetch drug units using centralized API
            const inventoryRes = await drugUnitsApi.list();
            const inventory = inventoryRes.data;

            const availableDrugUnits = Array.isArray(inventory)
                ? inventory.filter((i: any) => i.status === 'Available').length
                : 0;
            const dispensedUnits = Array.isArray(inventory)
                ? inventory.filter((i: any) => i.status === 'Dispensed').length
                : 0;

            setStats({
                activeSubjects,
                availableDrugUnits,
                dispensedUnits
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            {/* Stats Cards - 3 columns */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <div className="text-sm text-blue-600 font-medium">Active Subjects</div>
                            <div className="text-3xl font-bold text-blue-700">{stats.activeSubjects}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-green-600" />
                        <div>
                            <div className="text-sm text-green-600 font-medium">Available Drug Units</div>
                            <div className="text-3xl font-bold text-green-700">{stats.availableDrugUnits}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-purple-600" />
                        <div>
                            <div className="text-sm text-purple-600 font-medium">Dispensed (Pending Return)</div>
                            <div className="text-3xl font-bold text-purple-700">{stats.dispensedUnits}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboardPage;
