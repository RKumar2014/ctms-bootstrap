import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ShipmentForDestructionPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedDDF, setSelectedDDF] = useState('');
    const [signatureProcess, setSignatureProcess] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courier, setCourier] = useState('');
    const [selectedDrugUnits, setSelectedDrugUnits] = useState<string[]>([]);
    const [siteSignature, setSiteSignature] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const sites = [
        { id: '1', name: '1384 - Memorial Hospital' },
        { id: '2', name: '1385 - City Medical Center' }
    ];

    const ddfOptions = [
        { id: '1', name: 'Central Destruction Facility - USA' },
        { id: '2', name: 'Regional Destruction Facility - West' }
    ];

    const availableDrugUnits = [
        { id: 'DU-003', drug_code: 'DRUG-A', lot_number: 'LOT-12345', status: 'Expired' },
        { id: 'DU-004', drug_code: 'DRUG-B', lot_number: 'LOT-67890', status: 'Damaged' },
    ];

    const handleDrugUnitToggle = (drugUnitId: string) => {
        setSelectedDrugUnits(prev =>
            prev.includes(drugUnitId)
                ? prev.filter(id => id !== drugUnitId)
                : [...prev, drugUnitId]
        );
    };

    const handleProcessShipment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!siteSignature || !username || !password) {
            alert('Please complete electronic signature');
            return;
        }
        console.log('Processing shipment:', {
            selectedSite,
            selectedDDF,
            trackingNumber,
            courier,
            selectedDrugUnits,
            username
        });
        alert('Shipment processed successfully');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Shipment For Destruction</h1>
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
                        Return drug units to a central Destruction Destination Facility (DDF).
                    </p>

                    <form onSubmit={handleProcessShipment} className="space-y-6">
                        {/* Site Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Site
                            </label>
                            <select
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Select site...</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* DDF Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Destruction Destination Facility (DDF)
                            </label>
                            <select
                                value={selectedDDF}
                                onChange={(e) => setSelectedDDF(e.target.value)}
                                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Select DDF...</option>
                                {ddfOptions.map(ddf => (
                                    <option key={ddf.id} value={ddf.id}>{ddf.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Signature Process */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Signature Process
                            </label>
                            <select
                                value={signatureProcess}
                                onChange={(e) => setSignatureProcess(e.target.value)}
                                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Select process...</option>
                                <option value="Separate">Separate</option>
                                <option value="Combined">Combined</option>
                            </select>
                        </div>

                        {/* Tracking Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tracking Number
                            </label>
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter courier tracking number"
                                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        {/* Courier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Courier
                            </label>
                            <input
                                type="text"
                                value={courier}
                                onChange={(e) => setCourier(e.target.value)}
                                placeholder="Enter shipping company name"
                                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        {/* Serialized Drugs Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Serialized Drugs
                            </label>
                            <div className="border border-gray-300 rounded-md p-4 space-y-2 bg-gray-50">
                                {availableDrugUnits.map(drug => (
                                    <label key={drug.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedDrugUnits.includes(drug.id)}
                                            onChange={() => handleDrugUnitToggle(drug.id)}
                                            className="rounded"
                                        />
                                        <span className="text-sm">
                                            {drug.id} - {drug.drug_code} (Lot: {drug.lot_number}) - {drug.status}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Selected: {selectedDrugUnits.length} drug unit(s)
                            </p>
                        </div>

                        {/* Electronic Signature Section */}
                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-semibold mb-4">Electronic Signature</h3>

                            <div className="space-y-4 bg-blue-50 p-4 rounded">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="siteSignature"
                                        checked={siteSignature}
                                        onChange={(e) => setSiteSignature(e.target.checked)}
                                        className="rounded"
                                        required
                                    />
                                    <label htmlFor="siteSignature" className="ml-2 text-sm text-gray-700">
                                        I acknowledge responsibility for this shipment
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/drug')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                disabled={selectedDrugUnits.length === 0}
                            >
                                Process Shipment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ShipmentForDestructionPage;
