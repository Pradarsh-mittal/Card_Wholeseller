import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/StatusBadge';
import axios from 'axios';
import { ShoppingCart, Eye, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MyOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  return (
    <Layout title="My Orders" subtitle="Track and manage your orders">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="design_sent">Design Sent</SelectItem>
              <SelectItem value="revision_requested">Revision Requested</SelectItem>
              <SelectItem value="design_approved">Design Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No orders found</p>
              <Link to="/catalog" className="text-brand-blue hover:underline text-sm">
                Browse catalog to place an order
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <Link
                key={order.order_id}
                to={`/orders/${order.order_id}`}
                className="block animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`order-item-${order.order_id}`}
              >
                <Card className="card-hover">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Card Image */}
                      <div className="w-20 h-28 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={order.card_image_url || 'https://images.unsplash.com/photo-1577086664341-033ee09074ec?w=200&h=300&fit=crop'}
                          alt={order.design_number}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="font-mono text-lg font-semibold text-brand-blue">
                            {order.design_number}
                          </h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-slate-500">Quantity:</span>
                            <span className="ml-1 font-medium">{order.quantity}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Date:</span>
                            <span className="ml-1 font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 truncate">
                          {order.message}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex-shrink-0">
                        <Eye className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
