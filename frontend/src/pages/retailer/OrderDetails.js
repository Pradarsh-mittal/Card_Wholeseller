import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, CheckCircle, XCircle, FileText, Truck, Image, Loader2, Download } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
          headers,
          withCredentials: true
        });
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Order not found');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, navigate]);

  const handleApproveDesign = async () => {
    setSubmitting(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_URL}/api/orders/${orderId}/approve-design`,
        { approved: true },
        { headers, withCredentials: true }
      );
      toast.success('Design approved successfully!');
      // Refresh order
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers,
        withCredentials: true
      });
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to approve design');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please provide revision notes');
      return;
    }

    setSubmitting(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_URL}/api/orders/${orderId}/approve-design`,
        { approved: false, revision_notes: revisionNotes },
        { headers, withCredentials: true }
      );
      toast.success('Revision request sent!');
      setShowRejectDialog(false);
      setRevisionNotes('');
      // Refresh order
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers,
        withCredentials: true
      });
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to request revision');
    } finally {
      setSubmitting(false);
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/orders')}
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
              Placed on {new Date(order?.created_at).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={order?.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details Card */}
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
                  <p className="text-sm text-slate-500">Message/Text</p>
                  <p className="mt-1 p-3 bg-slate-50 rounded-lg">{order?.message}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Delivery Address</p>
                  <p className="mt-1 p-3 bg-slate-50 rounded-lg">{order?.delivery_address}</p>
                </div>
                {order?.special_instructions && (
                  <div>
                    <p className="text-sm text-slate-500">Special Instructions</p>
                    <p className="mt-1 p-3 bg-slate-50 rounded-lg">{order?.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Design Preview */}
            {(order?.design_preview_url || order?.status === 'design_sent') && (
              <Card data-testid="design-preview-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-brand-blue" />
                    Design Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order?.design_preview_url ? (
                    <>
                      <div className="bg-slate-100 rounded-lg overflow-hidden">
                        <img
                          src={order.design_preview_url}
                          alt="Design Preview"
                          className="w-full max-h-[500px] object-contain"
                        />
                      </div>
                      
                      {order.status === 'design_sent' && (
                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={handleApproveDesign}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={submitting}
                            data-testid="approve-design-btn"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Design
                          </Button>
                          <Button
                            onClick={() => setShowRejectDialog(true)}
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            disabled={submitting}
                            data-testid="request-revision-btn"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Request Changes
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg">
                      <Image className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Design Preview Pending</p>
                      <p className="text-sm text-slate-500 mt-1">
                        The admin is preparing your design preview. Please check back soon.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {(order?.invoice_url || order?.transport_bill_url) && (
              <Card data-testid="documents-card">
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.invoice_url && (
                    <a
                      href={order.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      data-testid="invoice-link"
                    >
                      <FileText className="w-5 h-5 text-brand-blue" />
                      <span className="flex-1">Invoice Bill</span>
                      <Download className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                  {order.transport_bill_url && (
                    <a
                      href={order.transport_bill_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      data-testid="transport-bill-link"
                    >
                      <Truck className="w-5 h-5 text-brand-blue" />
                      <span className="flex-1">Transport / Shipping Bill</span>
                      <Download className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Timeline */}
          <div className="lg:col-span-1">
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
            <Card className="mt-6">
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

      {/* Revision Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Design Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Please describe what changes you'd like to make to the design.
            </p>
            <Textarea
              placeholder="Describe the changes needed..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="min-h-[120px]"
              data-testid="revision-notes-input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={submitting || !revisionNotes.trim()}
              className="bg-brand-blue hover:bg-brand-blue-950"
              data-testid="submit-revision-btn"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
