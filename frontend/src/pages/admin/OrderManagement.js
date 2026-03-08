import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { StatusBadge } from '../../components/StatusBadge';
import axios from 'axios';
import { Search, Eye, Loader2, ShoppingCart } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrderManagement() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/admin/orders`, {
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
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = 
      order.design_number.toLowerCase().includes(search.toLowerCase()) ||
      order.retailer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.retailer_shop?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Layout title="Order Management" subtitle="Manage all orders">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by design number or retailer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
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

        {/* Orders Count */}
        <p className="text-sm text-slate-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link
                key={order.order_id}
                to={`/admin/orders/${order.order_id}`}
                data-testid={`order-item-${order.order_id}`}
              >
                <Card className="card-hover">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Card Image */}
                      <div className="w-16 h-22 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={order.card_image_url || 'https://images.unsplash.com/photo-1577086664341-033ee09074ec?w=200&h=300&fit=crop'}
                          alt={order.design_number}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div>
                            <span className="font-mono text-lg font-semibold text-brand-blue">
                              {order.design_number}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-slate-500">Retailer:</span>
                            <span className="ml-1 font-medium">{order.retailer_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Shop:</span>
                            <span className="ml-1 font-medium">{order.retailer_shop || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Qty:</span>
                            <span className="ml-1 font-medium">{order.quantity}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Date:</span>
                            <span className="ml-1 font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
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
