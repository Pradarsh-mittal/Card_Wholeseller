import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Package, Store, User, Phone, Mail, MapPin, Lock, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    mobile: '',
    email: '',
    address: '',
    password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        shop_name: formData.shop_name,
        owner_name: formData.owner_name,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        password: formData.password
      });
      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-blue-900 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Package className="w-20 h-20 text-brand-orange mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white font-heading mb-4">
            Join Card Wholesale
          </h1>
          <p className="text-lg text-slate-300">
            Register your shop to get access to our premium card catalog 
            and start placing wholesale orders today.
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <Card className="w-full max-w-lg shadow-lg border-slate-200">
          <CardHeader className="space-y-1 text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <Package className="w-12 h-12 text-brand-blue" />
            </div>
            <CardTitle className="text-2xl font-heading">Create Account</CardTitle>
            <CardDescription>
              Register your shop to start ordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      required
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
                      placeholder="Your Full Name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      data-testid="owner-name-input"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      required
                      data-testid="mobile-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      data-testid="email-input"
                    />
                  </div>
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
                    className="pl-10 min-h-[80px]"
                    required
                    data-testid="address-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      data-testid="password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      data-testid="confirm-password-input"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-blue hover:bg-brand-blue-950"
                disabled={loading}
                data-testid="register-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-4">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-blue hover:underline font-medium"
                data-testid="login-link"
              >
                Sign in here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
