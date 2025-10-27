import { useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLWrapperProps {
  children: ReactNode;
}

/**
 * RTL Wrapper Component
 * Automatically handles RTL direction and Arabic font for child components
 */
export const RTLWrapper = ({ children }: RTLWrapperProps) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    // Set document direction
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    
    // Apply Cairo font for Arabic
    if (isArabic) {
      document.documentElement.classList.add('font-cairo');
      document.body.classList.add('font-cairo');
    } else {
      document.documentElement.classList.remove('font-cairo');
      document.body.classList.remove('font-cairo');
    }
  }, [isArabic, i18n.language]);

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'} 
      className={isArabic ? 'font-cairo' : ''}
    >
      {children}
    </div>
  );
};

export default RTLWrapper;
