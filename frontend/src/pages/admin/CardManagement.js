import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FileUpload } from '../../components/FileUpload';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Pencil, Trash2, Loader2, Image, Search } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = ['Wedding', 'Birthday', 'Visiting', 'Anniversary', 'Festival', 'Invitation', 'Thank You', 'General'];

export default function CardManagement() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    design_number: '',
    image_url: '',
    category: 'General'
  });

  useEffect(() => {
    fetchCards();
  }, [token]);

  const fetchCards = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/cards`, {
        headers,
        withCredentials: true
      });
      setCards(response.data);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        design_number: card.design_number,
        image_url: card.image_url,
        category: card.category
      });
    } else {
      setEditingCard(null);
      setFormData({ design_number: '', image_url: '', category: 'General' });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.design_number || !formData.image_url) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (editingCard) {
        await axios.put(
          `${API_URL}/api/admin/cards/${editingCard.card_id}`,
          formData,
          { headers, withCredentials: true }
        );
        toast.success('Card updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/admin/cards`,
          formData,
          { headers, withCredentials: true }
        );
        toast.success('Card created successfully');
      }
      
      setShowDialog(false);
      fetchCards();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_URL}/api/admin/cards/${cardId}`, {
        headers,
        withCredentials: true
      });
      toast.success('Card deleted successfully');
      fetchCards();
    } catch (error) {
      toast.error('Failed to delete card');
    }
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.design_number.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || card.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout title="Card Management" subtitle="Manage your card catalog">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by design number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-brand-blue hover:bg-brand-blue-950"
            data-testid="add-card-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </div>

        {/* Cards Count */}
        <p className="text-sm text-slate-500">
          Showing {filteredCards.length} of {cards.length} cards
        </p>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : filteredCards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Image className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No cards found</p>
              <Button
                variant="link"
                onClick={() => handleOpenDialog()}
                className="mt-2"
              >
                Add your first card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCards.map((card) => (
              <Card
                key={card.card_id}
                className="overflow-hidden group"
                data-testid={`card-${card.card_id}`}
              >
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                  <img
                    src={card.image_url}
                    alt={card.design_number}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1577086664341-033ee09074ec?w=400&h=600&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenDialog(card)}
                      data-testid={`edit-card-${card.card_id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(card.card_id)}
                      data-testid={`delete-card-${card.card_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-mono font-semibold text-brand-blue text-sm">
                    {card.design_number}
                  </p>
                  <p className="text-xs text-slate-500">{card.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Edit Card' : 'Add New Card'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="design_number">Design Number *</Label>
              <Input
                id="design_number"
                placeholder="e.g., AB-123"
                value={formData.design_number}
                onChange={(e) => setFormData({ ...formData, design_number: e.target.value })}
                required
                data-testid="design-number-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Card Image *</Label>
              <FileUpload
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                folder="card_wholesale/cards"
                currentUrl={formData.image_url}
                label="Upload Card Image"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-950"
                disabled={submitting || !formData.design_number || !formData.image_url}
                data-testid="save-card-btn"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingCard ? (
                  'Update Card'
                ) : (
                  'Add Card'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
