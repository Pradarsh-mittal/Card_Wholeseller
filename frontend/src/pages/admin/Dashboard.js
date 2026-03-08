import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import axios from 'axios';
import { ShoppingCart, Users, CreditCard, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/admin/stats`, {
          headers,
          withCredentials: true
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard" subtitle={`Welcome back, ${user?.name || 'Admin'}`}>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="stat-card" data-testid="total-orders-stat">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Orders</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_orders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-brand-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="pending-orders-stat">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Orders</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pending_orders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="completed-orders-stat">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Completed Orders</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.completed_orders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="total-retailers-stat">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Retailers</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_retailers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="pending-retailers-stat">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pending_retailers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="total-cards-stat">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Card Designs</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_cards || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/users">
            <Card className="card-hover cursor-pointer h-full" data-testid="manage-users-card">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">User Approval</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {stats?.pending_retailers || 0} pending
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/cards">
            <Card className="card-hover cursor-pointer h-full" data-testid="manage-cards-card">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-brand-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-7 h-7 text-brand-blue" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Card Management</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {stats?.total_cards || 0} designs
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="card-hover cursor-pointer h-full" data-testid="manage-orders-card">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Order Management</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {stats?.pending_orders || 0} pending
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
