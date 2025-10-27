import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Coffee, Calendar, LogIn, UserPlus, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SpotinHeader from "@/components/SpotinHeader";

const ClientHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Coffee,
      title: t('clientHome.features.drinks'),
      description: t('clientHome.features.drinksDesc'),
    },
    {
      icon: Calendar,
      title: t('clientHome.features.events'),
      description: t('clientHome.features.eventsDesc'),
    },
    {
      icon: DoorOpen,
      title: t('clientHome.features.checkin'),
      description: t('clientHome.features.checkinDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            {t('clientHome.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('clientHome.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-3">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Button 
            onClick={() => navigate("/client-login")}
            className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white h-12 text-lg"
          >
            <LogIn className="h-5 w-5 mr-2" />
            {t('clientHome.login')}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t('clientHome.newMember')}
            </p>
            <Button 
              onClick={() => navigate("/client-signup")}
              variant="outline"
              className="w-full h-12 text-lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              {t('clientHome.signup')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHome;
