import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          let errorMessage = "Erro ao fazer login.";
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Email ou senha incorretos.";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Confirme seu email antes de fazer login.";
          }
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: errorMessage,
          });
          setLoading(false);
          return;
        }
        
        toast({
          title: "Login realizado!",
          description: "Você será redirecionado para o painel.",
        });
        navigate("/dashboard");
      } else {
        if (!formData.name.trim()) {
          toast({
            variant: "destructive",
            title: "Nome obrigatório",
            description: "Por favor, digite seu nome.",
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.name);
        
        if (error) {
          let errorMessage = "Erro ao criar conta.";
          if (error.message.includes("User already registered")) {
            errorMessage = "Este email já está cadastrado. Tente fazer login.";
          } else if (error.message.includes("Password should be at least")) {
            errorMessage = "A senha deve ter pelo menos 6 caracteres.";
          } else if (error.message.includes("Invalid email")) {
            errorMessage = "Email inválido.";
          }
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: errorMessage,
          });
          setLoading(false);
          return;
        }
        
        toast({
          title: "Conta criada!",
          description: "Você será redirecionado para o painel.",
        });
        navigate("/dashboard");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
      });
    }
    
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
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
            <div className="w-12 h-12 bg-primary rounded-xl shadow-soft flex items-center justify-center mx-auto mb-4">
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
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-soft transition-shadow hover:shadow-soft-lg">
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
