import React from 'react';

const ChangesPage: React.FC = () => {
    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Change Log</h1>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Audit Trail & Changes</h2>
                    <p className="text-gray-500">
                        View complete audit trail of all changes made to study data, subjects, and drug records.
                    </p>
                    <p className="text-sm text-gray-400 mt-4">Coming Soon</p>
                </div>
            </div>
        </div>
    );
};

export default ChangesPage;

