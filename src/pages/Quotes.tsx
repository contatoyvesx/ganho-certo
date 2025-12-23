import { useState } from "react";
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
import { Plus, FileText, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  client: string;
  service: string;
  value: number;
  status: "sent" | "approved" | "lost";
  date: string;
}

const statusLabels = {
  sent: { label: "Enviado", className: "bg-muted text-muted-foreground" },
  approved: { label: "Aprovado", className: "bg-success/10 text-success" },
  lost: { label: "Perdido", className: "bg-destructive/10 text-destructive" },
};

const Quotes = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: "1", client: "João da Silva", service: "Instalação de ar-condicionado", value: 800, status: "approved", date: "2024-01-15" },
    { id: "2", client: "Maria Santos", service: "Limpeza mensal", value: 350, status: "sent", date: "2024-01-14" },
    { id: "3", client: "Carlos Oliveira", service: "Reparo elétrico", value: 500, status: "lost", date: "2024-01-10" },
  ]);

  const [formData, setFormData] = useState({
    client: "",
    service: "",
    value: "",
    status: "sent" as Quote["status"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuote: Quote = {
      id: Date.now().toString(),
      client: formData.client,
      service: formData.service,
      value: parseFloat(formData.value),
      status: formData.status,
      date: new Date().toISOString().split("T")[0],
    };
    setQuotes([newQuote, ...quotes]);
    setFormData({ client: "", service: "", value: "", status: "sent" });
    setOpen(false);
    toast({
      title: "Orçamento criado!",
      description: `Orçamento para ${formData.client} foi registrado.`,
    });
  };

  const updateStatus = (id: string, status: Quote["status"]) => {
    setQuotes(quotes.map((q) => (q.id === id ? { ...q, status } : q)));
    toast({
      title: "Status atualizado!",
    });
  };

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.client.toLowerCase().includes(search.toLowerCase()) ||
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
            <DialogContent className="sm:max-w-md">
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
                    onValueChange={(value: Quote["status"]) =>
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
                <Button type="submit" className="w-full">
                  Gerar orçamento
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
        <div className="space-y-3">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            filteredQuotes.map((quote, index) => (
              <div
                key={quote.id}
                className="bg-card border border-border rounded-xl p-4 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{quote.client}</p>
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
                      R$ {quote.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
      </div>
    </AppLayout>
  );
};

export default Quotes;
