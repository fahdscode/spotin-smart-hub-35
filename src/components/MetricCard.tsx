import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "info";
}

const MetricCard = ({ title, value, change, icon: Icon, variant = "default" }: MetricCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success bg-success/5 text-success";
      case "warning":
        return "border-warning bg-warning/5 text-warning";
      case "info":
        return "border-info bg-info/5 text-info";
      default:
        return "border-primary bg-primary/5 text-primary";
    }
  };

  const getChangeColor = () => {
    if (!change) return "";
    return change.startsWith("+") ? "text-success" : change.startsWith("-") ? "text-destructive" : "text-muted-foreground";
  };

  return (
    <Card className="hover:shadow-card transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${getVariantStyles()}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <p className={`text-xs ${getChangeColor()} mt-1`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;