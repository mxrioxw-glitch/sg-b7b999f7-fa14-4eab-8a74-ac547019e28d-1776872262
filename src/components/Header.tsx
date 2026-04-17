import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, CreditCard, Menu, Store } from "lucide-react";
import { authService } from "@/services/authService";

interface HeaderProps {
  onMenuClick?: () => void;
  businessName?: string;
  userName?: string;
  userEmail?: string;
  planName?: string;
}

export function Header({ onMenuClick, businessName, userName, userEmail, planName }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-lg p-2 hover:bg-accent"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Business info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">cafeteria prueba</h1>
            <p className="text-xs text-muted-foreground">Sistema POS</p>
          </div>
        </div>
      </div>

      {/* User section - right aligned */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-2 hover:bg-accent">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {user?.email?.[0]?.toUpperCase() || "M"}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.email?.split("@")[0] || "mastertekmx"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/subscription")}>
              <CreditCard className="mr-2 h-4 w-4" />
              Suscripción
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}