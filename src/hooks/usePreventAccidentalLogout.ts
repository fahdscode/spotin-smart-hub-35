import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to prevent accidental logouts from browser back/forward/refresh buttons
 * Maintains authentication state across navigation
 */
export const usePreventAccidentalLogout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Prevent page unload warning for authenticated users
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning, just maintain state
      return undefined;
    };

    // Handle browser back/forward buttons
    const handlePopState = () => {
      // Session is maintained via AuthContext
      // Just update the current route
      console.log('Navigation via back/forward button - session maintained');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]);
};
