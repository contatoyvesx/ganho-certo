import { useState, useEffect } from "react";
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
import { DollarSign, Search, Check, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type PaymentStatus = "pending" | "paid";
type PaymentMethod = "pix" | "cash" | "other";

interface Payment {
  id: string;
  client_name: string;
  service: string;
  value: number;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  created_at: string;
  paid_at: string | null;
}

const Payments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os pagamentos.",
      });
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const handleMarkAsPaid = async () => {
    if (!confirmDialog) return;
    
    setSubmitting(true);

    const { error } = await supabase
      .from("payments")
      .update({ 
        status: "paid" as PaymentStatus, 
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
      })
      .eq("id", confirmDialog.id);

    if (error) {
      console.error("Error updating payment:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o pagamento.",
      });
    } else {
      setPayments(payments.map((p) =>
        p.id === confirmDialog.id
          ? { ...p, status: "paid" as PaymentStatus, payment_method: paymentMethod }
          : p
      ));
      
      toast({
        title: "Pagamento confirmado!",
        description: `Pagamento de ${confirmDialog.client_name} marcado como recebido.`,
      });
    }
    
    setSubmitting(false);
    setConfirmDialog(null);
    setPaymentMethod("pix");
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.client_name.toLowerCase().includes(search.toLowerCase()) ||
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
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
                      className="bg-card border border-border/80 rounded-2xl p-4 animate-slide-up shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{payment.client_name}</p>
                          <p className="text-sm text-muted-foreground">{payment.service}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold text-warning">
                            R$ {Number(payment.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                      className="bg-card border border-border/80 rounded-2xl p-4 animate-slide-up shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{payment.client_name}</p>
                          <p className="text-sm text-muted-foreground">{payment.service}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-success">
                            R$ {Number(payment.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          {payment.payment_method && (
                            <p className="text-xs text-muted-foreground">
                              {paymentMethodLabels[payment.payment_method]}
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
              <div className="text-center py-12 bg-card border border-border/80 rounded-2xl shadow-soft">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {payments.length === 0 ? "Nenhum pagamento registrado ainda" : "Nenhum pagamento encontrado"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Confirm Payment Dialog */}
        <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Confirmar pagamento</DialogTitle>
            </DialogHeader>
            {confirmDialog && (
              <div className="space-y-4 mt-4">
                <div className="bg-secondary/60 rounded-2xl p-4">
                  <p className="font-medium text-foreground">{confirmDialog.client_name}</p>
                  <p className="text-sm text-muted-foreground">{confirmDialog.service}</p>
                  <p className="text-xl font-bold text-foreground mt-2">
                    R$ {Number(confirmDialog.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
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

                <Button className="w-full" onClick={handleMarkAsPaid} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar recebimento"
                  )}
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
