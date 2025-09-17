import { Building2, Clock } from "lucide-react";

const SpotinHeader = () => {
  return (
    <header className="bg-gradient-primary text-white p-6 shadow-custom-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SpotIN</h1>
            <p className="text-white/80 text-sm">Smart Management Software</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
};

export default SpotinHeader;