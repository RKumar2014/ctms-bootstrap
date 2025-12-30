import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { sitesApi, inventoryApi } from '../../lib/api';

interface MasterLogRecord {
    drugUnitId: number;
    drugCode: string;
    lotNumber: string | null;
    expirationDate: string | null;
    quantityPerUnit: number;
    status: string;
    siteId: number;
    siteNumber: string;
    siteName: string;
    subjectId: number | null;
    subjectNumber: string | null;
    accountabilityId: number | null;
    qtyDispensed: number;
    qtyReturned: number;
    pillsUsed: number | null;
    compliance: number | null;
    returnDate: string | null;
    reconciliationDate: string | null;
    dispenseDate: string | null;
    visitName: string | null;
    comments: string | null;
    assignedDate: string | null;
    createdAt: string;
}

const MasterAccountabilityLogPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [selectedSite, setSelectedSite] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Fetch sites
    const { data: sitesResponse } = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const response = await sitesApi.list();
            return response.data;
        },
    });
    const sites = sitesResponse || [];

    // Fetch master log data
    const { data: masterLogData = [], isLoading } = useQuery({
        queryKey: ['master-log', selectedSite],
        queryFn: async () => {
            const response = await inventoryApi.getMasterLog(selectedSite || undefined);
            return response.data as MasterLogRecord[];
        },
    });

    // Group data by drug code
    const groupedData = useMemo(() => {
        const groups: Record<string, { drugCode: string; records: MasterLogRecord[] }> = {};
        
        masterLogData.forEach((record: MasterLogRecord) => {
            const key = record.drugCode || 'Unknown';
            if (!groups[key]) {
                groups[key] = {
                    drugCode: key,
                    records: []
                };
            }
            groups[key].records.push(record);
        });

        // Sort groups by drug code
        return Object.values(groups).sort((a, b) => a.drugCode.localeCompare(b.drugCode));
    }, [masterLogData]);

    // Toggle group expansion
    const toggleGroup = (drugCode: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(drugCode)) {
            newExpanded.delete(drugCode);
        } else {
            newExpanded.add(drugCode);
        }
        setExpandedGroups(newExpanded);
    };

    // Expand all groups
    const expandAll = () => {
        setExpandedGroups(new Set(groupedData.map(g => g.drugCode)));
    };

    // Collapse all groups
    const collapseAll = () => {
        setExpandedGroups(new Set());
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = [
            'Drug Unit ID', 'Drug Code', 'Lot Number', 'Expiry Date', 'Status',
            'Subject Number', 'Visit', 'Qty Dispensed', 'Qty Returned', 'Pills Used',
            'Compliance %', 'Dispense Date', 'Return Date', 'Comments'
        ];

        const rows = masterLogData.map((record: MasterLogRecord) => [
            record.drugUnitId,
            record.drugCode,
            record.lotNumber || '',
            record.expirationDate || '',
            record.status,
            record.subjectNumber || '',
            record.visitName || '',
            record.qtyDispensed,
            record.qtyReturned,
            record.pillsUsed ?? '',
            record.compliance !== null ? `${record.compliance}%` : '',
            record.dispenseDate ? new Date(record.dispenseDate).toLocaleDateString() : '',
            record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '',
            record.comments || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Master_Accountability_Log_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available':
                return 'bg-green-100 text-green-800';
            case 'Dispensed':
                return 'bg-blue-100 text-blue-800';
            case 'Returned':
                return 'bg-purple-100 text-purple-800';
            case 'Destroyed':
                return 'bg-red-100 text-red-800';
            case 'Missing':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate summary stats
    const summary = useMemo(() => {
        return {
            total: masterLogData.length,
            available: masterLogData.filter((r: MasterLogRecord) => r.status === 'Available').length,
            dispensed: masterLogData.filter((r: MasterLogRecord) => r.status === 'Dispensed').length,
            returned: masterLogData.filter((r: MasterLogRecord) => r.status === 'Returned').length,
            destroyed: masterLogData.filter((r: MasterLogRecord) => r.status === 'Destroyed').length,
        };
    }, [masterLogData]);

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Master Accountability Log</h1>
                <p className="text-sm text-gray-500 mt-1">Complete lifecycle tracking for all inventory</p>
            </div>

            {/* Content */}
            <div>
                <div className="bg-white shadow rounded-lg p-6">
                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        {/* Site Filter */}
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Site:
                                </label>
                                <select
                                    value={selectedSite}
                                    onChange={(e) => setSelectedSite(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md min-w-[200px]"
                                >
                                    <option value="">All Sites</option>
                                    {sites.map((site: any) => (
                                        <option key={site.site_id} value={site.site_id}>
                                            {site.site_number} - {site.site_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={expandAll}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Expand All
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Collapse All
                                </button>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                            <div className="text-sm text-gray-500">Total Units</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{summary.available}</div>
                            <div className="text-sm text-gray-500">Available</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{summary.dispensed}</div>
                            <div className="text-sm text-gray-500">Dispensed</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{summary.returned}</div>
                            <div className="text-sm text-gray-500">Returned</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{summary.destroyed}</div>
                            <div className="text-sm text-gray-500">Destroyed</div>
                        </div>
                    </div>

                    {/* Data Table */}
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">Loading...</div>
                    ) : groupedData.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No drug units found. Select a site or check your inventory.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedData.map((group) => (
                                <div key={group.drugCode} className="border rounded-lg overflow-hidden">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(group.drugCode)}
                                        className="w-full px-4 py-3 bg-gray-100 flex items-center justify-between hover:bg-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg
                                                className={`w-5 h-5 transform transition-transform ${expandedGroups.has(group.drugCode) ? 'rotate-90' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className="font-semibold text-gray-900">{group.drugCode}</span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                {group.records.length} units
                                            </span>
                                        </div>
                                    </button>

                                    {/* Group Content */}
                                    {expandedGroups.has(group.drugCode) && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit ID</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispensed</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returned</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pills Used</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {group.records.map((record) => (
                                                        <tr key={record.drugUnitId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {record.drugUnitId}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {record.lotNumber || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {record.expirationDate ? new Date(record.expirationDate).toLocaleDateString() : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                                                                    {record.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {record.subjectNumber || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {record.visitName || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                                {record.qtyDispensed > 0 ? record.qtyDispensed : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {record.qtyReturned > 0 ? (
                                                                    <span className="text-green-600 font-medium">{record.qtyReturned}</span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {record.pillsUsed !== null ? (
                                                                    <span className="text-orange-600 font-medium">{record.pillsUsed}</span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {record.compliance !== null ? (
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                        record.compliance >= 80 ? 'bg-green-100 text-green-800' :
                                                                        record.compliance >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {record.compliance}%
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={record.comments || ''}>
                                                                {record.comments || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterAccountabilityLogPage;

