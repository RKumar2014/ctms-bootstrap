import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, ClipboardCheck, BarChart3, AlertTriangle, Truck, ScrollText } from 'lucide-react';

const DrugPage: React.FC = () => {
    const navigate = useNavigate();

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
            id: 'master-log',
            title: 'Master Accountability Log',
            description: 'Complete lifecycle tracking for all inventory bottles',
            icon: ScrollText,
            path: '/drug/master-log'
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
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Drug Management</h1>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-6">Drug Supply Chain Management</h2>

                {/* Button Layout (4 top, 3 bottom) */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        {drugActions.slice(0, 4).map((action) => (
                            <button
                                key={action.id}
                                onClick={() => navigate(action.path)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 hover:border-teal-500 font-medium transition-colors whitespace-nowrap"
                            >
                                {action.title}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {drugActions.slice(4).map((action) => (
                            <button
                                key={action.id}
                                onClick={() => navigate(action.path)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 hover:border-teal-500 font-medium transition-colors whitespace-nowrap"
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
