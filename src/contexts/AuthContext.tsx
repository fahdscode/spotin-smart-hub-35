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
    // Check for existing client session first
    const clientSession = localStorage.getItem('clientData');
    if (clientSession) {
      try {
        const parsedClient = JSON.parse(clientSession);
        setClientData(parsedClient);
        setUserRole('client');
        setIsLoading(false);
        return; // Early return for client auth
      } catch (error) {
        console.error('Error parsing client session:', error);
        localStorage.removeItem('clientData');
      }
    }

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching to prevent deadlock
        if (session?.user) {
          console.log('👤 User found, fetching role...');
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          console.log('❌ No user, clearing role');
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    const getSession = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📄 Existing session found:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Existing user found, fetching role...');
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          console.log('❌ No existing session');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
      }
    };

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 Fetching user role for:', userId);
      
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, is_active, email')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching user role:', error);
        setUserRole(null);
      } else if (!adminUser) {
        console.warn('⚠️ No admin user found for userId:', userId);
        setUserRole(null);
      } else {
        console.log('✅ User role fetched successfully:', adminUser);
        setUserRole(adminUser.role);
      }
    } catch (error) {
      console.error('❌ Exception in fetchUserRole:', error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

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