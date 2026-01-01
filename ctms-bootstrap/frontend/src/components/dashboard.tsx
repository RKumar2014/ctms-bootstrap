// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // FIXED: Use api service instead of hardcoded localhost
      const response = await api.get('/user/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Don't logout on error - the api interceptor handles 401 already
      // Just show empty state instead
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Studies</h1>
      </div>

      {/* Study Cards */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Active Studies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="text-lg font-bold text-teal-600">CTMS-001</div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sites:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subjects:</span>
                <span className="font-medium">6</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
