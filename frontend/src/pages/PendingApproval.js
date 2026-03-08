import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Waiting for Approval
            </h1>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-slate-600">
              Your account registration is under review.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-slate-700">Shop: {user?.shop_name || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-slate-700">Owner: {user?.owner_name || user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-slate-700">Email: {user?.email}</span>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Once approved by the admin, you'll be able to access the card catalog 
              and place orders. You will receive an email notification when your 
              account is approved.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
              data-testid="refresh-status-btn"
            >
              Check Status
            </Button>
            <Button
              variant="ghost"
              className="w-full text-slate-500"
              onClick={logout}
              data-testid="logout-btn"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
