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
  const {
    user,
    signUp,
    signIn,
    signInWithGoogle,
    loading: authLoading,
  } = useAuth();

  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

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
          toast({
            variant: "destructive",
            title: "Erro no login",
            description:
              error.message.includes("Invalid login credentials")
                ? "Email ou senha incorretos."
                : error.message.includes("Email not confirmed")
                ? "Confirme seu email antes de fazer login."
                : "Erro ao fazer login.",
          });
          setLoading(false);
          return;
        }

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

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.name
        );

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description:
              error.message.includes("User already registered")
                ? "Este email já está cadastrado."
                : error.message.includes("Password should be at least")
                ? "A senha deve ter pelo menos 6 caracteres."
                : error.message.includes("Invalid email")
                ? "Email inválido."
                : "Erro ao criar conta.",
          });
          setLoading(false);
          return;
        }

        navigate("/dashboard");
      }
    } catch {
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
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl shadow-soft flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-lg">
                GS
              </span>
            </div>
            <h1 className="text-2xl font-semibold">
              {isLogin ? "Entre na sua conta" : "Crie sua conta grátis"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Acesse seu painel de gestão"
                : "Comece a organizar seus serviços hoje"}
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-soft">
            {/* GOOGLE LOGIN */}
            <Button
              variant="outline"
              className="w-full h-12 mb-4"
              onClick={signInWithGoogle}
            >
              Entrar com Google
            </Button>

            <div className="text-center text-xs text-muted-foreground mb-4">
              ou continue com email
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
              >
                {loading
                  ? "Carregando..."
                  : isLogin
                  ? "Entrar"
                  : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-muted-foreground hover:text-primary"
              >
                {isLogin ? "Criar conta" : "Já tem conta? Entrar"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
