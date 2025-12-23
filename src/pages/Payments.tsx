import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DollarSign, Search, Check, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];

type PaymentStatus = "pending" | "paid";
type PaymentMethod = "pix" | "cash" | "other";

const paymentSchema = z
  .object({
    client_id: z.string().min(1, "Selecione o cliente"),
    quote_id: z.string().optional().nullable(),
    service: z.string().min(2, "Informe o serviço"),
    value: z.coerce.number().min(0.01, "Informe o valor"),
    status: z.enum(["pending", "paid"]),
    payment_method: z.enum(["pix", "cash", "other"]).optional().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.status === "paid" && !values.payment_method) {
      ctx.addIssue({
        code: "custom",
        path: ["payment_method"],
        message: "Informe a forma de pagamento",
      });
    }
  });

type PaymentFormValues = z.infer<typeof paymentSchema>;

const paymentMethodLabels = {
  pix: "Pix",
  cash: "Dinheiro",
  other: "Outro",
};

const Payments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [open, setOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      client_id: "",
      quote_id: "",
      service: "",
      value: 0,
      status: "pending",
      payment_method: null,
    },
  });

  const selectedClientId = form.watch("client_id");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os pagamentos.",
      });
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["payments", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] });
  };

  const createPayment = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      const client = clients.find((c) => c.id === values.client_id);
      if (!client) throw new Error("Cliente inválido");

      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        client_id: values.client_id,
        client_name: client.name,
        quote_id: values.quote_id || null,
        service: values.service,
        value: values.value,
        status: values.status,
        payment_method: values.status === "paid" ? values.payment_method : null,
        paid_at: values.status === "paid" ? new Date().toISOString() : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Pagamento salvo!" });
      form.reset({ client_id: "", quote_id: "", service: "", value: 0, status: "pending", payment_method: null });
      setOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o pagamento.",
      });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async (payload: { id: string; values: PaymentFormValues }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const client = clients.find((c) => c.id === payload.values.client_id);
      if (!client) throw new Error("Cliente inválido");

      const { error } = await supabase
        .from("payments")
        .update({
          client_id: payload.values.client_id,
          client_name: client.name,
          quote_id: payload.values.quote_id || null,
          service: payload.values.service,
          value: payload.values.value,
          status: payload.values.status,
          payment_method: payload.values.status === "paid" ? payload.values.payment_method : null,
          paid_at: payload.values.status === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", payload.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Pagamento atualizado!" });
      setEditingPayment(null);
      setOpen(false);
      form.reset({ client_id: "", quote_id: "", service: "", value: 0, status: "pending", payment_method: null });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o pagamento.",
      });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Pagamento removido" });
      setPaymentToDelete(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o pagamento.",
      });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid" as PaymentStatus,
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Pagamento confirmado!",
        description: `Pagamento de ${confirmDialog?.client_name} marcado como recebido.`,
      });
      setConfirmDialog(null);
      setPaymentMethod("pix");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o pagamento.",
      });
    },
  });

  const onSubmit = (values: PaymentFormValues) => {
    if (editingPayment) {
      updatePayment.mutate({ id: editingPayment.id, values });
    } else {
      createPayment.mutate(values);
    }
  };

  const filteredPayments = useMemo(
    () =>
      (payments || []).filter(
        (payment) =>
          payment.client_name.toLowerCase().includes(search.toLowerCase()) ||
          payment.service.toLowerCase().includes(search.toLowerCase())
      ),
    [payments, search]
  );

  const pendingPayments = filteredPayments.filter((p) => p.status === "pending");
  const paidPayments = filteredPayments.filter((p) => p.status === "paid");

  const availableQuotes = useMemo(
    () =>
      quotes.filter(
        (quote) => quote.status === "approved" && quote.client_id === selectedClientId
      ),
    [quotes, selectedClientId]
  );

  const openForCreate = () => {
    setEditingPayment(null);
    form.reset({ client_id: "", quote_id: "", service: "", value: 0, status: "pending", payment_method: null });
    setOpen(true);
  };

  const openForEdit = (payment: Payment) => {
    setEditingPayment(payment);
    form.reset({
      client_id: payment.client_id || "",
      quote_id: payment.quote_id || "",
      service: payment.service,
      value: payment.value,
      status: payment.status as PaymentStatus,
      payment_method: payment.payment_method,
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pagamentos</h1>
            <p className="text-muted-foreground">{pendingPayments.length} pendentes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openForCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingPayment ? "Editar pagamento" : "Novo pagamento"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={form.watch("client_id")}
                    onValueChange={(value) => form.setValue("client_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.client_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Orçamento (opcional)</Label>
                  <Select
                    value={form.watch("quote_id") || ""}
                    onValueChange={(value) => form.setValue("quote_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o orçamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQuotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          {quote.service} - R$ {Number(quote.value).toLocaleString("pt-BR")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Serviço</Label>
                  <Input id="service" placeholder="Descreva o serviço" {...form.register("service")} />
                  {form.formState.errors.service && (
                    <p className="text-sm text-destructive">{form.formState.errors.service.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0,00"
                    step="0.01"
                    {...form.register("value", { valueAsNumber: true })}
                  />
                  {form.formState.errors.value && (
                    <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value: PaymentStatus) => form.setValue("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={form.watch("payment_method") || ""}
                    onValueChange={(value: PaymentMethod) => form.setValue("payment_method", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.payment_method && (
                    <p className="text-sm text-destructive">{form.formState.errors.payment_method.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPayment.isPending || updatePayment.isPending}
                >
                  {createPayment.isPending || updatePayment.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editingPayment ? (
                    "Salvar alterações"
                  ) : (
                    "Registrar pagamento"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

        {isLoading ? (
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
                          <Button variant="outline" size="sm" onClick={() => openForEdit(payment)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                        <div className="flex items-center gap-4">
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
                          <Button variant="outline" size="sm" onClick={() => openForEdit(payment)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                  {payments && payments.length === 0 ? "Nenhum pagamento registrado ainda" : "Nenhum pagamento encontrado"}
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

                <Button className="w-full" onClick={() => confirmDialog && markAsPaid.mutate(confirmDialog)} disabled={markAsPaid.isPending}>
                  {markAsPaid.isPending ? (
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

        <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação removerá o registro de pagamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => paymentToDelete && deletePayment.mutate(paymentToDelete.id)}
                disabled={deletePayment.isPending}
              >
                {deletePayment.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Payments;
