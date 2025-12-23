import { useState, useEffect } from "react";
import { Clock, XCircle, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string;
  client_name: string;
  service: string;
  value: number;
  status: "pending" | "paid";
  created_at: string;
}

interface Quote {
  id: string;
  value: number;
  status: "sent" | "approved" | "lost";
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    received: 0,
    pending: 0,
    lost: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const fetchData = async () => {
    if (!user) return;

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    // Fetch quotes for lost value
    const { data: quotes } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "lost")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    const received = (payments || [])
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.value), 0);

    const pending = (payments || [])
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Number(p.value), 0);

    const lost = (quotes || [])
      .reduce((sum, q) => sum + Number(q.value), 0);

    setStats({ received, pending, lost });

    // Recent payments for activity feed
    const { data: recent } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentPayments(recent || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Olá! 👋
          </h1>
          <p className="text-muted-foreground capitalize">
            Resumo de {currentMonth}
          </p>
        </div>

        {/* Main Stat */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-8 mb-6 animate-scale-in shadow-soft-lg relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <p className="text-primary-foreground/80 mb-2">Este mês você ganhou</p>
          <p className="text-4xl md:text-5xl font-bold text-primary-foreground">
            R$ {stats.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pending */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 animate-slide-up shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Pendente</p>
                <p className="text-2xl font-semibold text-foreground">
                  R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </div>

          {/* Lost */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 animate-slide-up shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Orçamentos perdidos</p>
                <p className="text-2xl font-semibold text-foreground">
                  R$ {stats.lost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentPayments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Atividade recente</h2>
            <div className="bg-card border border-border/80 rounded-2xl divide-y divide-border/80 shadow-soft">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{payment.client_name}</p>
                    <p className="text-sm text-muted-foreground">{payment.service}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${payment.status === "paid" ? "text-success" : "text-warning"}`}>
                      R$ {Number(payment.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.status === "paid" ? "Pago" : "Pendente"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentPayments.length === 0 && (
          <div className="mt-8 text-center py-12 bg-card border border-border/80 rounded-2xl shadow-soft">
            <p className="text-muted-foreground">
              Nenhuma atividade ainda. Comece cadastrando seus clientes e orçamentos!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
