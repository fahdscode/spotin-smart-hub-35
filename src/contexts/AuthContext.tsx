import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface ClientData {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
}

interface AuthContextType {
  // Supabase Auth (for management)
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  
  // Client Auth (custom system)
  clientData: ClientData | null;
  
  // Combined auth status
  isAuthenticated: boolean;
  userRole: string | null;
  
  // Auth actions
  signOut: () => Promise<void>;
  setClientAuth: (client: ClientData) => void;
  clearClientAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing Supabase session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get user role from admin_users table
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();
        
        setUserRole(adminUser?.role || null);
      }
      
      setIsLoading(false);
    };

    // Check for existing client session
    const clientSession = localStorage.getItem('clientData');
    if (clientSession) {
      try {
        const parsedClient = JSON.parse(clientSession);
        setClientData(parsedClient);
        setUserRole('client');
      } catch (error) {
        console.error('Error parsing client session:', error);
        localStorage.removeItem('clientData');
      }
    }

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user role
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();
          
          setUserRole(adminUser?.role || null);
        } else {
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (user) {
      await supabase.auth.signOut();
    }
    
    if (clientData) {
      localStorage.removeItem('clientData');
      setClientData(null);
    }
    
    setUserRole(null);
  };

  const setClientAuth = (client: ClientData) => {
    setClientData(client);
    setUserRole('client');
    localStorage.setItem('clientData', JSON.stringify(client));
  };

  const clearClientAuth = () => {
    setClientData(null);
    setUserRole(null);
    localStorage.removeItem('clientData');
  };

  const isAuthenticated = !!(user || clientData);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      clientData,
      isLoading,
      isAuthenticated,
      userRole,
      signOut,
      setClientAuth,
      clearClientAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};