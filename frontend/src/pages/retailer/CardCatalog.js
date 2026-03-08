import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import axios from 'axios';
import { Search, Grid3X3, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CardCatalog() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [cardsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/api/cards`, { headers, withCredentials: true }),
          axios.get(`${API_URL}/api/cards/categories/list`, { headers, withCredentials: true })
        ]);
        
        setCards(cardsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.design_number.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout title="Card Catalog" subtitle="Browse and order from our collection">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by design number (e.g., AB-123)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48" data-testid="category-select">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500">
          Showing {filteredCards.length} of {cards.length} designs
        </p>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No cards found matching your criteria</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredCards.map((card, index) => (
              <Link
                key={card.card_id}
                to={`/order/${card.card_id}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`card-item-${card.card_id}`}
              >
                <Card className="catalog-card group">
                  <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                    <img
                      src={card.image_url}
                      alt={`Card ${card.design_number}`}
                      className="w-full h-full object-cover img-zoom"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1577086664341-033ee09074ec?w=400&h=600&fit=crop';
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-semibold text-brand-blue">
                        {card.design_number}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {card.category}
                      </span>
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
