import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface ClientData {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  barcode: string;
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
  authError: string | null;
  
  // Auth actions
  signOut: () => Promise<void>;
  setClientAuth: (client: ClientData) => void;
  clearClientAuth: () => void;
  refreshAuth: () => Promise<void>;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleFetchInProgress, setRoleFetchInProgress] = useState(false);
  const [authKey, setAuthKey] = useState(0); // Force re-initialization trigger

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      // PRIORITY CHECK: Client session in localStorage FIRST
      const clientSession = localStorage.getItem('clientData');
      
      if (clientSession) {
        // CLIENT SESSION EXISTS - Skip all Supabase auth processing
        console.log('✅ Client session found, skipping Supabase auth');
        try {
          const parsedClient = JSON.parse(clientSession);
          setClientData(parsedClient);
          setUserRole('client');
          setIsLoading(false);
          return; // Don't set up Supabase auth listener at all
        } catch (error) {
          console.error('Error parsing client session:', error);
          localStorage.removeItem('clientData');
          // Fall through to Supabase auth
        }
      }

      // NO CLIENT SESSION - Proceed with Supabase auth for management
      console.log('📋 No client session, setting up management auth');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!isMounted) return;
          
          console.log('🔐 Auth state changed:', event, session?.user?.email);
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user && event === 'SIGNED_IN') {
            console.log('👔 Management user logged in');
            setTimeout(() => {
              if (isMounted) {
                fetchUserRole(session.user.id);
              }
            }, 0);
          } else if (session?.user && event === 'INITIAL_SESSION') {
            console.log('🔄 Initial management session found');
            setTimeout(() => {
              if (isMounted) {
                fetchUserRole(session.user.id);
              }
            }, 0);
          } else if (!session?.user) {
            setUserRole(null);
            setIsLoading(false);
          }
        }
      );

      authSubscription = subscription;

      // Check for existing session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) {
              fetchUserRole(session.user.id);
            }
          }, 0);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for storage changes (when localStorage is cleared/updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clientData') {
        console.log('🔄 Client data changed in storage, reinitializing auth');
        // Cleanup existing subscription
        if (authSubscription) {
          authSubscription.unsubscribe();
        }
        // Reinitialize
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authKey]); // Re-run when authKey changes

  const fetchUserRole = async (userId: string) => {
    // CRITICAL: Don't fetch management role if client session exists
    const clientSession = localStorage.getItem('clientData');
    if (clientSession) {
      console.log('Client session exists, skipping management role fetch');
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous role fetches
    if (roleFetchInProgress) {
      return;
    }

    setRoleFetchInProgress(true);
    
    try {
      setAuthError(null);
      
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, is_active, email')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        setAuthError(`Role fetch error: ${error.message}`);
        setUserRole(null);
      } else if (!adminUser) {
        setAuthError('No admin privileges found for this user');
        setUserRole(null);
      } else {
        setUserRole(adminUser.role);
        setAuthError(null);
      }
    } catch (error) {
      setAuthError(`Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUserRole(null);
    } finally {
      setIsLoading(false);
      setRoleFetchInProgress(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    
    if (user) {
      await supabase.auth.signOut();
    }
    
    if (clientData) {
      localStorage.removeItem('clientData');
      setClientData(null);
    }
    
    setUserRole(null);
    setUser(null);
    setSession(null);
    
    // Force re-initialization to allow switching auth types
    console.log('🔄 Forcing auth re-initialization');
    setIsLoading(true);
    setAuthKey(prev => prev + 1);
  };

  const setClientAuth = async (client: ClientData) => {
    console.log('👤 Setting client authentication');
    
    // Save client session FIRST
    localStorage.setItem('clientData', JSON.stringify(client));
    setClientData(client);
    setUserRole('client');
    
    // Sign out any Supabase session to prevent conflicts
    if (user) {
      console.log('🔓 Signing out management session for client login');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    }
    
    // Force re-initialization to establish client-only auth
    setAuthKey(prev => prev + 1);
  };

  const clearClientAuth = () => {
    console.log('🧹 Clearing client authentication');
    setClientData(null);
    setUserRole(null);
    localStorage.removeItem('clientData');
    
    // Force re-initialization to allow management login
    setIsLoading(true);
    setAuthKey(prev => prev + 1);
  };

  const refreshAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setAuthError(`Refresh failed: ${error.message}`);
        return;
      }
      
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
    } catch (error) {
      setAuthError(`Refresh exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      authError,
      signOut,
      setClientAuth,
      clearClientAuth,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};