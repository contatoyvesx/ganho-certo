import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate authentication - will be replaced with real auth
    setTimeout(() => {
      setLoading(false);
      toast({
        title: isLogin ? "Login realizado!" : "Conta criada!",
        description: "Você será redirecionado para o painel.",
      });
      navigate("/dashboard");
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-lg">GS</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isLogin ? "Entre na sua conta" : "Crie sua conta grátis"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? "Acesse seu painel de gestão" 
                : "Comece a organizar seus serviços hoje"
              }
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Digite seu nome"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? (
                  <>Não tem conta? <span className="text-primary font-medium">Criar conta</span></>
                ) : (
                  <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
