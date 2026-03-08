import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Grid3X3,
  ShoppingCart,
  User,
  Users,
  CreditCard,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Package
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const retailerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/catalog', icon: Grid3X3, label: 'Card Catalog' },
    { to: '/orders', icon: ShoppingCart, label: 'My Orders' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'User Approval' },
    { to: '/admin/cards', icon: CreditCard, label: 'Card Management' },
    { to: '/admin/orders', icon: ClipboardList, label: 'Order Management' },
  ];

  const links = isAdmin ? adminLinks : retailerLinks;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-6 border-b border-brand-blue-800">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-brand-orange" />
          <div>
            <h1 className="text-lg font-bold text-white font-heading">Card Wholesale</h1>
            <p className="text-xs text-slate-400">{isAdmin ? 'Admin Panel' : 'Retailer Portal'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-brand-blue-800">
        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">{user?.name || user?.owner_name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-brand-blue-800 hover:text-white rounded-lg transition-colors"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        data-testid="mobile-menu-toggle"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="sidebar hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`sidebar flex flex-col md:hidden transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
