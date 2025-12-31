import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi, subjectsApi, accountabilityApi, api } from '../../lib/api';

// Helper function to format date strings without timezone shift
// Handles both ISO dates (2024-12-08) and full timestamps (2024-12-08T00:00:00Z)
const formatDateString = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return '-';
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
};

const SubjectAccountabilityPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { logout } = useAuth();
    const queryClient = useQueryClient();

    // Initialize from URL params if provided
    const [selectedSite, setSelectedSite] = useState(searchParams.get('site') || '');
    const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
    const [selectedVisit, setSelectedVisit] = useState('all');
    const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Return modal state
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [returnQty, setReturnQty] = useState(0);
    const [returnDate, setReturnDate] = useState('');
    const [returnComments, setReturnComments] = useState('');
    const [returnStatus, setReturnStatus] = useState('RETURNED');
    // Enhanced compliance fields
    const [dateOfFirstDose, setDateOfFirstDose] = useState('');
    const [dateOfLastDose, setDateOfLastDose] = useState('');
    const [pillsPerDay, setPillsPerDay] = useState(1);
    // Validation warnings
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
    // Inline comment editing
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // Edit record modal state (for fixing missing dates)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<any>(null);
    const [editFirstDose, setEditFirstDose] = useState('');
    const [editLastDose, setEditLastDose] = useState('');
    const [editPillsPerDay, setEditPillsPerDay] = useState(1);

    // Auto-validate dates when they change (fixes React closure issue)
    useEffect(() => {
        if (isReturnModalOpen && selectedRecord) {
            const validateDates = () => {
                const warnings: string[] = [];
                const errors: string[] = [];

                // Get the effective first dose date
                const effectiveFirstDose = selectedRecord.date_of_first_dose || dateOfFirstDose;


                // Helper to parse dates consistently - uses UTC noon to avoid timezone issues
                const parseDateValue = (dateStr: string): Date | null => {
                    if (!dateStr) return null;

                    // Extract just the date part (YYYY-MM-DD)
                    let cleanDate = dateStr;
                    if (dateStr.includes('T')) {
                        cleanDate = dateStr.split('T')[0];
                    }

                    // Parse as YYYY-MM-DD and create date at noon UTC (avoid timezone issues)
                    const parts = cleanDate.split('-');
                    if (parts.length === 3) {
                        const year = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const day = parseInt(parts[2]);
                        // Create date at noon UTC to avoid timezone edge cases
                        return new Date(Date.UTC(year, month, day, 12, 0, 0));
                    }

                    return null;
                };

                const firstDoseObj = parseDateValue(effectiveFirstDose);
                const lastDoseObj = parseDateValue(dateOfLastDose);
                const returnDateObj = parseDateValue(returnDate);

                // Get today's date as string for simpler future date comparison (avoids timezone issues)
                const todayDateStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

                // VALIDATION 1: Return Date >= First Dose Date (not created_at)
                // Use first dose date because that's when patient started taking medication
                if (returnDateObj && firstDoseObj && returnDateObj.getTime() < firstDoseObj.getTime()) {
                    warnings.push('Return date cannot be before first dose date');
                }

                // NEW VALIDATION 2: Return Date not in future (string comparison avoids timezone issues)
                console.log('DEBUG Return Date:', returnDate, '> today:', todayDateStr, '=', returnDate > todayDateStr);
                if (returnDate && returnDate > todayDateStr) {
                    warnings.push('Return date cannot be in the future');
                }

                // NEW VALIDATION 3: Last Dose Date not in future (string comparison avoids timezone issues)
                console.log('DEBUG Last Dose:', dateOfLastDose, '> today:', todayDateStr, '=', dateOfLastDose > todayDateStr);
                if (dateOfLastDose && dateOfLastDose > todayDateStr) {
                    warnings.push('Last dose date cannot be in the future');
                }

                // Validate: First dose should be before or on last dose
                if (firstDoseObj && lastDoseObj && firstDoseObj.getTime() > lastDoseObj.getTime()) {
                    warnings.push('First dose date cannot be after last dose date');
                }

                // Validate: Last dose should be on or before return date
                if (lastDoseObj && returnDateObj && lastDoseObj.getTime() > returnDateObj.getTime()) {
                    warnings.push('Last dose date should not be after return date');
                }

                // Validate: Return date should be on or after first dose date
                if (returnDateObj && firstDoseObj && returnDateObj.getTime() < firstDoseObj.getTime()) {
                    warnings.push('Return date should not be before first dose date');
                }

                // Add visit sequence warnings
                const sequenceWarnings = checkVisitSequenceWarnings(selectedRecord);
                setValidationWarnings([...sequenceWarnings, ...warnings]);
            };

            validateDates();
        }
    }, [isReturnModalOpen, selectedRecord, dateOfFirstDose, dateOfLastDose, returnDate]);

    // Fetch sites
    const { data: sitesResponse } = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const response = await sitesApi.list();
            return response.data;
        },
    });
    const sites = sitesResponse || [];

    // Fetch subjects for selected site
    const { data: subjectsResponse } = useQuery({
        queryKey: ['subjects', selectedSite],
        queryFn: async () => {
            if (!selectedSite) return [];
            const response = await subjectsApi.list({ site: selectedSite });
            return response.data;
        },
        enabled: !!selectedSite,
    });
    const subjects = subjectsResponse || [];

    // Fetch subject visits for selected subject
    const { data: subjectVisitsResponse } = useQuery({
        queryKey: ['subject-visits', selectedSubject],
        queryFn: async () => {
            if (!selectedSubject) return [];
            const response = await api.get(`/subjects/${selectedSubject}/visits`);
            return response.data;
        },
        enabled: !!selectedSubject,
    });
    const subjectVisits = subjectVisitsResponse || [];

    // Fetch accountability records
    const { data: accountabilityRecords = [], isLoading } = useQuery({
        queryKey: ['accountability', selectedSite, selectedSubject, selectedVisit],
        queryFn: async () => {
            if (!selectedSubject) return [];
            const response = await accountabilityApi.list({
                site_id: selectedSite,
                subject_id: selectedSubject,
                visit_id: selectedVisit === 'all' ? undefined : selectedVisit
            });
            return response.data;
        },
        enabled: !!selectedSubject,
    });

    // Get visit sequence from visit name (extracts number from "Visit X" or uses sequence)
    const getVisitSequence = (visitName: string | undefined): number => {
        if (!visitName) return 999;
        const lowerName = visitName.toLowerCase();
        if (lowerName.includes('screen')) return 0;
        if (lowerName.includes('enroll')) return 1;
        if (lowerName.includes('rollover')) return 100; // Rollover visits are later
        const match = visitName.match(/\d+/);
        return match ? parseInt(match[0]) + 1 : 50; // Add 1 so Visit 1 comes after Enrollment
    };

    // Check if previous visits are completed (have returns recorded)
    const checkVisitSequenceWarnings = (currentRecord: any): string[] => {
        const warnings: string[] = [];
        const currentVisitName = currentRecord.subject_visit?.visit_details?.visit_name || '';
        const currentSequence = getVisitSequence(currentVisitName);

        // Get all records for this subject sorted by visit sequence
        const sortedRecords = [...accountabilityRecords].sort((a: any, b: any) => {
            const seqA = getVisitSequence(a.subject_visit?.visit_details?.visit_name);
            const seqB = getVisitSequence(b.subject_visit?.visit_details?.visit_name);
            return seqA - seqB;
        });

        // Check if any earlier visits are incomplete
        for (const record of sortedRecords) {
            const recordVisitName = record.subject_visit?.visit_details?.visit_name || '';
            const recordSequence = getVisitSequence(recordVisitName);

            if (recordSequence < currentSequence) {
                // Check if this earlier visit has a return recorded
                const isDispensed = record.drug_unit?.status === 'Dispensed';
                const hasReturn = record.qty_returned > 0;

                if (isDispensed && !hasReturn) {
                    warnings.push(`Previous visit "${recordVisitName}" has not been returned yet`);
                }
            }
        }

        return warnings;
    };

    // Helper to parse date strings consistently - uses UTC noon to avoid timezone issues
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;

        // Extract just the date part (YYYY-MM-DD)
        let cleanDate = dateStr;
        if (dateStr.includes('T')) {
            cleanDate = dateStr.split('T')[0];
        }

        // Parse as YYYY-MM-DD and create date at noon UTC (avoid timezone issues)
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            // Create date at noon UTC to avoid timezone edge cases
            return new Date(Date.UTC(year, month, day, 12, 0, 0));
        }

        return null;
    };

    // Validate dates for the return modal
    const validateReturnDates = (): string[] => {
        const warnings: string[] = [];

        if (!selectedRecord) return warnings;

        // Get the effective first dose date (from record if set at dispense, or from modal input)
        const effectiveFirstDose = selectedRecord.date_of_first_dose || dateOfFirstDose;

        const firstDoseObj = parseDate(effectiveFirstDose);
        const lastDoseObj = parseDate(dateOfLastDose);
        const returnDateObj = parseDate(returnDate);

        // Get today's date as string for simpler future date comparison (avoids timezone issues)
        const todayDateStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Get dispense date from the record
        const dispenseDate = selectedRecord.created_at || selectedRecord.dispense_date;
        const dispenseDateObj = parseDate(dispenseDate);

        // NEW VALIDATION 1: Return Date >= Dispense Date
        if (returnDateObj && dispenseDateObj && returnDateObj.getTime() < dispenseDateObj.getTime()) {
            warnings.push('Return date cannot be before dispense date');
        }

        // NEW VALIDATION 2: Return Date not in future (string comparison avoids timezone issues)
        if (returnDate && returnDate > todayDateStr) {
            warnings.push('Return date cannot be in the future');
        }

        // NEW VALIDATION 3: Last Dose Date not in future (string comparison avoids timezone issues)
        if (dateOfLastDose && dateOfLastDose > todayDateStr) {
            warnings.push('Last dose date cannot be in the future');
        }

        // Validate: First dose should be before or on last dose (CRITICAL)
        if (firstDoseObj && lastDoseObj) {
            if (firstDoseObj.getTime() > lastDoseObj.getTime()) {
                warnings.push('First dose date cannot be after last dose date');
            }
        }

        // Validate: Last dose should be on or before return date
        if (lastDoseObj && returnDateObj) {
            if (lastDoseObj.getTime() > returnDateObj.getTime()) {
                warnings.push(`Last dose date should not be after return date`);
            }
        }

        // Validate: Return date should be on or after first dose date
        if (returnDateObj && firstDoseObj) {
            if (returnDateObj.getTime() < firstDoseObj.getTime()) {
                warnings.push(`Return date should not be before first dose date`);
            }
        }

        return warnings;
    };

    // Bulk submit mutation
    const submitMutation = useMutation({
        mutationFn: async (records: any[]) => {
            return await accountabilityApi.bulkSubmit(records);
        },
        onSuccess: (response) => {
            setSuccessMessage(response.data.message || 'Successfully submitted accountability records');
            setErrorMessage('');
            setSelectedRecords(new Set());
            queryClient.invalidateQueries({ queryKey: ['accountability'] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to submit accountability records');
            setSuccessMessage('');
        },
    });

    // Return mutation with enhanced compliance tracking
    const returnMutation = useMutation({
        mutationFn: async (data: {
            id: string;
            qty_returned: number;
            return_date: string;
            date_of_first_dose?: string;
            date_of_last_dose?: string;
            pills_per_day?: number;
            return_status?: string;
            comments: string;
        }) => {
            return await accountabilityApi.recordReturn(data.id, {
                qty_returned: data.qty_returned,
                return_date: data.return_date,
                date_of_first_dose: data.date_of_first_dose,
                date_of_last_dose: data.date_of_last_dose,
                pills_per_day: data.pills_per_day,
                return_status: data.return_status,
                comments: data.comments
            });
        },
        onSuccess: () => {
            setSuccessMessage('Return recorded successfully with compliance calculation');
            setErrorMessage('');
            setIsReturnModalOpen(false);
            setSelectedRecord(null);
            setReturnQty(0);
            setReturnDate('');
            setReturnComments('');
            setReturnStatus('RETURNED');
            setDateOfFirstDose('');
            setDateOfLastDose('');
            setPillsPerDay(1);
            queryClient.invalidateQueries({ queryKey: ['accountability'] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to record return');
            setSuccessMessage('');
        },
    });

    // Update comment mutation
    const updateCommentMutation = useMutation({
        mutationFn: async (data: { id: number; comments: string }) => {
            return await api.put(`/accountability/${data.id}`, { comments: data.comments });
        },
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingCommentText('');
            queryClient.invalidateQueries({ queryKey: ['accountability'] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to update comment');
        },
    });

    // Edit record mutation (for fixing dates)
    const editRecordMutation = useMutation({
        mutationFn: async (data: {
            id: string;
            date_of_first_dose?: string;
            date_of_last_dose?: string;
            pills_per_day?: number;
        }) => {
            return await accountabilityApi.update(data.id, {
                date_of_first_dose: data.date_of_first_dose,
                date_of_last_dose: data.date_of_last_dose,
                pills_per_day: data.pills_per_day
            });
        },
        onSuccess: () => {
            setSuccessMessage('Record updated successfully');
            setErrorMessage('');
            setIsEditModalOpen(false);
            setEditRecord(null);
            queryClient.invalidateQueries({ queryKey: ['accountability'] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to update record');
            setSuccessMessage('');
        },
    });

    // Open edit modal
    const openEditModal = (record: any) => {
        setEditRecord(record);
        setEditFirstDose(record.date_of_first_dose
            ? new Date(record.date_of_first_dose).toISOString().split('T')[0]
            : '');
        setEditLastDose(record.date_of_last_dose
            ? new Date(record.date_of_last_dose).toISOString().split('T')[0]
            : '');
        setEditPillsPerDay(record.pills_per_day || 1);
        setIsEditModalOpen(true);
    };

    // Handle edit submission
    const handleEditSubmit = () => {
        if (!editRecord) return;

        editRecordMutation.mutate({
            id: editRecord.accountability_id.toString(),
            date_of_first_dose: editFirstDose || undefined,
            date_of_last_dose: editLastDose || undefined,
            pills_per_day: editPillsPerDay
        });
    };

    // Start editing a comment
    const startEditingComment = (record: any) => {
        setEditingCommentId(record.accountability_id);
        setEditingCommentText(record.comments || '');
    };

    // Save comment
    const saveComment = (id: number) => {
        updateCommentMutation.mutate({ id, comments: editingCommentText });
    };

    // Cancel editing
    const cancelEditingComment = () => {
        setEditingCommentId(null);
        setEditingCommentText('');
    };

    const handleSubmit = () => {
        const recordsToSubmit = accountabilityRecords.filter((record: any) =>
            selectedRecords.has(record.accountability_id)
        );

        if (recordsToSubmit.length === 0) {
            setErrorMessage('Please select at least one record to submit');
            return;
        }

        submitMutation.mutate(recordsToSubmit);
    };

    const toggleRecordSelection = (id: number) => {
        const newSelection = new Set(selectedRecords);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedRecords(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedRecords.size === accountabilityRecords.length) {
            setSelectedRecords(new Set());
        } else {
            setSelectedRecords(new Set(accountabilityRecords.map((r: any) => r.accountability_id)));
        }
    };

    // Open return modal
    const openReturnModal = (record: any) => {
        setSelectedRecord(record);
        setReturnQty(0);
        setReturnDate(new Date().toISOString().split('T')[0]);
        setReturnComments(record.comments || '');
        // Load First Dose Date from existing record (captured at dispense time)
        // If not set, default to today
        setDateOfFirstDose(record.date_of_first_dose
            ? new Date(record.date_of_first_dose).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]);
        // Don't pre-fill Last Dose - patient may have taken their last dose days ago
        setDateOfLastDose('');
        // Load Pills Per Day from existing record (captured at dispense time)
        setPillsPerDay(record.pills_per_day || 1);

        // Check visit sequence warnings
        const sequenceWarnings = checkVisitSequenceWarnings(record);
        setValidationWarnings(sequenceWarnings);

        setIsReturnModalOpen(true);
    };

    // Handle return submission with enhanced compliance
    const handleReturn = () => {
        if (!selectedRecord) return;

        if (returnQty < 0) {
            setErrorMessage('Quantity returned cannot be negative');
            return;
        }

        if (returnQty > selectedRecord.qty_dispensed) {
            setErrorMessage(`Cannot return more than dispensed (${selectedRecord.qty_dispensed})`);
            return;
        }

        // Validate Last Dose Date is required
        if (!dateOfLastDose) {
            setErrorMessage('Last Dose Date is required to calculate compliance');
            return;
        }

        // Validate First Dose Date exists (either from record or entered manually)
        const effectiveFirstDose = selectedRecord.date_of_first_dose || dateOfFirstDose;
        if (!effectiveFirstDose) {
            setErrorMessage('First Dose Date is required to calculate compliance');
            return;
        }

        // Validate Last Dose >= First Dose
        const firstDoseDate = new Date(effectiveFirstDose);
        const lastDoseDate = new Date(dateOfLastDose);
        if (lastDoseDate < firstDoseDate) {
            setErrorMessage('Last Dose Date cannot be before First Dose Date');
            return;
        }

        // Run date validations (warnings only, don't block)
        const dateWarnings = validateReturnDates();
        const allWarnings = [...validationWarnings.filter(w => !w.includes('Previous visit')), ...dateWarnings];

        // Combine with sequence warnings for display
        setValidationWarnings([...checkVisitSequenceWarnings(selectedRecord), ...dateWarnings]);

        returnMutation.mutate({
            id: selectedRecord.accountability_id.toString(),
            qty_returned: returnQty,
            return_date: returnDate,
            date_of_first_dose: effectiveFirstDose,
            date_of_last_dose: dateOfLastDose,
            pills_per_day: selectedRecord.pills_per_day || pillsPerDay,
            return_status: returnStatus,
            comments: returnComments
        });
    };

    // Calculate live compliance preview for modal
    const calculateCompliancePreview = () => {
        if (!selectedRecord || !dateOfFirstDose || !dateOfLastDose || returnQty < 0) {
            return null;
        }

        const firstDose = new Date(dateOfFirstDose);
        const lastDose = new Date(dateOfLastDose);
        const timeDiff = lastDose.getTime() - firstDose.getTime();
        const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        if (daysUsed <= 0) return null;

        const pillsUsed = selectedRecord.qty_dispensed - returnQty;
        const expectedPills = daysUsed * pillsPerDay;
        const compliance = expectedPills > 0 ? Math.round((pillsUsed / expectedPills) * 100) : 0;

        // NEW: Add compliance warning flags
        const overComplianceWarning = compliance > 120 && compliance <= 200;
        const overComplianceError = compliance > 200;

        return { daysUsed, expectedPills, pillsUsed, compliance, overComplianceWarning, overComplianceError };
    };

    // Calculate pills used (from DB or calculate)
    const getPillsUsed = (record: any) => {
        // Use stored value if available
        if (record.pills_used !== null && record.pills_used !== undefined) {
            return record.pills_used;
        }
        // Fallback calculation
        const dispensed = record.qty_dispensed || 0;
        const returned = record.qty_returned || 0;
        return dispensed - returned;
    };

    // Get days used from record (ONLY if dates are available)
    const getDaysUsed = (record: any) => {
        // Use stored value if available
        if (record.days_used) return record.days_used;

        // Calculate from dates ONLY if BOTH dates are available
        if (record.date_of_first_dose && record.date_of_last_dose) {
            const firstDose = new Date(record.date_of_first_dose);
            const lastDose = new Date(record.date_of_last_dose);
            const timeDiff = lastDose.getTime() - firstDose.getTime();
            return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        }

        // Cannot calculate without dates
        return null;
    };

    // Get expected pills from record (ONLY if we have days used)
    const getExpectedPills = (record: any) => {
        // Use stored value if available
        if (record.expected_pills) return record.expected_pills;

        // Calculate ONLY if we have days used (which requires dates)
        const daysUsed = getDaysUsed(record);
        if (daysUsed === null) return null;

        const pillsPerDay = record.pills_per_day || 1;
        return daysUsed * pillsPerDay;
    };

    // Get compliance percentage - uses correct formula: (Pills Used / Expected Pills) × 100
    // Returns: { value: number | null, status: 'valid' | 'no_dates' | 'none_used' | 'not_returned' }
    const getComplianceData = (record: any): { value: number | null; status: string } => {
        // No compliance if no return recorded
        const hasReturn = record.qty_returned !== null && record.qty_returned !== undefined && record.qty_returned >= 0 && record.drug_unit?.status === 'Returned';
        if (!hasReturn) {
            return { value: null, status: 'not_returned' };
        }

        const dispensed = record.qty_dispensed || 0;
        const returned = record.qty_returned || 0;
        const pillsUsed = dispensed - returned;

        // Special case: 0 pills used (patient returned all pills)
        if (pillsUsed === 0) {
            return { value: 0, status: 'none_used' };
        }

        // Cannot calculate compliance without dates
        if (!record.date_of_first_dose || !record.date_of_last_dose) {
            return { value: null, status: 'no_dates' };
        }

        // Calculate properly with dates
        const firstDose = new Date(record.date_of_first_dose);
        const lastDose = new Date(record.date_of_last_dose);
        const timeDiff = lastDose.getTime() - firstDose.getTime();
        const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        const pillsPerDay = record.pills_per_day || 1;
        const expectedPills = daysUsed * pillsPerDay;

        if (expectedPills > 0) {
            const compliance = Math.round((pillsUsed / expectedPills) * 10000) / 100;
            return { value: compliance, status: 'valid' };
        }

        return { value: null, status: 'no_dates' };
    };

    // Legacy wrapper for backward compatibility
    const getCompliance = (record: any) => {
        const data = getComplianceData(record);
        return data.value;
    };

    // Get compliance status color based on value and status
    const getComplianceColor = (compliance: number | null, status: string) => {
        if (status === 'none_used') return 'bg-gray-100 text-gray-600'; // 0% - None used (gray, not red)
        if (status === 'no_dates') return 'bg-gray-100 text-gray-500'; // N/A - missing dates
        if (compliance === null) return 'text-gray-400';
        if (compliance > 100) return 'bg-orange-100 text-orange-800'; // Over-compliance
        if (compliance >= 80) return 'bg-green-100 text-green-800'; // Good (>80%)
        if (compliance >= 60) return 'bg-yellow-100 text-yellow-800'; // Warning (60-80%)
        return 'bg-red-100 text-red-800'; // Poor (<60%)
    };

    // Format compliance display based on status
    const formatComplianceDisplay = (record: any) => {
        const data = getComplianceData(record);

        switch (data.status) {
            case 'not_returned':
                return { text: '-', color: 'text-gray-400', tooltip: 'Not yet returned' };
            case 'none_used':
                return { text: '0%', subtext: '(None Used)', color: 'bg-gray-100 text-gray-600', tooltip: 'Patient returned all pills - none used' };
            case 'no_dates':
                return { text: 'N/A', color: 'bg-gray-100 text-gray-500', tooltip: 'Cannot calculate - missing First Dose and Last Dose dates' };
            case 'valid':
                const color = getComplianceColor(data.value, data.status);
                const tooltip = `${getPillsUsed(record)} used / ${getExpectedPills(record)} expected`;
                return {
                    text: `${data.value}%`,
                    color,
                    tooltip,
                    isOver: data.value !== null && data.value > 100
                };
            default:
                return { text: '-', color: 'text-gray-400', tooltip: '' };
        }
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Subject Accountability</h1>
            </div>

            {/* Content */}
            <div>
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-6">Serialized</h2>

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

                    {/* Filter Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Site Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Site:
                            </label>
                            <select
                                value={selectedSite}
                                onChange={(e) => {
                                    setSelectedSite(e.target.value);
                                    setSelectedSubject('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Select site...</option>
                                {sites.map((site: any) => (
                                    <option key={site.site_id} value={site.site_id}>
                                        {site.site_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subject Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject:
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setSelectedVisit('all');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled={!selectedSite}
                            >
                                <option value="">Select subject...</option>
                                {subjects.map((subject: any) => (
                                    <option key={subject.subject_id} value={subject.subject_id}>
                                        {subject.subject_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Visit Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Visit:
                            </label>
                            <select
                                value={selectedVisit}
                                onChange={(e) => setSelectedVisit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled={!selectedSubject}
                            >
                                <option value="all">&lt; All &gt;</option>
                                {subjectVisits.map((sv: any) => (
                                    <option key={sv.subject_visit_id} value={sv.subject_visit_id}>
                                        {sv.visit?.visit_name || sv.visits?.visit_name || `Visit ${sv.visit_id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            title="Select all"
                                            checked={accountabilityRecords.length > 0 && selectedRecords.size === accountabilityRecords.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Drug Unit ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Drug Code
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Visit Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Qty Dispensed
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Qty Returned
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pills Used
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        First Dose
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Last Dose
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pills/Day
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Days Used
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Expected
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Compliance %
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Return Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Comments
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : accountabilityRecords.length > 0 ? (
                                    accountabilityRecords.map((record: any) => {
                                        const pillsUsed = getPillsUsed(record);
                                        const daysUsed = getDaysUsed(record);
                                        const expectedPills = getExpectedPills(record);
                                        const compliance = getCompliance(record);
                                        const hasReturn = record.qty_returned > 0;
                                        const isDispensed = record.drug_unit?.status === 'Dispensed';
                                        const isReturned = record.drug_unit?.status === 'Returned';
                                        const canRecordReturn = isDispensed && !hasReturn;

                                        return (
                                            <tr key={record.accountability_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded"
                                                        checked={selectedRecords.has(record.accountability_id)}
                                                        onChange={() => toggleRecordSelection(record.accountability_id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {record.drug_unit?.drug_unit_id || record.drug_unit_id}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {record.drug_unit?.drug_code || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {record.subject_visit?.visit_details?.visit_name || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${record.drug_unit?.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                        record.drug_unit?.status === 'Dispensed' ? 'bg-blue-100 text-blue-800' :
                                                            record.drug_unit?.status === 'Returned' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {record.drug_unit?.status || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {record.qty_dispensed || 0}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {hasReturn ? (
                                                        <span className="text-green-600 font-medium">{record.qty_returned}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {hasReturn ? (
                                                        <span className="font-medium text-orange-600">{pillsUsed}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateString(record.date_of_first_dose)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateString(record.date_of_last_dose)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {record.pills_per_day || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {daysUsed !== null ? (
                                                        <span className="font-medium">{daysUsed}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {expectedPills !== null ? (
                                                        <span className="font-medium text-blue-600">{expectedPills}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {(() => {
                                                        const compDisplay = formatComplianceDisplay(record);
                                                        return (
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs font-medium ${compDisplay.color}`}
                                                                title={compDisplay.tooltip}
                                                            >
                                                                {compDisplay.text}
                                                                {compDisplay.subtext && <span className="block text-[10px]">{compDisplay.subtext}</span>}
                                                                {compDisplay.isOver && ' ⚠️'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateString(record.return_date)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {isReturned || hasReturn ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                            Returned
                                                        </span>
                                                    ) : canRecordReturn ? (
                                                        <button
                                                            onClick={() => openReturnModal(record)}
                                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                        >
                                                            Record Return
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                    {/* Edit button for records missing dates */}
                                                    {hasReturn && (!record.date_of_first_dose || !record.date_of_last_dose) && (
                                                        <button
                                                            onClick={() => openEditModal(record)}
                                                            className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                                                            title="Fix missing dates"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 min-w-[200px]">
                                                    {editingCommentId === record.accountability_id ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                value={editingCommentText}
                                                                onChange={(e) => setEditingCommentText(e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveComment(record.accountability_id);
                                                                    if (e.key === 'Escape') cancelEditingComment();
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => saveComment(record.accountability_id)}
                                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                                disabled={updateCommentMutation.isPending}
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                onClick={cancelEditingComment}
                                                                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[28px] flex items-center"
                                                            onClick={() => startEditingComment(record)}
                                                            title="Click to edit"
                                                        >
                                                            {record.comments || <span className="text-gray-400 italic">Click to add...</span>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                                            No items to display
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSubmit}
                            className={`px-6 py-2 rounded text-white ${submitMutation.isPending
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                            disabled={accountabilityRecords.length === 0 || submitMutation.isPending}
                        >
                            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>

                    {/* Records Summary */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-gray-900">{accountabilityRecords.length}</span> record(s)
                        </div>
                        <div className="text-sm text-gray-500">
                            {accountabilityRecords.filter((r: any) => r.qty_returned > 0).length} returned | {' '}
                            {accountabilityRecords.filter((r: any) => r.drug_unit?.status === 'Dispensed' && !r.qty_returned).length} pending return
                        </div>
                    </div>
                </div>
            </div>

            {/* Return Modal with Enhanced Compliance */}
            {isReturnModalOpen && selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Record Return & Calculate Compliance</h3>
                        </div>

                        <div className="px-6 py-4">
                            {/* Record Info */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Drug Unit:</span>
                                        <span className="ml-2 font-medium">{selectedRecord.drug_unit?.drug_unit_id || selectedRecord.drug_unit_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Drug Code:</span>
                                        <span className="ml-2 font-medium">{selectedRecord.drug_unit?.drug_code || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Qty Dispensed:</span>
                                        <span className="ml-2 font-medium text-blue-600">{selectedRecord.qty_dispensed}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Subject:</span>
                                        <span className="ml-2 font-medium">{selectedRecord.subject?.subject_number || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Visit:</span>
                                        <span className="ml-2 font-medium">{selectedRecord.subject_visit?.visit_details?.visit_name || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Dispense Date:</span>
                                        <span className="ml-2 font-medium">{formatDateString(selectedRecord.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Validation Warnings */}
                            {validationWarnings.length > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-md">
                                    <div className="flex items-start">
                                        <span className="text-amber-500 mr-2 text-lg">⚠️</span>
                                        <div>
                                            <div className="text-sm font-semibold text-amber-800 mb-1">Warnings (you can still proceed)</div>
                                            <ul className="text-sm text-amber-700 list-disc list-inside">
                                                {validationWarnings.map((warning, idx) => (
                                                    <li key={idx}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Return Date */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Return Date *
                                </label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Quantity Returned */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pills Remaining in Bottle * <span className="text-gray-400">(max: {selectedRecord.qty_dispensed})</span>
                                </label>
                                <input
                                    type="number"
                                    value={returnQty}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setReturnQty(val === '' ? 0 : parseInt(val));
                                    }}
                                    min={0}
                                    max={selectedRecord.qty_dispensed}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Compliance Calculation Section */}
                            <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                                <h4 className="text-sm font-semibold text-blue-800 mb-3">Compliance Calculation</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date of First Dose - Read-only if captured at dispense */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of First Dose
                                            {selectedRecord?.date_of_first_dose && (
                                                <span className="ml-1 text-green-600 text-xs">(from dispense)</span>
                                            )}
                                        </label>
                                        {selectedRecord?.date_of_first_dose ? (
                                            // Read-only display when captured at dispense
                                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm">
                                                {formatDateString(selectedRecord.date_of_first_dose)}
                                            </div>
                                        ) : (
                                            // Editable for legacy records
                                            <>
                                                <input
                                                    type="date"
                                                    value={dateOfFirstDose}
                                                    onChange={(e) => setDateOfFirstDose(e.target.value)}
                                                    className="w-full px-3 py-2 border border-yellow-400 bg-yellow-50 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                                                />
                                                <p className="mt-1 text-xs text-yellow-600">
                                                    ⚠️ Not captured at dispense - please enter manually
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Date of Last Dose - Required */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of Last Dose <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={dateOfLastDose}
                                            onChange={(e) => setDateOfLastDose(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${!dateOfLastDose ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                        />
                                        {!dateOfLastDose && (
                                            <p className="mt-1 text-xs text-red-600">
                                                Required to calculate compliance
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Pills Per Day - Read-only if captured at dispense */}
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pills Per Day
                                        {selectedRecord?.pills_per_day && (
                                            <span className="ml-1 text-green-600 text-xs">(from dispense)</span>
                                        )}
                                    </label>
                                    {selectedRecord?.pills_per_day ? (
                                        // Read-only display when captured at dispense
                                        <div className="w-32 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                                            {selectedRecord.pills_per_day} pill(s)/day
                                        </div>
                                    ) : (
                                        // Editable for legacy records
                                        <input
                                            type="number"
                                            value={pillsPerDay}
                                            onChange={(e) => setPillsPerDay(parseInt(e.target.value) || 1)}
                                            min={1}
                                            max={10}
                                            className="w-full px-3 py-2 border border-yellow-400 bg-yellow-50 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    )}
                                </div>

                                {/* Live Compliance Preview */}
                                {(() => {
                                    const preview = calculateCompliancePreview();
                                    if (preview) {
                                        return (
                                            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                                                <div className="text-xs text-gray-500 mb-2">Compliance Preview</div>
                                                <div className="grid grid-cols-4 gap-2 text-sm">
                                                    <div className="text-center">
                                                        <div className="text-gray-500 text-xs">Days Used</div>
                                                        <div className="font-bold text-gray-900">{preview.daysUsed}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-gray-500 text-xs">Expected</div>
                                                        <div className="font-bold text-blue-600">{preview.expectedPills}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-gray-500 text-xs">Pills Used</div>
                                                        <div className="font-bold text-orange-600">{preview.pillsUsed}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-gray-500 text-xs">Compliance</div>
                                                        <div className={`font-bold ${preview.overComplianceError ? 'text-red-600' :
                                                            preview.overComplianceWarning ? 'text-orange-600' :
                                                                preview.compliance >= 80 ? 'text-green-600' :
                                                                    preview.compliance >= 50 ? 'text-yellow-600' :
                                                                        'text-red-600'
                                                            }`}>
                                                            {preview.compliance}%
                                                            {preview.compliance > 100 && ' (Over)'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500 text-center">
                                                    Formula: (Pills Used / Expected Pills) × 100 = ({preview.pillsUsed} / {preview.expectedPills}) × 100
                                                </div>
                                                {/* NEW: Over-compliance warnings */}
                                                {preview.overComplianceError && (
                                                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                                                        ⚠️ <strong>ERROR:</strong> Compliance &gt;200% - Please verify data entry is correct!
                                                    </div>
                                                )}
                                                {preview.overComplianceWarning && (
                                                    <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-orange-700 text-sm">
                                                        ⚠️ <strong>WARNING:</strong> Over-compliance detected. Patient may be taking too many pills. Verify with patient.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-300 text-center text-sm text-gray-500">
                                            Enter first/last dose dates to calculate compliance
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Return Status */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Return Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={returnStatus}
                                    onChange={(e) => setReturnStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="RETURNED">Returned - Bottle returned with remaining pills</option>
                                    <option value="NOT_RETURNED">Not Returned - Patient did not bring bottle</option>
                                    <option value="WASTED">Wasted - Damaged/Expired/Contaminated</option>
                                    <option value="LOST">Lost - Patient lost the medication</option>
                                    <option value="DESTROYED">Destroyed - Destroyed at site</option>
                                </select>
                            </div>

                            {/* Comments */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comments
                                </label>
                                <textarea
                                    value={returnComments}
                                    onChange={(e) => setReturnComments(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional comments..."
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsReturnModalOpen(false);
                                    setSelectedRecord(null);
                                    setDateOfFirstDose('');
                                    setDateOfLastDose('');
                                    setPillsPerDay(1);
                                    setReturnStatus('RETURNED');
                                    setValidationWarnings([]);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReturn}
                                disabled={returnMutation.isPending || !returnDate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {returnMutation.isPending ? 'Recording...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Record Modal (for fixing missing dates) */}
            {isEditModalOpen && editRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Record - Fix Missing Data</h3>
                        </div>

                        <div className="px-6 py-4">
                            {/* Record Info */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Drug Unit:</span>
                                        <span className="ml-2 font-medium">{editRecord.drug_unit?.drug_unit_id || editRecord.drug_unit_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Dispensed:</span>
                                        <span className="ml-2 font-medium">{editRecord.qty_dispensed}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Returned:</span>
                                        <span className="ml-2 font-medium">{editRecord.qty_returned}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Pills Used:</span>
                                        <span className="ml-2 font-medium text-orange-600">
                                            {editRecord.qty_dispensed - editRecord.qty_returned}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning for missing data */}
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ This record is missing date information required for compliance calculation.
                                    Please provide the missing dates below.
                                </p>
                            </div>

                            {/* Date of First Dose */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of First Dose {!editRecord.date_of_first_dose && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="date"
                                    value={editFirstDose}
                                    onChange={(e) => setEditFirstDose(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editFirstDose && !editRecord.date_of_first_dose
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Date of Last Dose */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Last Dose {!editRecord.date_of_last_dose && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="date"
                                    value={editLastDose}
                                    onChange={(e) => setEditLastDose(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editLastDose && !editRecord.date_of_last_dose
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Pills Per Day */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pills Per Day
                                </label>
                                <input
                                    type="number"
                                    value={editPillsPerDay}
                                    onChange={(e) => setEditPillsPerDay(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={10}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Compliance Preview */}
                            {editFirstDose && editLastDose && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-800">
                                        <strong>Compliance Preview:</strong>
                                        {(() => {
                                            const firstDose = new Date(editFirstDose);
                                            const lastDose = new Date(editLastDose);
                                            const daysUsed = Math.floor((lastDose.getTime() - firstDose.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            const expectedPills = daysUsed * editPillsPerDay;
                                            const pillsUsed = editRecord.qty_dispensed - editRecord.qty_returned;
                                            const compliance = expectedPills > 0 ? Math.round((pillsUsed / expectedPills) * 10000) / 100 : 0;
                                            return ` ${compliance}% (${pillsUsed} used / ${expectedPills} expected over ${daysUsed} days)`;
                                        })()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditRecord(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={editRecordMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {editRecordMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectAccountabilityPage;
