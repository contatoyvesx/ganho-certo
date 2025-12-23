import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, FileText, DollarSign, ArrowRight, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GS</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Gestão Simples</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Saiba exatamente quanto<br />você ganhou no mês.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Um controle fácil de clientes, orçamentos e pagamentos para prestadores de serviço.
          </p>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-16">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">1. Cadastre seus clientes</h3>
              <p className="text-muted-foreground">
                Guarde nome, telefone e tipo de serviço de cada cliente em um só lugar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">2. Anote seus orçamentos</h3>
              <p className="text-muted-foreground">
                Registre cada trabalho, valor e acompanhe se foi aprovado ou não.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border animate-scale-in" style={{ animationDelay: '0.3s' }}>
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
            <div className="space-y-6">
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
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
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
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto">
              Criar minha conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Gestão Simples. Feito para prestadores de serviço.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
