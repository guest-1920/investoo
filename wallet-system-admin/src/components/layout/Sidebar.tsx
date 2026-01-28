import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UsersIcon, PlansIcon, RechargeIcon, WithdrawalIcon, LogoutIcon, ChevronIcon, DashboardIcon, SettingsIcon, SupportIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';
import './Sidebar.css';

const navItems = [
    {
        path: '/overview',
        label: 'Overview',
        icon: DashboardIcon,
    },
    {
        path: '/users',
        label: 'User Dashboard',
        icon: UsersIcon,
    },
    {
        path: '/plans',
        label: 'Plan Dashboard',
        icon: PlansIcon,
    },
    {
        path: '/recharges',
        label: 'Recharge Requests',
        icon: RechargeIcon,
    },
    {
        path: '/withdrawals',
        label: 'Withdrawal Requests',
        icon: WithdrawalIcon,
    },
    {
        path: '/tickets',
        label: 'Support Tickets',
        icon: SupportIcon,
    },
    // Referral Section
    {
        path: '/referrals/windows',
        label: 'Referral Windows',
        icon: PlansIcon, // Reusing icon
    },
    {
        path: '/referrals/rewards',
        label: 'Rewards Catalog',
        icon: PlansIcon,
    },
    {
        path: '/referrals/fulfillments',
        label: 'Fulfillments Queue',
        icon: WithdrawalIcon,
    },
    {
        path: '/settings',
        label: 'Settings',
        icon: SettingsIcon,
    },
];

export function Sidebar() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Logo size="md" variant="primary" />
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="sidebar-nav-icon">
                            <item.icon />
                        </span>
                        <span className="sidebar-nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Admin Profile Footer */}
            <div className="sidebar-footer">
                <div
                    className="sidebar-profile"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <div className="sidebar-profile-avatar">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="sidebar-profile-info">
                        <span className="sidebar-profile-name">{user?.name || 'Admin'}</span>
                        <span className="sidebar-profile-role">{user?.role}</span>
                    </div>
                    <span className={`sidebar-profile-chevron ${showDropdown ? 'open' : ''}`}>
                        <ChevronIcon />
                    </span>
                </div>

                {showDropdown && (
                    <div className="sidebar-dropdown">
                        <button className="sidebar-dropdown-item" onClick={handleLogout}>
                            <LogoutIcon />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
