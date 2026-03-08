import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrderForm() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    quantity: 100,
    message: '',
    delivery_address: user?.address || '',
    special_instructions: ''
  });

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/cards/${cardId}`, {
          headers,
          withCredentials: true
        });
        setCard(response.data);
        setFormData(prev => ({
          ...prev,
          delivery_address: user?.address || ''
        }));
      } catch (error) {
        console.error('Failed to fetch card:', error);
        toast.error('Card not found');
        navigate('/catalog');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId, token, navigate, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setSubmitting(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_URL}/api/orders`,
        {
          card_id: cardId,
          design_number: card.design_number,
          quantity: parseInt(formData.quantity),
          message: formData.message,
          delivery_address: formData.delivery_address,
          special_instructions: formData.special_instructions
        },
        { headers, withCredentials: true }
      );

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to place order';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Place Order">
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
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-blue mb-6 transition-colors"
          data-testid="back-to-catalog"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Preview */}
          <Card className="overflow-hidden">
            <div className="aspect-[3/4] bg-slate-100">
              <img
                src={card?.image_url}
                alt={`Card ${card?.design_number}`}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-brand-blue">
                  {card?.design_number}
                </span>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded">
                  {card?.category}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-blue" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="design_number">Design Number</Label>
                  <Input
                    id="design_number"
                    value={card?.design_number || ''}
                    disabled
                    className="bg-slate-50 font-mono"
                    data-testid="design-number-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    data-testid="quantity-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message/Text for Printing</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Enter the text you want printed on the cards"
                    value={formData.message}
                    onChange={handleChange}
                    className="min-h-[100px]"
                    required
                    data-testid="message-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Delivery Address</Label>
                  <Textarea
                    id="delivery_address"
                    name="delivery_address"
                    placeholder="Enter delivery address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    className="min-h-[80px]"
                    required
                    data-testid="address-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_instructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="special_instructions"
                    name="special_instructions"
                    placeholder="Any special requirements or notes"
                    value={formData.special_instructions}
                    onChange={handleChange}
                    data-testid="instructions-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue-950"
                  disabled={submitting}
                  data-testid="submit-order-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
