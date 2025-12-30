import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi, drugUnitsApi, accountabilityApi, api } from '../../lib/api';

const DispenseDrugPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const subjectId = searchParams.get('subject');
    const visitId = searchParams.get('visit');

    const [selectedDrugUnit, setSelectedDrugUnit] = useState('');
    const [qtyDispensed, setQtyDispensed] = useState(30);
    const [comments, setComments] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch subject details
    const { data: subject } = useQuery({
        queryKey: ['subject', subjectId],
        queryFn: async () => {
            const response = await subjectsApi.get(subjectId!);
            return response.data;
        },
        enabled: !!subjectId,
    });

    // Fetch visit details
    const { data: visitDetails } = useQuery({
        queryKey: ['visit-details', visitId],
        queryFn: async () => {
            const response = await api.get(`/subjects/${subjectId}/visits`);
            const visits = response.data;
            return visits.find((v: any) => v.subject_visit_id === parseInt(visitId!));
        },
        enabled: !!visitId && !!subjectId,
    });

    // Fetch available drug units at subject's site
    const { data: availableDrugUnits = [] } = useQuery({
        queryKey: ['available-drug-units', subject?.site_id],
        queryFn: async () => {
            const response = await drugUnitsApi.getSiteDrugUnits(subject.site_id);
            return response.data.filter((du: any) => du.status === 'Available');
        },
        enabled: !!subject?.site_id,
    });

    // Dispense mutation
    const dispenseMutation = useMutation({
        mutationFn: async (data: any) => {
            // Create accountability record
            const accResponse = await accountabilityApi.create({
                subject_id: parseInt(subjectId!),
                visit_id: parseInt(visitId!),
                drug_unit_id: parseInt(selectedDrugUnit),
                qty_dispensed: qtyDispensed,
                qty_returned: 0,
                reconciliation_date: new Date().toISOString(),
                comments: comments
            });

            // Update drug unit status to Dispensed
            await drugUnitsApi.update(selectedDrugUnit, {
                status: 'Dispensed',
                subject_id: parseInt(subjectId!),
                assigned_date: new Date().toISOString()
            });

            return accResponse;
        },
        onSuccess: () => {
            setSuccessMessage('Drug dispensed successfully!');
            setErrorMessage('');
            queryClient.invalidateQueries({ queryKey: ['subject-accountability'] });
            queryClient.invalidateQueries({ queryKey: ['available-drug-units'] });
            setSelectedDrugUnit('');
            setComments('');
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to dispense drug');
            setSuccessMessage('');
        },
    });

    // Get selected drug unit details
    const selectedDrugUnitDetails = availableDrugUnits.find(
        (du: any) => du.drug_unit_id.toString() === selectedDrugUnit
    );
    const maxQty = selectedDrugUnitDetails?.quantity_per_unit || 30;

    // Set default qty when drug unit is selected
    const handleDrugUnitChange = (drugUnitId: string) => {
        setSelectedDrugUnit(drugUnitId);
        const du = availableDrugUnits.find((d: any) => d.drug_unit_id.toString() === drugUnitId);
        if (du) {
            setQtyDispensed(du.quantity_per_unit || 30);
        }
    };

    const handleDispense = () => {
        if (!selectedDrugUnit) {
            setErrorMessage('Please select a drug unit');
            return;
        }
        if (qtyDispensed > maxQty) {
            setErrorMessage(`Cannot dispense more than ${maxQty} pills (the bottle's quantity)`);
            return;
        }
        if (qtyDispensed <= 0) {
            setErrorMessage('Quantity must be greater than 0');
            return;
        }
        dispenseMutation.mutate({});
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Dispense Drug</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                        {errorMessage}
                    </div>
                )}

                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-6">Dispense Information</h2>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Subject</label>
                            <p className="mt-1 text-lg font-semibold">
                                {subject?.subject_number || 'Loading...'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Visit</label>
                            <p className="mt-1 text-lg font-semibold">
                                {visitDetails?.visits?.visit_name || 'Loading...'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Site</label>
                            <p className="mt-1 text-lg">
                                {subject?.sites?.site_number || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <hr className="my-6" />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Drug Unit *
                            </label>
                            <select
                                value={selectedDrugUnit}
                                onChange={(e) => handleDrugUnitChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Select available drug unit...</option>
                                {availableDrugUnits.map((du: any) => (
                                    <option key={du.drug_unit_id} value={du.drug_unit_id}>
                                        {du.drug_unit_id} - {du.drug_code} (Lot: {du.lot_number || 'N/A'}, {du.quantity_per_unit || 30} pills)
                                    </option>
                                ))}
                            </select>
                            {availableDrugUnits.length === 0 && (
                                <p className="mt-2 text-sm text-yellow-600">
                                    No available drug units at this site
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity Dispensed {selectedDrugUnit && <span className="text-gray-500">(max: {maxQty})</span>}
                            </label>
                            <input
                                type="number"
                                value={qtyDispensed}
                                onChange={(e) => setQtyDispensed(parseInt(e.target.value) || 0)}
                                max={maxQty}
                                min={1}
                                className={`w-32 px-3 py-2 border rounded-md ${qtyDispensed > maxQty ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            />
                            {qtyDispensed > maxQty && (
                                <p className="mt-1 text-sm text-red-600">
                                    Cannot exceed {maxQty} pills
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comments
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={3}
                                placeholder="Optional comments..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDispense}
                            disabled={dispenseMutation.isPending || !selectedDrugUnit}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {dispenseMutation.isPending ? 'Dispensing...' : 'Dispense Drug'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DispenseDrugPage;
