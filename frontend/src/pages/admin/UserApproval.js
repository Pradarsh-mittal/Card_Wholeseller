import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import axios from 'axios';
import { Check, X, Loader2, Store, Phone, Mail, MapPin } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function UserApproval() {
  const { token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users/pending`, { headers, withCredentials: true }),
        axios.get(`${API_URL}/api/admin/users`, { headers, withCredentials: true })
      ]);
      setPendingUsers(pendingRes.data);
      setAllUsers(allRes.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId, approved) => {
    setActionLoading(userId);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_URL}/api/admin/users/approve`,
        { user_id: userId, approved },
        { headers, withCredentials: true }
      );
      toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const UserCard = ({ user, showActions = false }) => (
    <Card className="card-hover" data-testid={`user-card-${user.user_id}`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 truncate">
                {user.owner_name || user.name}
              </h3>
              <StatusBadge status={user.status} />
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Store className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.shop_name || 'No shop name'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{user.mobile || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{user.address || 'No address'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Registered: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          {showActions && user.status === 'pending' && (
            <div className="flex gap-2 md:flex-col">
              <Button
                size="sm"
                onClick={() => handleApproval(user.user_id, true)}
                disabled={actionLoading === user.user_id}
                className="bg-green-600 hover:bg-green-700 flex-1"
                data-testid={`approve-btn-${user.user_id}`}
              >
                {actionLoading === user.user_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApproval(user.user_id, false)}
                disabled={actionLoading === user.user_id}
                className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                data-testid={`reject-btn-${user.user_id}`}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="User Approval" subtitle="Manage retailer registrations">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" data-testid="pending-tab">
              Pending ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="all-users-tab">
              All Retailers ({allUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <p className="text-slate-500">No pending registrations</p>
                </CardContent>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <UserCard key={user.user_id} user={user} showActions />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <p className="text-slate-500">No retailers registered yet</p>
                </CardContent>
              </Card>
            ) : (
              allUsers.map((user) => (
                <UserCard key={user.user_id} user={user} showActions={user.status === 'pending'} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
}
