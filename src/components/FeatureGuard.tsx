import { ReactNode } from "react";

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  // Suscripciones eliminadas. Todos tienen acceso a todas las funcionalidades por defecto.
  return <>{children}</>;
}