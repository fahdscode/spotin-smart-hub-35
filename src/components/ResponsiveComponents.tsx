import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveContainer = ({ children, className }: ResponsiveContainerProps) => {
  return (
    <div className={cn("container mx-auto px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const ResponsiveGrid = ({ children, className, cols = { default: 1, sm: 2, md: 3, lg: 4 } }: ResponsiveGridProps) => {
  const gridClasses = cn(
    "grid gap-4",
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return <div className={gridClasses}>{children}</div>;
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileMenu = ({ isOpen, onClose, children }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-card shadow-lg">
        <div className="flex h-full flex-col overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ResponsiveCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveCard = ({ title, children, className }: ResponsiveCardProps) => {
  return (
    <Card className={cn("w-full", className)}>
      {title && (
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="px-4 py-3 sm:px-6 sm:py-4">
        {children}
      </CardContent>
    </Card>
  );
};
