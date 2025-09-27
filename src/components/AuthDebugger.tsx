import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const AuthDebugger: React.FC = () => {
  const { user, session, userRole, isAuthenticated, isLoading, clientData } = useAuth();

  const refreshAuth = async () => {
    console.log('🔄 Refreshing authentication...');
    await supabase.auth.refreshSession();
  };

  const checkUserRole = async () => {
    if (!user?.id) return;
    
    console.log('🔍 Manual role check for user:', user.id);
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id);
      
    console.log('Admin users data:', data);
    console.log('Admin users error:', error);
  };

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">🐛 Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Authenticated:</strong> 
            <Badge variant={isAuthenticated ? "default" : "destructive"} className="ml-1">
              {isAuthenticated ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>Loading:</strong>
            <Badge variant={isLoading ? "secondary" : "outline"} className="ml-1">
              {isLoading ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>User Role:</strong>
            <Badge variant={userRole ? "default" : "outline"} className="ml-1">
              {userRole || "None"}
            </Badge>
          </div>
          <div>
            <strong>User ID:</strong>
            <span className="ml-1 text-muted-foreground">
              {user?.id || "None"}
            </span>
          </div>
        </div>
        
        {clientData && (
          <div className="pt-2 border-t">
            <strong>Client Data:</strong> {clientData.full_name} ({clientData.client_code})
          </div>
        )}
        
        <div className="pt-2 border-t">
          <strong>Session Valid:</strong> 
          <Badge variant={session ? "default" : "destructive"} className="ml-1">
            {session ? "Yes" : "No"}
          </Badge>
          {session && (
            <div className="text-xs text-muted-foreground mt-1">
              Expires: {new Date(session.expires_at! * 1000).toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={refreshAuth}>
            Refresh Session
          </Button>
          <Button size="sm" variant="outline" onClick={checkUserRole}>
            Check Role
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};