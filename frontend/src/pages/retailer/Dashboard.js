import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { StatusBadge } from '../../components/StatusBadge';
import axios from 'axios';
import { ShoppingCart, Grid3X3, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RetailerDashboard() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/orders`, {
          headers,
          withCredentials: true
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'design_sent' || o.status === 'revision_requested');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const needsAction = orders.filter(o => o.status === 'design_sent');

  return (
    <Layout title={`Welcome, ${user?.owner_name || user?.name}!`} subtitle={user?.shop_name}>
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="stat-card" data-testid="total-orders-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Orders</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{orders.length}</p>
                </div>
                <div className="w-12 h-12 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-brand-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="pending-orders-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">In Progress</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{pendingOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="completed-orders-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Completed</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{completedOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/catalog">
            <Card className="card-hover cursor-pointer h-full" data-testid="browse-catalog-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                    <Grid3X3 className="w-7 h-7 text-brand-orange" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Browse Catalog</h3>
                    <p className="text-sm text-slate-500">Explore our card designs and place orders</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/orders">
            <Card className="card-hover cursor-pointer h-full" data-testid="view-orders-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-brand-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">View Orders</h3>
                    <p className="text-sm text-slate-500">Track and manage your orders</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Orders Requiring Action */}
        {needsAction.length > 0 && (
          <Card data-testid="action-required-section">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {needsAction.map((order) => (
                  <Link
                    key={order.order_id}
                    to={`/orders/${order.order_id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">{order.design_number}</p>
                        <p className="text-sm text-slate-500">Design preview ready for review</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card data-testid="recent-orders-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link to="/orders" className="text-sm text-brand-blue hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No orders yet.</p>
                <Link to="/catalog" className="text-brand-blue hover:underline text-sm">
                  Browse catalog to place your first order
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Design</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.order_id}>
                        <td>
                          <Link
                            to={`/orders/${order.order_id}`}
                            className="text-brand-blue hover:underline font-medium"
                          >
                            {order.design_number}
                          </Link>
                        </td>
                        <td>{order.quantity}</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td className="text-slate-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
