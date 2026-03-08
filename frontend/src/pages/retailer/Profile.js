import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { User, Store, Phone, Mail, MapPin, Loader2, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: user?.shop_name || '',
    owner_name: user?.owner_name || user?.name || '',
    mobile: user?.mobile || '',
    address: user?.address || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Profile" subtitle="Manage your account settings">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-brand-blue" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-slate-50"
                    data-testid="email-input"
                  />
                </div>
                <p className="text-xs text-slate-500">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_name">Shop Name</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="shop_name"
                      name="shop_name"
                      placeholder="Your Shop Name"
                      value={formData.shop_name}
                      onChange={handleChange}
                      className="pl-10"
                      data-testid="shop-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="owner_name"
                      name="owner_name"
                      placeholder="Your Name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      className="pl-10"
                      data-testid="owner-name-input"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="mobile-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Your shop address"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 min-h-[100px]"
                    data-testid="address-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-950"
                disabled={loading}
                data-testid="save-profile-btn"
              >
                {loading ? (
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
            </form>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-medium text-green-600 capitalize">{user?.status}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
