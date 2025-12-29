// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Users, FileText, Activity, TrendingUp, Settings, ClipboardList, LogOut, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('studies');
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

      const response = await fetch('http://localhost:3000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data: User = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const tabs: Tab[] = [
    { id: 'studies', label: 'My Studies', icon: Users },
    { id: 'subjects', label: 'Subjects', icon: FileText },
    { id: 'drug', label: 'Drug', icon: Activity },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'changes', label: 'Changes', icon: ClipboardList },
    { id: 'admin', label: 'Admin', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md">
        <div className="px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-3xl font-light tracking-widest" style={{fontFamily: 'Arial, sans-serif'}}>
                CTMS
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6">
              {/* Environment Badge */}
              <div className="bg-teal-800 bg-opacity-70 px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Production Environment
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-blue-200">{user?.email}</span>
                  </div>
                  <div className="text-xs text-teal-100 mt-0.5">
                    Site User
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="px-6">
          <div className="flex gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center px-8 py-4 transition-all relative min-w-[120px] ${
                    activeTab === tab.id
                      ? 'text-gray-700 bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    borderBottom: activeTab === tab.id ? '3px solid #0d9488' : '3px solid transparent'
                  }}
                >
                  <Icon className="w-8 h-8 mb-1" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Message */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 mb-6">
            <h1 className="text-xl text-gray-700 text-center">
              Welcome <span className="font-semibold">{user?.email}</span>, please navigate using the above tabs!
            </h1>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
            {activeTab === 'studies' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Studies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-lg font-bold text-teal-600">Study-001</div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sites:</span>
                        <span className="font-medium">5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subjects:</span>
                        <span className="font-medium">42</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Subject Management</h2>
                <div className="space-y-4">
                  <div className="flex gap-4 mb-6">
                    <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">
                      Add New Subject
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      Export List
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Visit</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">SUB-001</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                          </td>
                          <td className="px-4 py-3 text-sm">Visit 3</td>
                          <td className="px-4 py-3 text-sm">2024-01-15</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'drug' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Drug Inventory</h2>
                <p className="text-gray-600 mb-4">Track and manage investigational product inventory.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium">Available Units</div>
                    <div className="text-3xl font-bold text-blue-700 mt-2">1,247</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-yellow-600 font-medium">Dispensed</div>
                    <div className="text-3xl font-bold text-yellow-700 mt-2">856</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-600 font-medium">Low Stock</div>
                    <div className="text-3xl font-bold text-red-700 mt-2">3</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all text-left">
                    <div className="font-semibold text-gray-800 mb-1">Enrollment Report</div>
                    <div className="text-sm text-gray-500">Subject screening statistics</div>
                  </button>
                  <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all text-left">
                    <div className="font-semibold text-gray-800 mb-1">Drug Accountability</div>
                    <div className="text-sm text-gray-500">Dispensation log</div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'changes' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Change Log</h2>
                <div className="space-y-2">
                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800">Subject Updated</div>
                        <div className="text-sm text-gray-600 mt-1">Visit completed</div>
                      </div>
                      <div className="text-xs text-gray-500">2 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Administration</h2>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="font-medium text-gray-800">User Management</div>
                    <div className="text-sm text-gray-500 mt-1">Manage user accounts</div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="font-medium text-gray-800">Site Configuration</div>
                    <div className="text-sm text-gray-500 mt-1">Configure settings</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;