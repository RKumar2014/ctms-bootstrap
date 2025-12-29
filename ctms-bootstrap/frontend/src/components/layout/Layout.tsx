import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'My Studies', path: '/dashboard', icon: '📊' },
        { name: 'Subjects', path: '/subjects', icon: '👥' },
        { name: 'Drug', path: '/drugs', icon: '💊' },
        { name: 'Reports', path: '/reports', icon: '📈' },
        { name: 'Changes', path: '/changes', icon: '📝' },
        { name: 'Admin', path: '/admin', icon: '⚙️' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Environment Bar */}
            <div className="bg-teal-700 text-white text-center py-2 text-sm">
                You are in the Production Environment
            </div>

            {/* Main Header */}
            <div className="bg-white border-b-2 border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-800 tracking-wider">CTMS</h1>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                                <div className="text-blue-600 font-medium">{user?.username}</div>
                                <div className="text-gray-600">Site User</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-gray-100 border-b border-gray-300">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center px-6 py-3 border-b-4 transition-colors ${isActive(item.path)
                                        ? 'bg-white border-blue-600 text-gray-900'
                                        : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span className="text-2xl mb-1">{item.icon}</span>
                                <span className="text-xs font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <p className="text-sm text-gray-600">
                        Welcome to Study <span className="font-semibold">CTMS-001</span>, please navigate using the above tabs!
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="bg-gray-50">{children}</main>
        </div>
    );
};

export default Layout;
