import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, FileText, DollarSign, ArrowRight, CheckCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/60">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl shadow-soft flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GS</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Gestão Simples</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-soft animate-fade-in">
            SaaS simples para prestadores
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Saiba exatamente quanto<br />
            <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
              você ganhou no mês.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Um controle fácil de clientes, orçamentos e pagamentos para prestadores de serviço.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="text-lg px-8 py-6 h-auto glow-primary">
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                Ver painel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/60">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-16">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative bg-card rounded-2xl p-8 shadow-soft border border-border/80 animate-scale-in hover:-translate-y-1 hover:shadow-soft-lg transition-all overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">1. Cadastre seus clientes</h3>
              <p className="text-muted-foreground">
                Guarde nome, telefone e tipo de serviço de cada cliente em um só lugar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-card rounded-2xl p-8 shadow-soft border border-border/80 animate-scale-in hover:-translate-y-1 hover:shadow-soft-lg transition-all overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">2. Anote seus orçamentos</h3>
              <p className="text-muted-foreground">
                Registre cada trabalho, valor e acompanhe se foi aprovado ou não.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-card rounded-2xl p-8 shadow-soft border border-border/80 animate-scale-in hover:-translate-y-1 hover:shadow-soft-lg transition-all overflow-hidden" style={{ animationDelay: '0.3s' }}>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">3. Veja quem pagou</h3>
              <p className="text-muted-foreground">
                Saiba exatamente quanto recebeu e quanto ainda tem para receber.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-12">
              Feito para quem trabalha de verdade
            </h2>
            <div className="space-y-6 bg-card/80 border border-border/70 rounded-2xl p-8 shadow-soft relative overflow-hidden">
              <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              {[
                "Eletricistas",
                "Encanadores", 
                "Técnicos de ar-condicionado",
                "Serviços de limpeza",
                "Pintores e pedreiros",
                "Qualquer prestador de serviço"
              ].map((item, index) => (
                <div 
                  key={item} 
                  className="flex items-center gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  </div>
                  <span className="text-lg text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-primary-foreground mb-6">
            Comece agora, é grátis
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Organize seu trabalho em poucos minutos. Sem complicação.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto shadow-soft">
              Criar minha conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/60">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Gestão Simples. Feito para prestadores de serviço.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
