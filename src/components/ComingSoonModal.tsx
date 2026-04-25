import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Próximamente</DialogTitle>
          <DialogDescription>
            Esta funcionalidad estará disponible pronto.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}