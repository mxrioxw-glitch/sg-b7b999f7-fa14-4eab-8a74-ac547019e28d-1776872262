import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Clock, 
  Check,
  Bell,
  Star
} from "lucide-react";

type ComingSoonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  moduleDescription: string;
  estimatedDate?: string;
  features?: string[];
  icon: React.ComponentType<{ className?: string }>;
};

export function ComingSoonModal({
  isOpen,
  onClose,
  moduleName,
  moduleDescription,
  estimatedDate = "Próximamente",
  features = [],
  icon: Icon,
}: ComingSoonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 rounded-2xl bg-accent/10">
              <Icon className="h-10 w-10 text-accent" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-bold">
              {moduleName}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {moduleDescription}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Coming Soon Badge */}
          <div className="flex justify-center">
            <Badge className="px-3 py-1.5 text-xs bg-gradient-to-r from-accent to-accent/80 text-white">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Próximamente - T1 2026
            </Badge>
          </div>

          {/* Features Preview */}
          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              Funcionalidades que incluirá:
            </h3>
            <div className="grid gap-2.5 max-h-[200px] overflow-y-auto pr-2">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-accent">
              <Clock className="h-4 w-4" />
              <p className="font-semibold text-sm">Estamos trabajando en esto</p>
            </div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Este módulo está en desarrollo activo. ¿Quieres ser notificado cuando esté disponible?
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1.5">
              <Button variant="outline" size="sm" onClick={onClose}>
                Volver
              </Button>
              <Button 
                size="sm"
                className="bg-accent hover:bg-accent/90"
                onClick={() => {
                  window.location.href = `mailto:soporte@nexumcloud.com?subject=Interés en ${moduleName}&body=Me gustaría recibir notificaciones cuando el módulo de ${moduleName} esté disponible.`;
                }}
              >
                <Bell className="h-3.5 w-3.5 mr-1.5" />
                Notificarme cuando esté listo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}