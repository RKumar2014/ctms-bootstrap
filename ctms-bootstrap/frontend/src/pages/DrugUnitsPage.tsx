import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { drugUnitsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DrugUnitsPage: React.FC = () => {
    const { logout } = useAuth();

    const { data: drugUnits = [], isLoading } = useQuery({
        queryKey: ['drug-units'],
        queryFn: async () => {
            const response = await drugUnitsApi.list();
            return response.data;
        },
    });

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Drug Inventory</h1>
                    <button onClick={logout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {drugUnits.map((unit: any) => (
                                <tr key={unit.drug_unit_id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{unit.drug_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{unit.lot_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(unit.expiration_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${unit.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                unit.status === 'Dispensed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {unit.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DrugUnitsPage;
