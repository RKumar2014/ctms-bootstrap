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
    const [firstDoseDate, setFirstDoseDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [pillsPerDay, setPillsPerDay] = useState(1);
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

    // Fetch previous visit's accountability to validate first dose date
    // Gets all accountability records for this subject and finds the most recent returned one
    const { data: previousVisitData } = useQuery({
        queryKey: ['previous-visit-accountability', subjectId],
        queryFn: async () => {
            // Get all accountability records for this subject
            const response = await accountabilityApi.list({ subject_id: subjectId });
            const records = response.data || [];

            console.log('DEBUG: All accountability records for subject:', records);

            // Find records that have been returned (have date_of_last_dose)
            const returnedRecords = records.filter((r: any) => r.date_of_last_dose);

            console.log('DEBUG: Returned records:', returnedRecords);

            // Return the most recent returned record (by last dose date)
            if (returnedRecords.length > 0) {
                const sorted = returnedRecords.sort((a: any, b: any) =>
                    new Date(b.date_of_last_dose).getTime() - new Date(a.date_of_last_dose).getTime()
                );
                console.log('DEBUG: Most recent returned record:', sorted[0]);
                return sorted[0];
            }

            // Also check if there's a dispensed (not returned) record that would block
            const dispensedRecords = records.filter((r: any) =>
                r.drug_unit?.status === 'Dispensed' && !r.date_of_last_dose
            );
            console.log('DEBUG: Dispensed (not returned) records:', dispensedRecords);

            if (dispensedRecords.length > 0) {
                return dispensedRecords[0]; // Return to trigger "must return first" error
            }

            return null;
        },
        enabled: !!subjectId,
    });

    // Validate first dose date against previous visit's last dose
    const getFirstDoseWarning = (): string | null => {
        if (!previousVisitData) return null;

        const prevLastDose = previousVisitData.date_of_last_dose;
        if (!prevLastDose) {
            return `Warning: Previous visit's drug has not been returned yet. First Dose Date may need adjustment.`;
        }

        const prevLastDoseDate = new Date(prevLastDose);
        const firstDoseDateObj = new Date(firstDoseDate);

        if (firstDoseDateObj < prevLastDoseDate) {
            return `Warning: First Dose Date (${firstDoseDate}) is before previous visit's Last Dose Date (${prevLastDose}). This may indicate an overlap.`;
        }

        return null;
    };

    const firstDoseWarning = getFirstDoseWarning();

    // Dispense mutation
    const dispenseMutation = useMutation({
        mutationFn: async (data: any) => {
            // Create accountability record with First Dose Date and Pills Per Day
            const accResponse = await accountabilityApi.create({
                subject_id: parseInt(subjectId!),
                visit_id: parseInt(visitId!),
                drug_unit_id: parseInt(selectedDrugUnit),
                qty_dispensed: qtyDispensed,
                qty_returned: 0,
                reconciliation_date: new Date().toISOString(),
                date_of_first_dose: firstDoseDate,  // Captured at dispense time
                pills_per_day: pillsPerDay,          // Captured at dispense time
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
            setFirstDoseDate(new Date().toISOString().split('T')[0]); // Reset to today
            setPillsPerDay(1);
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

        // CRITICAL VALIDATION 1: Block dispensing if previous visit drugs not returned
        if (previousVisitData) {
            const previousDrugStatus = previousVisitData.drug_unit?.status;
            const previousQtyReturned = previousVisitData.qty_returned;

            // Check if previous visit's drug is still dispensed (not returned)
            if (previousDrugStatus === 'Dispensed' || previousQtyReturned === null || previousQtyReturned === 0) {
                const previousVisitName = previousVisitData.subject_visit?.visit_details?.visit_name ||
                    previousVisitData.visit?.visit_name ||
                    'Previous visit';
                setErrorMessage(
                    `Cannot dispense for this visit. ${previousVisitName} drugs have not been returned yet. ` +
                    `Please record the return for ${previousVisitName} before dispensing for this visit.`
                );
                return;
            }

            // CRITICAL VALIDATION 2: Block medication overlap - First Dose must be AFTER previous visit Last Dose
            const previousLastDose = previousVisitData.date_of_last_dose;
            if (previousLastDose) {
                // Parse dates and normalize to UTC noon for consistent comparison
                const parseDateToUTCNoon = (dateStr: string): Date => {
                    const date = new Date(dateStr);
                    return new Date(Date.UTC(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        12, 0, 0
                    ));
                };

                const previousLastDoseDate = parseDateToUTCNoon(previousLastDose);
                const currentFirstDoseDate = parseDateToUTCNoon(firstDoseDate);

                // Block if current First Dose is on or before previous Last Dose
                if (currentFirstDoseDate <= previousLastDoseDate) {
                    const previousVisitName = previousVisitData.subject_visit?.visit_details?.visit_name ||
                        previousVisitData.visit?.visit_name ||
                        'Previous visit';
                    const prevLastFormatted = new Date(previousLastDose).toLocaleDateString();

                    // Calculate suggested next day
                    const nextDayTimestamp = previousLastDoseDate.getTime() + 86400000; // +1 day in ms
                    const suggestedDate = new Date(nextDayTimestamp).toLocaleDateString();

                    setErrorMessage(
                        `⚠️ Medication overlap detected! First Dose for this visit (${firstDoseDate}) ` +
                        `must be AFTER ${previousVisitName}'s Last Dose (${prevLastFormatted}). ` +
                        `Please adjust the First Dose Date to ${suggestedDate} or later to avoid overlap.`
                    );
                    return;
                }
            }
        }

        dispenseMutation.mutate({});
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dispense Drug</h1>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
                >
                    ← Back
                </button>
            </div>

            {/* Content */}
            <div className="max-w-4xl">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date of First Dose *
                                </label>
                                <input
                                    type="date"
                                    value={firstDoseDate}
                                    onChange={(e) => setFirstDoseDate(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md ${firstDoseWarning ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    When the patient will start taking the medication
                                </p>
                                {firstDoseWarning && (
                                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                                        <p className="text-xs text-yellow-800">⚠️ {firstDoseWarning}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pills Per Day *
                                </label>
                                <input
                                    type="number"
                                    value={pillsPerDay}
                                    onChange={(e) => setPillsPerDay(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={10}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    As per study protocol
                                </p>
                            </div>
                        </div>

                        {/* Duration Preview */}
                        {qtyDispensed > 0 && pillsPerDay > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <strong>Expected Duration:</strong>{' '}
                                    {Math.floor(qtyDispensed / pillsPerDay)} days
                                    ({qtyDispensed} pills ÷ {pillsPerDay} pills/day)
                                </p>
                            </div>
                        )}

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
