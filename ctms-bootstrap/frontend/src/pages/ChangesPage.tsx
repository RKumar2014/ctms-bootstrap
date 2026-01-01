import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../lib/api';

interface AuditLog {
    audit_id: number;
    user_id: string;
    action: string;
    table_name: string;
    record_id: string;
    changes_json: {
        old_values?: Record<string, any>;
        new_values?: Record<string, any>;
        reason_for_change?: string;
        username?: string;
    };
    ip_address?: string;
    timestamp: string;
    user?: {
        username: string;
        email: string;
    };
}

const ChangesPage: React.FC = () => {
    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [tableFilter, setTableFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(0);
    const limit = 20;

    // Expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Fetch audit logs
    const { data: auditResponse, isLoading, error, refetch } = useQuery({
        queryKey: ['audit-logs', actionFilter, tableFilter, startDate, endDate, page],
        queryFn: async () => {
            // Convert dates to ISO timestamps for proper filtering
            const startDateTime = startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined;
            const endDateTime = endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined;

            const response = await auditApi.list({
                action: actionFilter || undefined,
                table_name: tableFilter || undefined,
                start_date: startDateTime,
                end_date: endDateTime,
                limit,
                offset: page * limit
            });
            return response.data;
        }
    });

    const logs: AuditLog[] = auditResponse?.data || [];
    const pagination = auditResponse?.pagination || { total: 0, hasMore: false };

    // Action type colors
    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE':
            case 'DISPENSE':
                return 'bg-green-100 text-green-800';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800';
            case 'RETURN':
                return 'bg-purple-100 text-purple-800';
            case 'DELETE':
            case 'DESTROY':
                return 'bg-red-100 text-red-800';
            case 'LOGIN':
            case 'LOGOUT':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Toggle row expansion
    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Format timestamp with timezone (21 CFR Part 11 requirement)
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
            hour12: true
        };
        return date.toLocaleString('en-US', options);
    };

    // Format action with descriptive label (Priority 3: Action Type Clarity)
    const formatActionLabel = (action: string, tableName: string) => {
        const labels: Record<string, string> = {
            'CREATE': 'Created',
            'UPDATE': 'Updated',
            'DELETE': 'Deleted',
            'DISPENSE': 'Dispensed',
            'RETURN': 'Returned',
            'LOGIN': 'Logged In',
            'LOGOUT': 'Logged Out',
            'DESTROY': 'Destroyed',
            'VIEW': 'Viewed'
        };

        const label = labels[action] || action;

        // Add context based on table
        if (action === 'DISPENSE' && tableName === 'accountability') {
            return `${label} Medication`;
        } else if (action === 'RETURN' && tableName === 'accountability') {
            return `${label} Medication`;
        } else if (action === 'UPDATE' && tableName === 'accountability') {
            return `${label} Record`;
        }

        return label;
    };

    // Format values for display (convert ISO dates to mm/dd/yyyy)
    const formatValue = (key: string, value: any): string => {
        if (value === null || value === undefined) {
            return 'null';
        }

        // Check if the key suggests it's a date field
        const dateKeys = ['date', 'timestamp', 'created_at', 'updated_at'];
        const isDateKey = dateKeys.some(dk => key.toLowerCase().includes(dk));

        // Try to parse as date if it's a date key or looks like ISO format
        if (isDateKey || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    // Format as mm/dd/yyyy if it's just a date (no time)
                    if (typeof value === 'string' && value.length === 10) {
                        const [year, month, day] = value.split('-');
                        return `${month}/${day}/${year}`;
                    }
                    // Format as mm/dd/yyyy hh:mm:ss if it has time
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
                }
            } catch (e) {
                // Not a valid date, fall through to return as string
            }
        }

        return String(value);
    };


    // Handle CSV export
    const handleExport = async () => {
        try {
            // Convert dates to ISO timestamps for proper filtering
            const startDateTime = startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined;
            const endDateTime = endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined;

            const response = await auditApi.exportCsv({
                action: actionFilter || undefined,
                table_name: tableFilter || undefined,
                start_date: startDateTime,
                end_date: endDateTime
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    // Clear filters
    const clearFilters = () => {
        setActionFilter('');
        setTableFilter('');
        setStartDate('');
        setEndDate('');
        setPage(0);
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
                    <p className="text-sm text-gray-500 mt-1">21 CFR Part 11 Compliant Change Log</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                    📥 Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="DISPENSE">Dispense</option>
                            <option value="UPDATE">Update</option>
                            <option value="RETURN">Return</option>
                            <option value="DELETE">Delete</option>
                            <option value="DESTROY">Destroy</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                        <select
                            value={tableFilter}
                            onChange={(e) => { setTableFilter(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Tables</option>
                            <option value="accountability">Accountability</option>
                            <option value="subjects">Subjects</option>
                            <option value="drug_units">Drug Units</option>
                            <option value="sites">Sites</option>
                            <option value="users">Users</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">Error loading audit logs</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No audit logs found</div>
                ) : (
                    <>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <React.Fragment key={log.audit_id}>
                                        <tr
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => toggleRow(log.audit_id)}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {formatTimestamp(log.timestamp)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {log.user?.username || log.changes_json?.username || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                                                    {formatActionLabel(log.action, log.table_name)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {log.table_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                                {log.record_id}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-blue-600">
                                                {expandedRows.has(log.audit_id) ? '▼ Hide' : '▶ View'}
                                            </td>
                                        </tr>
                                        {expandedRows.has(log.audit_id) && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-4 bg-gray-50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Old Values */}
                                                        {log.changes_json?.old_values && Object.keys(log.changes_json.old_values).length > 0 && (
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-2">Old Values</h4>
                                                                <div className="bg-red-50 p-3 rounded text-sm">
                                                                    {Object.entries(log.changes_json.old_values).map(([key, value]) => (
                                                                        <div key={key} className="flex gap-2">
                                                                            <span className="font-medium text-gray-600">{key}:</span>
                                                                            <span className="text-red-700">{formatValue(key, value)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* New Values */}
                                                        {log.changes_json?.new_values && Object.keys(log.changes_json.new_values).length > 0 && (
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-2">New Values</h4>
                                                                <div className="bg-green-50 p-3 rounded text-sm">
                                                                    {Object.entries(log.changes_json.new_values).map(([key, value]) => (
                                                                        <div key={key} className="flex gap-2">
                                                                            <span className="font-medium text-gray-600">{key}:</span>
                                                                            <span className="text-green-700">{formatValue(key, value)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Reason for Change */}
                                                    {log.changes_json?.reason_for_change && (
                                                        <div className="mt-3 p-3 bg-yellow-50 rounded">
                                                            <span className="font-medium text-gray-700">Reason for Change: </span>
                                                            <span className="text-yellow-800">{log.changes_json.reason_for_change}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Showing {page * limit + 1} to {Math.min((page + 1) * limit, pagination.total)} of {pagination.total} entries
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!pagination.hasMore}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChangesPage;
