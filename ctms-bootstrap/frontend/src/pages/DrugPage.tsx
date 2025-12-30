import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, FileText, ClipboardCheck, BarChart3, AlertTriangle, Truck } from 'lucide-react';

const DrugPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const drugActions = [
        {
            id: 'update-site-inventory',
            title: 'Update Site Inventory',
            description: 'Manually change drug unit status (Damaged, Missing, Quarantined)',
            icon: Package,
            path: '/drug/update-site-inventory'
        },
        {
            id: 'register-shipment',
            title: 'Register Drug Shipment',
            description: 'Receive and acknowledge incoming drug shipments',
            icon: Truck,
            path: '/drug/register-shipment'
        },
        {
            id: 'subject-accountability',
            title: 'Subject Accountability',
            description: 'Track drug dispensing and reconciliation at subject/visit level',
            icon: ClipboardCheck,
            path: '/drug/subject-accountability'
        },
        {
            id: 'site-inventory-accountability',
            title: 'Site Inventory Accountability',
            description: 'Overall reconciliation of site drug supply',
            icon: BarChart3,
            path: '/drug/site-inventory-accountability'
        },
        {
            id: 'on-site-destruction',
            title: 'On Site Destruction',
            description: '21 CFR Part 11 compliant destruction of drug units',
            icon: AlertTriangle,
            path: '/drug/on-site-destruction'
        },
        {
            id: 'shipment-for-destruction',
            title: 'Shipment For Destruction',
            description: 'Return drug units to Destruction Destination Facility',
            icon: FileText,
            path: '/drug/shipment-for-destruction'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Drug Management</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            ← Back to Dashboard
                        </button>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-6">Drug Supply Chain Management</h2>

                    {/* Button List (Suvoda style) */}
                    <div className="flex flex-col space-y-3 max-w-md">
                        {drugActions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => navigate(action.path)}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium text-left"
                            >
                                {action.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrugPage;
