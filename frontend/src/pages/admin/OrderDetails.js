import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { StatusBadge } from '../../components/StatusBadge';
import { FileUpload } from '../../components/FileUpload';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, Save, Loader2, User, Store, Phone, MapPin, FileText, Truck, Image } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'design_sent', label: 'Design Sent' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'design_approved', label: 'Design Approved' },
  { value: 'completed', label: 'Completed' }
];

export default function AdminOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    status: '',
    design_preview_url: '',
    invoice_url: '',
    transport_bill_url: '',
    admin_notes: ''
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
          headers,
          withCredentials: true
        });
        setOrder(response.data);
        setFormData({
          status: response.data.status,
          design_preview_url: response.data.design_preview_url || '',
          invoice_url: response.data.invoice_url || '',
          transport_bill_url: response.data.transport_bill_url || '',
          admin_notes: response.data.admin_notes || ''
        });
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Order not found');
        navigate('/admin/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, navigate]);

  const handleSave = async () => {
    // Validate: design_sent requires design_preview_url
    if (formData.status === 'design_sent' && !formData.design_preview_url) {
      toast.error('Please upload a design preview before setting status to "Design Sent"');
      return;
    }
    
    // Validate: completed requires invoice
    if (formData.status === 'completed' && !formData.invoice_url) {
      toast.error('Please upload an invoice before marking as completed');
      return;
    }

    setSaving(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        formData,
        { headers, withCredentials: true }
      );
      toast.success('Order updated successfully');
      
      // Refresh order
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers,
        withCredentials: true
      });
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Order Details">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-blue mb-6 transition-colors"
          data-testid="back-to-orders"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Order: {order?.design_number}
            </h1>
            <p className="text-slate-500 text-sm">
              Order ID: {orderId}
            </p>
          </div>
          <StatusBadge status={order?.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Retailer Info */}
            <Card data-testid="retailer-info-card">
              <CardHeader>
                <CardTitle>Retailer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Name:</span>
                  <span className="font-medium">{order?.retailer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Shop:</span>
                  <span className="font-medium">{order?.retailer_shop || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-500">Delivery:</span>
                  <span className="font-medium">{order?.delivery_address}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card data-testid="order-details-card">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Design Number</p>
                    <p className="font-mono font-semibold text-brand-blue">{order?.design_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Quantity</p>
                    <p className="font-semibold">{order?.quantity}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Message/Text for Printing</p>
                  <p className="mt-1 p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">{order?.message}</p>
                </div>
                {order?.special_instructions && (
                  <div>
                    <p className="text-sm text-slate-500">Special Instructions</p>
                    <p className="mt-1 p-3 bg-slate-50 rounded-lg">{order?.special_instructions}</p>
                  </div>
                )}
                {order?.revision_notes && (
                  <div>
                    <p className="text-sm text-slate-500">Revision Notes from Retailer</p>
                    <p className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      {order?.revision_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Update Order Status */}
            <Card data-testid="update-order-card">
              <CardHeader>
                <CardTitle>Update Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Design Preview Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Design Preview (JPG/PNG only)
                  </Label>
                  <FileUpload
                    onUpload={(url) => setFormData({ ...formData, design_preview_url: url })}
                    folder="card_wholesale/designs"
                    currentUrl={formData.design_preview_url}
                    label="Upload Design Preview"
                    accept="image/jpeg,image/png,image/jpg"
                  />
                </div>

                {/* Invoice Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Invoice Bill (Photo/PDF)
                  </Label>
                  <FileUpload
                    onUpload={(url) => setFormData({ ...formData, invoice_url: url })}
                    folder="card_wholesale/invoices"
                    accept="image/*,.pdf,application/pdf"
                    currentUrl={formData.invoice_url}
                    label="Upload Invoice (Photo/PDF)"
                  />
                  {formData.invoice_url && (
                    <a
                      href={formData.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brand-blue hover:underline mt-2"
                    >
                      <FileText className="w-4 h-4" />
                      View/Download Invoice
                    </a>
                  )}
                </div>

                {/* Transport Bill Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Transport / Shipping Bill (Photo/PDF)
                  </Label>
                  <FileUpload
                    onUpload={(url) => setFormData({ ...formData, transport_bill_url: url })}
                    folder="card_wholesale/transport"
                    accept="image/*,.pdf,application/pdf"
                    currentUrl={formData.transport_bill_url}
                    label="Upload Transport Bill (Photo/PDF)"
                  />
                  {formData.transport_bill_url && (
                    <a
                      href={formData.transport_bill_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brand-blue hover:underline mt-2"
                    >
                      <Truck className="w-4 h-4" />
                      View/Download Transport Bill
                    </a>
                  )}
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    placeholder="Add notes for this update..."
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                    data-testid="admin-notes-input"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full bg-brand-blue hover:bg-brand-blue-950"
                  disabled={saving}
                  data-testid="save-order-btn"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timeline */}
            <Card data-testid="timeline-card">
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="timeline">
                  {order?.timeline?.map((event, index) => (
                    <div key={index} className="timeline-item">
                      <div className={`timeline-dot ${
                        index === order.timeline.length - 1 ? 'current' : 'completed'
                      }`}></div>
                      <div className="ml-2">
                        <p className="text-sm font-medium text-slate-900">
                          {event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.note && (
                          <p className="text-xs text-slate-600 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Original Card */}
            <Card>
              <CardHeader>
                <CardTitle>Original Design</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={order?.card_image_url || 'https://images.unsplash.com/photo-1577086664341-033ee09074ec?w=400&h=600&fit=crop'}
                    alt={order?.design_number}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
