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

  useEffect(() => {
    let isMounted = true;

    // Restore client session from localStorage immediately
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

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Management user actively logging in - clear client data
        if (session?.user && event === 'SIGNED_IN') {
          console.log('Management user actively logged in, clearing client session');
          setClientData(null);
          localStorage.removeItem('clientData');
          setTimeout(() => {
            if (isMounted) {
              fetchUserRole(session.user.id);
            }
          }, 0);
        } else if (session?.user && event === 'INITIAL_SESSION') {
          // Initial session found - check if client data exists
          const clientSession = localStorage.getItem('clientData');
          if (clientSession) {
            // Client session takes priority over management session
            console.log('Client session exists, ignoring management session');
            setIsLoading(false);
          } else {
            // No client session, proceed with management session
            setTimeout(() => {
              if (isMounted) {
                fetchUserRole(session.user.id);
              }
            }, 0);
          }
        } else {
          // No Supabase session - preserve client data if exists
          const clientSession = localStorage.getItem('clientData');
          if (!clientSession) {
            setUserRole(null);
          }
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    const getSession = async () => {
      try {
        // Check if client session exists in localStorage first
        const clientSession = localStorage.getItem('clientData');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // If client session exists, prioritize it over management session
          if (clientSession) {
            console.log('Client session takes priority, not fetching management role');
            setIsLoading(false);
          } else {
            // No client session, proceed with management authentication
            setTimeout(() => {
              if (isMounted) {
                fetchUserRole(session.user.id);
              }
            }, 0);
          }
        } else {
          // No management session - client data already restored from localStorage
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    // Prevent back button from clearing auth
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Session is maintained, just update the route
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
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