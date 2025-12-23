import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Search, Check } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  client: string;
  service: string;
  value: number;
  date: string;
  status: "paid" | "pending";
  paymentMethod?: "pix" | "cash" | "other";
}

const Payments = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "other">("pix");
  
  const [payments, setPayments] = useState<Payment[]>([
    { id: "1", client: "João da Silva", service: "Instalação de ar-condicionado", value: 800, date: "2024-01-15", status: "paid", paymentMethod: "pix" },
    { id: "2", client: "Maria Santos", service: "Limpeza mensal", value: 350, date: "2024-01-14", status: "pending" },
    { id: "3", client: "Carlos Oliveira", service: "Reparo elétrico", value: 450, date: "2024-01-12", status: "paid", paymentMethod: "cash" },
    { id: "4", client: "Ana Paula", service: "Manutenção preventiva", value: 280, date: "2024-01-10", status: "pending" },
  ]);

  const handleMarkAsPaid = () => {
    if (!confirmDialog) return;
    
    setPayments(payments.map((p) =>
      p.id === confirmDialog.id
        ? { ...p, status: "paid" as const, paymentMethod }
        : p
    ));
    
    toast({
      title: "Pagamento confirmado!",
      description: `Pagamento de ${confirmDialog.client} marcado como recebido.`,
    });
    
    setConfirmDialog(null);
    setPaymentMethod("pix");
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.client.toLowerCase().includes(search.toLowerCase()) ||
      payment.service.toLowerCase().includes(search.toLowerCase())
  );

  const pendingPayments = filteredPayments.filter((p) => p.status === "pending");
  const paidPayments = filteredPayments.filter((p) => p.status === "paid");

  const paymentMethodLabels = {
    pix: "Pix",
    cash: "Dinheiro",
    other: "Outro",
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground">{pendingPayments.length} pendentes</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pagamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pending Section */}
        {pendingPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full" />
              Pendentes
            </h2>
            <div className="space-y-3">
              {pendingPayments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="bg-card border border-border rounded-xl p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{payment.client}</p>
                      <p className="text-sm text-muted-foreground">{payment.service}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold text-warning">
                        R$ {payment.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <Button onClick={() => setConfirmDialog(payment)}>
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como pago
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paid Section */}
        {paidPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full" />
              Recebidos
            </h2>
            <div className="space-y-3">
              {paidPayments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="bg-card border border-border rounded-xl p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{payment.client}</p>
                      <p className="text-sm text-muted-foreground">{payment.service}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-success">
                        R$ {payment.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {payment.paymentMethod && (
                        <p className="text-xs text-muted-foreground">
                          {paymentMethodLabels[payment.paymentMethod]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredPayments.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
          </div>
        )}

        {/* Confirm Payment Dialog */}
        <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar pagamento</DialogTitle>
            </DialogHeader>
            {confirmDialog && (
              <div className="space-y-4 mt-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-medium text-foreground">{confirmDialog.client}</p>
                  <p className="text-sm text-muted-foreground">{confirmDialog.service}</p>
                  <p className="text-xl font-bold text-foreground mt-2">
                    R$ {confirmDialog.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: "pix" | "cash" | "other") => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleMarkAsPaid}>
                  Confirmar recebimento
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Payments;
