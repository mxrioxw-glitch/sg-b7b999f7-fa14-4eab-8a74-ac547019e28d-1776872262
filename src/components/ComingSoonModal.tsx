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
  Bell
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-xl" />
              <div className="relative p-6 bg-gradient-to-br from-accent to-primary rounded-full">
                <Icon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-3xl">
            {moduleName}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {moduleDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="px-4 py-2 text-sm border-accent text-accent">
              <Rocket className="mr-2 h-4 w-4" />
              En Desarrollo
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm border-primary text-primary">
              <Clock className="mr-2 h-4 w-4" />
              {estimatedDate}
            </Badge>
          </div>

          {/* Features Preview */}
          {features.length > 0 && (
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Características Próximamente
                </h3>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle className="h-5 w-5 text-accent" />
                      </div>
                      <span className="text-sm text-muted-foreground flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Notification Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">¿Quieres ser notificado?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Te avisaremos cuando esta funcionalidad esté disponible
                  </p>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Notificarme cuando esté listo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-center pt-2">
            <Button onClick={onClose} className="min-w-[200px]">
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}