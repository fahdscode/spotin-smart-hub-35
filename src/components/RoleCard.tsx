import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "primary" | "accent";
}

const RoleCard = ({ title, description, icon: Icon, onClick, variant = "default" }: RoleCardProps) => {
  const cardVariant = variant === "primary" ? "border-primary bg-gradient-card" : variant === "accent" ? "border-accent bg-gradient-card" : "";
  
  return (
    <Card className={`hover:shadow-card transition-all duration-300 cursor-pointer group ${cardVariant}`} onClick={onClick}>
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200 ${
          variant === "primary" ? "bg-primary/10 text-primary" : 
          variant === "accent" ? "bg-accent/10 text-accent" : 
          "bg-muted text-foreground"
        }`}>
          <Icon className="h-8 w-8" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          variant={variant === "primary" ? "professional" : variant === "accent" ? "accent" : "card"}
          className="w-full"
          size="lg"
        >
          Access {title}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RoleCard;