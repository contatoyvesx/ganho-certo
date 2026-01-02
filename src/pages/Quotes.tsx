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
import { Plus, FileText, Search, Loader2, Pencil, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];

type QuoteStatus = "sent" | "approved" | "lost";

const quoteSchema = z.object({
  client_id: z.string().min(1, "Selecione o cliente"),
  service: z.string().min(2, "Informe o serviço"),
  value: z.coerce.number().min(0.01, "Informe o valor"),
  status: z.enum(["sent", "approved", "lost"]),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

const statusLabels: Record<QuoteStatus, { label: string; className: string }> = {
  sent: { label: "Enviado", className: "bg-muted text-muted-foreground" },
  approved: { label: "Aprovado", className: "bg-success/10 text-success" },
  lost: { label: "Perdido", className: "bg-destructive/10 text-destructive" },
};

const Quotes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      client_id: "",
      service: "",
      value: 0,
      status: "sent",
    },
  });

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

const {
  data: quotes = [],
  isLoading,
  isError,
} = useQuery({
  queryKey: ["quotes", user?.id],
  enabled: !!user,
  queryFn: async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Quotes query error:", error);
      throw error;
    }

    return data ?? [];
  },
  staleTime: 30_000,
});


  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["quotes", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["payments", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] });
  };

  const ensurePaymentForQuote = async (quote: {
    id: string;
    client_id: string;
    client_name: string;
    service: string;
    value: number;
  }) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("quote_id", quote.id)
      .eq("user_id", user.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: user.id,
        quote_id: quote.id,
        client_id: quote.client_id,
        client_name: quote.client_name,
        service: quote.service,
        value: quote.value,
        status: "pending",
      });
      if (paymentError) throw paymentError;
    } else {
      await supabase
        .from("payments")
        .update({
          client_id: quote.client_id,
          client_name: quote.client_name,
          service: quote.service,
          value: quote.value,
        })
        .eq("quote_id", quote.id)
        .eq("user_id", user.id);
    }
  };

  const createQuote = useMutation({
    mutationFn: async (values: QuoteFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      const client = clients.find((c) => c.id === values.client_id);
      if (!client) throw new Error("Cliente inválido");

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          user_id: user.id,
          client_id: values.client_id,
          client_name: client.name,
          service: values.service,
          value: values.value,
          status: values.status,
        })
        .select()
        .single();

      if (error) throw error;

      if (values.status === "approved") {
        await ensurePaymentForQuote({
          id: data.id,
          client_id: values.client_id,
          client_name: client.name,
          service: values.service,
          value: values.value,
        });
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Orçamento criado!",
        description: "Orçamento registrado com sucesso.",
      });
      form.reset({ client_id: "", service: "", value: 0, status: "sent" });
      setOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o orçamento.",
      });
    },
  });

  const updateQuote = useMutation({
    mutationFn: async (payload: { id: string; values: QuoteFormValues }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const client = clients.find((c) => c.id === payload.values.client_id);
      if (!client) throw new Error("Cliente inválido");

      const { error } = await supabase
        .from("quotes")
        .update({
          client_id: payload.values.client_id,
          client_name: client.name,
          service: payload.values.service,
          value: payload.values.value,
          status: payload.values.status,
        })
        .eq("id", payload.id)
        .eq("user_id", user.id);

      if (error) throw error;

      if (payload.values.status === "approved") {
        await ensurePaymentForQuote({
          id: payload.id,
          client_id: payload.values.client_id,
          client_name: client.name,
          service: payload.values.service,
          value: payload.values.value,
        });
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Orçamento atualizado!" });
      setOpen(false);
      setEditingQuote(null);
      form.reset({ client_id: "", service: "", value: 0, status: "sent" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o orçamento.",
      });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      await supabase
        .from("payments")
        .update({ quote_id: null })
        .eq("quote_id", id)
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Orçamento removido" });
      setQuoteToDelete(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o orçamento.",
      });
    },
  });

  const onSubmit = (values: QuoteFormValues) => {
    if (editingQuote) {
      updateQuote.mutate({ id: editingQuote.id, values });
    } else {
      createQuote.mutate(values);
    }
  };

  const filteredQuotes = useMemo(
    () =>
      (quotes || []).filter(
        (quote) =>
          quote.client_name.toLowerCase().includes(search.toLowerCase()) ||
          quote.service.toLowerCase().includes(search.toLowerCase())
      ),
    [quotes, search]
  );

  const openForCreate = () => {
    setEditingQuote(null);
    form.reset({ client_id: "", service: "", value: 0, status: "sent" });
    setOpen(true);
  };

  const openForEdit = (quote: Quote) => {
    setEditingQuote(quote);
    form.reset({
      client_id: quote.client_id || "",
      service: quote.service,
      value: quote.value,
      status: quote.status as QuoteStatus,
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orçamentos</h1>
            <p className="text-muted-foreground">{quotes?.length || 0} orçamentos registrados</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openForCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingQuote ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
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
                  <Label htmlFor="service">Serviço</Label>
                  <Input
                    id="service"
                    placeholder="Descreva o serviço"
                    {...form.register("service")}
                  />
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value: QuoteStatus) => form.setValue("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createQuote.isPending || updateQuote.isPending}
                >
                  {createQuote.isPending || updateQuote.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editingQuote ? (
                    "Salvar alterações"
                  ) : (
                    "Gerar orçamento"
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
            placeholder="Buscar orçamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quotes List */}
        {isLoading && !isError ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border/80 rounded-2xl shadow-soft">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {quotes && quotes.length === 0 ? "Nenhum orçamento registrado ainda" : "Nenhum orçamento encontrado"}
                </p>
              </div>
            ) : (
              filteredQuotes.map((quote, index) => (
                <div
                  key={quote.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 animate-slide-up shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{quote.client_name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[quote.status as QuoteStatus].className}`}
                        >
                          {statusLabels[quote.status as QuoteStatus].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{quote.service}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">
                        R$ {Number(quote.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => openForEdit(quote)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setQuoteToDelete(quote)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <AlertDialog open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
              <AlertDialogDescription>
                Orçamentos removidos não poderão ser recuperados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => quoteToDelete && deleteQuote.mutate(quoteToDelete.id)}
                disabled={deleteQuote.isPending}
              >
                {deleteQuote.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Quotes;
