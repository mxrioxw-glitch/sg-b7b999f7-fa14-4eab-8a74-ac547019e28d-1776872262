import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User, CreditCard, Menu, Store } from "lucide-react";
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
                {userEmail?.[0]?.toUpperCase() || userName?.[0]?.toUpperCase() || "M"}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {userEmail?.split("@")[0] || userName || "mastertekmx"}
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