import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterDrugShipmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Sample shipment data (would come from API)
    const shipments = [
        {
            shipment_id: 'SH-001',
            destination: '1384 - Memorial Hospital',
            order_date: '2024-12-15',
            drug_units: 12,
            status: 'In Transit'
        },
        {
            shipment_id: 'SH-002',
            destination: '1385 - City Medical Center',
            order_date: '2024-12-20',
            drug_units: 8,
            status: 'Pending'
        }
    ];

    const handleReceiveShipment = (shipmentId: string) => {
        // TODO: Implement shipment receipt confirmation
        console.log('Receiving shipment:', shipmentId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Register Drug Shipment</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/drug')}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            ← Back to Drug Management
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
                    <p className="text-gray-600 mb-6">
                        Receive and acknowledge incoming drug shipments to the clinical site.
                    </p>

                    {/* Shipments Grid */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Shipment ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Destination
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Drug Units
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shipments.length > 0 ? (
                                    shipments.map((shipment) => (
                                        <tr key={shipment.shipment_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {shipment.shipment_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {shipment.destination}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(shipment.order_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {shipment.drug_units}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${shipment.status === 'In Transit'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {shipment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleReceiveShipment(shipment.shipment_id)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                >
                                                    Receive
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            No pending shipments
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterDrugShipmentPage;
