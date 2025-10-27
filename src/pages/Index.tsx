import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SpotinHeader from "@/components/SpotinHeader";

const Index = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const selectLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    navigate('/client-home');
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
              <Languages className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Welcome to SpotIn
            </h1>
            <h2 className="text-4xl font-bold text-foreground mb-4" dir="rtl">
              أهلاً بك في سبوت إن
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose your preferred language / اختر لغتك المفضلة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* English */}
            <Card 
              className="border-2 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 bg-gradient-to-br from-blue-50 to-slate-50"
              onClick={() => selectLanguage('en')}
            >
              <CardHeader className="text-center pb-8 pt-12">
                <div className="text-6xl mb-6">🇬🇧</div>
                <CardTitle className="text-3xl font-bold">English</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white h-14 text-lg"
                >
                  Continue in English
                </Button>
              </CardContent>
            </Card>

            {/* Arabic */}
            <Card 
              className="border-2 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 bg-gradient-to-br from-green-50 to-orange-50"
              onClick={() => selectLanguage('ar')}
            >
              <CardHeader className="text-center pb-8 pt-12" dir="rtl">
                <div className="text-6xl mb-6">🇪🇬</div>
                <CardTitle className="text-3xl font-bold">العربية</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-12" dir="rtl">
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white h-14 text-lg"
                >
                  استمر بالعربية
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
