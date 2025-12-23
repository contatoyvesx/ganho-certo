import { DollarSign, Clock, XCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const Dashboard = () => {
  // Mock data - will be replaced with real data
  const stats = {
    received: 4250.00,
    pending: 1800.00,
    lost: 500.00,
  };

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
        <div className="bg-primary rounded-2xl p-8 mb-6 animate-scale-in">
          <p className="text-primary-foreground/80 mb-2">Este mês você ganhou</p>
          <p className="text-4xl md:text-5xl font-bold text-primary-foreground">
            R$ {stats.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pending */}
          <div className="bg-card border border-border rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Pendente</p>
                <p className="text-2xl font-semibold text-foreground">
                  R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </div>

          {/* Lost */}
          <div className="bg-card border border-border rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Orçamentos perdidos</p>
                <p className="text-2xl font-semibold text-foreground">
                  R$ {stats.lost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Atividade recente</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">João da Silva</p>
                <p className="text-sm text-muted-foreground">Instalação de ar-condicionado</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-success">R$ 800,00</p>
                <p className="text-sm text-muted-foreground">Pago</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Maria Santos</p>
                <p className="text-sm text-muted-foreground">Limpeza geral</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-warning">R$ 350,00</p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Carlos Oliveira</p>
                <p className="text-sm text-muted-foreground">Reparo elétrico</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-success">R$ 450,00</p>
                <p className="text-sm text-muted-foreground">Pago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
