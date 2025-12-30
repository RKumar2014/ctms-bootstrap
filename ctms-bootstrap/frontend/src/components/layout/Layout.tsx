import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const navigation = [
        { name: 'Dashboard', path: '/overview', icon: '🏠' },
        { name: 'My Studies', path: '/dashboard', icon: '📊' },
        { name: 'Subjects', path: '/subjects', icon: '👥' },
        { name: 'Drug', path: '/drug', icon: '💊' },
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
        <div className="min-h-screen flex bg-gray-50">
            {/* Left Sidebar */}
            <aside
                className={`${collapsed ? 'w-20' : 'w-56'} bg-slate-800 text-white flex flex-col transition-all duration-300 fixed h-full z-10`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-slate-700 px-2">
                    <h1 className={`font-bold text-white tracking-wider text-center ${collapsed ? 'text-sm' : 'text-base'}`}>
                        {collapsed ? 'CTS' : 'Clinical-TrialSite-CTMS'}
                    </h1>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-4">
                    {navigation.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <span className="text-xl flex-shrink-0">{item.icon}</span>
                            {!collapsed && (
                                <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-4 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    {collapsed ? '→' : '← Collapse'}
                </button>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col ${collapsed ? 'ml-20' : 'ml-56'} transition-all duration-300`}>
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            Study: <span className="text-teal-600">CTMS-001</span>
                        </h2>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                            <div className="text-xs text-gray-500">Site User</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 bg-gray-50 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
