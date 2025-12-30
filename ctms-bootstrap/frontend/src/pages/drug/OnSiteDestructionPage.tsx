import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OnSiteDestructionPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [selectedSite, setSelectedSite] = useState('');
    const [signatureProcess, setSignatureProcess] = useState('');
    const [destructionDate, setDestructionDate] = useState('');
    const [selectedDrugUnits, setSelectedDrugUnits] = useState<string[]>([]);
    const [siteSignature, setSiteSignature] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const sites = [
        { id: '1', name: '1384 - Memorial Hospital' },
        { id: '2', name: '1385 - City Medical Center' }
    ];

    const availableDrugUnits = [
        { id: 'DU-001', drug_code: 'DRUG-A', lot_number: 'LOT-12345', status: 'Expired' },
        { id: 'DU-002', drug_code: 'DRUG-B', lot_number: 'LOT-67890', status: 'Damaged' },
    ];

    const handleDrugUnitToggle = (drugUnitId: string) => {
        setSelectedDrugUnits(prev =>
            prev.includes(drugUnitId)
                ? prev.filter(id => id !== drugUnitId)
                : [...prev, drugUnitId]
        );
    };

    const handleProcessDestruction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!siteSignature || !username || !password) {
            alert('Please complete electronic signature');
            return;
        }
        console.log('Processing destruction:', {
            selectedSite,
            destructionDate,
            selectedDrugUnits,
            username
        });
        alert('Destruction processed successfully');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">On Site Destruction</h1>
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
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <p className="text-sm text-yellow-700">
                            <strong>21 CFR Part 11 Compliant</strong> - This action requires electronic signature and creates a permanent audit trail.
                        </p>
                    </div>

                    <form onSubmit={handleProcessDestruction} className="space-y-6">
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

                        {/* Destruction Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Destruction Date
                            </label>
                            <input
                                type="date"
                                value={destructionDate}
                                onChange={(e) => setDestructionDate(e.target.value)}
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
                                        I acknowledge responsibility for this destruction
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
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                disabled={selectedDrugUnits.length === 0}
                            >
                                Process Destruction
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OnSiteDestructionPage;
