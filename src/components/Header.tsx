import { useState, useEffect } from "react";
import { Bell, Search, User, LogOut, Settings, Store, Menu, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { useRouter } from "next/router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  businessName?: string;
  userName?: string;
  userEmail?: string;
  planName?: string;
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businessName, setBusinessName] = useState("NextCoffee");

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUser(session.user);
        
        // Get business name
        const business = await businessService.getCurrentBusiness();
        if (business?.name) {
          setBusinessName(business.name);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  async function handleLogout() {
    try {
      await authService.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const userInitials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : "US";

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Business Name */}
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary hidden md:block" />
          <span className="font-semibold text-sm md:text-base">{businessName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/subscription")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Suscripción</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}