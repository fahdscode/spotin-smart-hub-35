import { useTranslation } from 'react-i18next';

/**
 * Hook to get localized field names for database queries
 * Returns the appropriate field name based on current language
 */
export const useLocalizedFields = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const getLocalizedField = (baseField: string) => {
    return isArabic ? `${baseField}_ar` : baseField;
  };

  const getProductName = (product: any) => {
    return isArabic && product.name_ar ? product.name_ar : product.name;
  };

  const getProductDescription = (product: any) => {
    return isArabic && product.description_ar ? product.description_ar : product.description;
  };

  const getMembershipName = (membership: any) => {
    return isArabic && membership.plan_name_ar ? membership.plan_name_ar : membership.plan_name;
  };

  const getMembershipDescription = (membership: any) => {
    return isArabic && membership.description_ar ? membership.description_ar : membership.description;
  };

  return {
    isArabic,
    getLocalizedField,
    getProductName,
    getProductDescription,
    getMembershipName,
    getMembershipDescription,
  };
};
