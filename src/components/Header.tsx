import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User, CreditCard, Menu } from "lucide-react";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

interface HeaderProps {
  businessName?: string;
  userName?: string;
  userEmail?: string;
  planName?: string;
  onMenuClick?: () => void;
}

export function Header({ 
  businessName = "Mi Negocio", 
  userName = "Usuario",
  userEmail,
  planName = "Plan Básico",
  onMenuClick
}: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isMobileOrTablet = useIsMobileOrTablet();
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          {isMobileOrTablet && onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-base md:text-lg font-bold text-primary-foreground">☕</span>
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold text-foreground">{businessName}</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Sistema POS</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {!isMobileOrTablet && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 md:gap-2 h-9 md:h-10 px-2 md:px-3">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs md:text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline text-sm font-medium">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
                <p className="text-xs text-muted-foreground mt-1">{planName}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscription" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Suscripción
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}