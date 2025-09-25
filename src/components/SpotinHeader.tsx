import { Clock, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CairoClock from "@/components/CairoClock";
import spotinLogo from "@/assets/spotin-logo.png";

interface SpotinHeaderProps {
  showClock?: boolean;
}
const SpotinHeader = ({ showClock = false }: SpotinHeaderProps) => {
  return <header className="bg-gradient-primary text-white p-6 shadow-custom-lg">
      <div className="container flex items-center justify-between mx-0 px-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <img src={spotinLogo} alt="SpotIN Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SpotIN</h1>
            <p className="text-white/80 text-sm">The Space of the Future</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showClock && <CairoClock />}
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-white/20 text-white text-sm">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};
export default SpotinHeader;