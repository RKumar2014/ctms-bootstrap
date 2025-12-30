import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { subjectsApi } from '../lib/api';
import { Subject } from '../types';
import { useAuth } from '../context/AuthContext';

const columnHelper = createColumnHelper<Subject>();

const SubjectListPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'active' | 'all'>('active');

    const { data: allSubjects = [], isLoading, error } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const response = await subjectsApi.list();
            return response.data;
        },
    });

    // Filter subjects based on active tab
    const subjects = React.useMemo(() => {
        if (activeTab === 'active') {
            return allSubjects.filter((s: Subject) => s.status === 'Active');
        }
        return allSubjects;
    }, [allSubjects, activeTab]);

    const columns = [
        columnHelper.display({
            id: 'select',
            header: '',
            cell: (info) => (
                <button
                    onClick={() => navigate(`/subjects/${info.row.original.subject_id}`)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                    Select
                </button>
            ),
        }),
        columnHelper.accessor('subject_number', {
            header: 'Subject Number',
            cell: (info) => (
                <span className="font-medium text-blue-600">{info.getValue()}</span>
            ),
        }),
        columnHelper.accessor('dob', {
            header: 'Date Of Birth',
            cell: (info) => {
                const date = new Date(info.getValue());
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            },
        }),
        columnHelper.accessor('sex', {
            header: 'Sex',
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: (info) => {
                const status = info.getValue();
                const colors = {
                    Active: 'bg-green-100 text-green-800',
                    Completed: 'bg-blue-100 text-blue-800',
                    Terminated: 'bg-red-100 text-red-800',
                };
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
                        {status}
                    </span>
                );
            },
        }),
        columnHelper.accessor('next_visit_name', {
            header: 'Next Visit Name',
            cell: (info) => info.getValue() || <span className="text-gray-400">-</span>,
        }),
        columnHelper.accessor('next_visit_date', {
            header: 'Next Visit Date',
            cell: (info) => {
                const date = info.getValue();
                return date ? new Date(date).toLocaleDateString() : <span className="text-gray-400">-</span>;
            },
        }),
    ];

    const table = useReactTable({
        data: subjects,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading subjects...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-600">Error loading subjects</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">CTMS - Subjects</h1>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Active/All Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'active'
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                All
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="mb-4 flex justify-end items-center">
                    <button
                        onClick={() => navigate('/subjects/new')}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
                    >
                        Rollover
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {header.column.getIsSorted() && (
                                                <span className="ml-2">
                                                    {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/subjects/${row.original.subject_id}`)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                                    <span className="font-medium">{table.getPageCount()}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {'<<'}
                                </button>
                                <button
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {'<'}
                                </button>
                                <button
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {'>'}
                                </button>
                                <button
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {'>>'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectListPage;
