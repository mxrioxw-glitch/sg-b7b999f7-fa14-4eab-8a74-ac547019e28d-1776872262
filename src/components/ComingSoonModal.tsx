import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Rocket,
  Bell,
  Star,
  Check
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className={`
              p-4 rounded-2xl
              ${config.bgColor}
            `}>
              <Icon className={`h-12 w-12 ${config.color}`} />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold">
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {config.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Coming Soon Badge */}
          <div className="flex justify-center">
            <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-accent to-accent/80 text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Próximamente - T1 2026
            </Badge>
          </div>

          {/* Features Preview */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Funcionalidades que incluirá:
            </h3>
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-accent mb-2">
              <Clock className="h-5 w-5" />
              <p className="font-semibold">Estamos trabajando en esto</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Este módulo está en desarrollo activo. ¿Quieres ser notificado cuando esté disponible?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="outline" onClick={onClose}>
                Volver
              </Button>
              <Button 
                className="bg-accent hover:bg-accent/90"
                onClick={() => {
                  window.location.href = `mailto:soporte@nexumcloud.com?subject=Interés en ${config.title}&body=Me gustaría recibir notificaciones cuando el módulo de ${config.title} esté disponible.`;
                }}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificarme cuando esté listo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}