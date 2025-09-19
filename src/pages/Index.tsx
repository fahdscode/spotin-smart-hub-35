import { useNavigate } from "react-router-dom";
import { Users, Shield, Coffee, Calendar, TrendingUp, Package } from "lucide-react";
import SpotinHeader from "@/components/SpotinHeader";
import RoleCard from "@/components/RoleCard";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Receptionist",
      description: "Check-in/out, room bookings, create accounts",
      icon: Users,
      path: "/receptionist",
      variant: "primary" as const
    },
    {
      title: "CEO",
      description: "Advanced dashboard, analytics, full system access",
      icon: TrendingUp,
      path: "/ceo",
      variant: "accent" as const
    },
    {
      title: "Client Portal",
      description: "Order drinks, view traffic, register for events",
      icon: Shield,
      path: "/client",
      variant: "default" as const
    },
    {
      title: "Barista",
      description: "Receive orders, manage queue, track preparation",
      icon: Coffee,
      path: "/barista",
      variant: "default" as const
    },
    {
      title: "Community Manager",
      description: "Create events, track attendance, manage tickets",
      icon: Calendar,
      path: "/community",
      variant: "default" as const
    },
    {
      title: "Operations Manager",
      description: "Stock management, inventory, expenses, control panel",
      icon: Package,
      path: "/operations",
      variant: "default" as const
    },
  ];

  const handleRoleClick = (path: string) => {
    if (path === "/receptionist" || path === "/ceo" || path === "/client" || path === "/operations" || path === "/barista" || path === "/community") {
      navigate(path);
    } else {
      // Show coming soon message for other roles
      alert("This interface is coming soon! All major interfaces are now available.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Interface
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            SpotIN provides role-based access to manage your co-working space efficiently. 
            Select your role to access the appropriate tools and features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-scale-up">
          {roles.map((role) => (
            <RoleCard
              key={role.title}
              title={role.title}
              description={role.description}
              icon={role.icon}
              onClick={() => handleRoleClick(role.path)}
              variant={role.variant}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Demo Version - All interfaces now available: Receptionist, CEO, Client Portal, Operations Manager, Barista, and Community Manager
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
