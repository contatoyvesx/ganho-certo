import { useState, useEffect } from "react";
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
import { Plus, FileText, Search, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type QuoteStatus = "sent" | "approved" | "lost";

interface Quote {
  id: string;
  client_name: string;
  service: string;
  value: number;
  status: QuoteStatus;
  created_at: string;
}

const statusLabels = {
  sent: { label: "Enviado", className: "bg-muted text-muted-foreground" },
  approved: { label: "Aprovado", className: "bg-success/10 text-success" },
  lost: { label: "Perdido", className: "bg-destructive/10 text-destructive" },
};

const Quotes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client: "",
    service: "",
    value: "",
    status: "sent" as QuoteStatus,
  });

  const fetchQuotes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quotes:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os orçamentos.",
      });
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        client_name: formData.client,
        service: formData.service,
        value: parseFloat(formData.value),
        status: formData.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating quote:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o orçamento.",
      });
    } else {
      setQuotes([data, ...quotes]);
      setFormData({ client: "", service: "", value: "", status: "sent" });
      setOpen(false);
      toast({
        title: "Orçamento criado!",
        description: `Orçamento para ${formData.client} foi registrado.`,
      });

      // If approved, create a payment
      if (formData.status === "approved") {
        await supabase.from("payments").insert({
          user_id: user.id,
          quote_id: data.id,
          client_name: formData.client,
          service: formData.service,
          value: parseFloat(formData.value),
          status: "pending",
        });
      }
    }
    
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: QuoteStatus) => {
    const quote = quotes.find((q) => q.id === id);
    if (!quote || !user) return;

    const { error } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating quote:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status.",
      });
    } else {
      setQuotes(quotes.map((q) => (q.id === id ? { ...q, status } : q)));
      toast({
        title: "Status atualizado!",
      });

      // If approved, create a payment
      if (status === "approved") {
        await supabase.from("payments").insert({
          user_id: user.id,
          quote_id: id,
          client_name: quote.client_name,
          service: quote.service,
          value: quote.value,
          status: "pending",
        });
      }
    }
  };

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.client_name.toLowerCase().includes(search.toLowerCase()) ||
      quote.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orçamentos</h1>
            <p className="text-muted-foreground">{quotes.length} orçamentos registrados</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Novo orçamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input
                    id="client"
                    placeholder="Nome do cliente"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Serviço</Label>
                  <Input
                    id="service"
                    placeholder="Descreva o serviço"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0,00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: QuoteStatus) =>
                      setFormData({ ...formData, status: value })
                    }
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
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border/80 rounded-2xl shadow-soft">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {quotes.length === 0 ? "Nenhum orçamento registrado ainda" : "Nenhum orçamento encontrado"}
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
                          className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[quote.status].className}`}
                        >
                          {statusLabels[quote.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{quote.service}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold text-foreground">
                        R$ {Number(quote.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {quote.status === "sent" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success hover:bg-success/10"
                            onClick={() => updateStatus(quote.id, "approved")}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => updateStatus(quote.id, "lost")}
                          >
                            Perdido
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Quotes;
