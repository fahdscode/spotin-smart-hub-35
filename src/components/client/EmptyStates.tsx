import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, Heart, Receipt, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  type: 'favorites' | 'orders' | 'cart' | 'pending';
  onAction?: () => void;
}

export const EmptyState = ({ type, onAction }: EmptyStateProps) => {
  const { t } = useTranslation();

  const configs = {
    favorites: {
      icon: Heart,
      title: t('No favorites yet'),
      description: t('Order items to see your favorites here'),
      actionLabel: t('Browse Menu'),
      showAction: true
    },
    orders: {
      icon: Receipt,
      title: t('No order history'),
      description: t('Your past orders will appear here'),
      actionLabel: t('Place First Order'),
      showAction: true
    },
    cart: {
      icon: ShoppingCart,
      title: t('Your cart is empty'),
      description: t('Add items from the menu to get started'),
      actionLabel: t('Browse Menu'),
      showAction: true
    },
    pending: {
      icon: Coffee,
      title: t('No pending orders'),
      description: t('Place an order and track it here'),
      actionLabel: null,
      showAction: false
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {config.description}
        </p>
        {config.showAction && onAction && (
          <Button onClick={onAction} variant="outline">
            {config.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
