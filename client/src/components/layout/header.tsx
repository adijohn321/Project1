import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, role, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden mr-2 text-neutral-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="flex items-center">
            <svg className="h-10 w-10 mr-2" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 10L90 25V75L60 90L30 75V25L60 10Z" fill="#0078d4" stroke="#0078d4" strokeWidth="2"/>
              <path d="M60 30L75 38V62L60 70L45 62V38L60 30Z" fill="white" stroke="white" strokeWidth="1"/>
              <path d="M60 50L67 54V62L60 66L53 62V54L60 50Z" fill="#0078d4" stroke="#0078d4" strokeWidth="1"/>
            </svg>
            <div>
              <h1 className="text-lg font-semibold text-primary">LGU Finance System</h1>
              <p className="text-xs text-neutral-500">NGAS Compliant</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center">
            <span className="text-sm mr-2">Makati City LGU</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center text-sm focus:outline-none">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                </div>
                <span className="ml-2 hidden lg:block">{user?.fullName || user?.username}</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
