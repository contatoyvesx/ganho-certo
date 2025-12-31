import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, error } = useAuth();

  if (loading) {
    if (error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="space-y-4 max-w-md">
            <p className="text-lg font-semibold text-destructive">Erro ao carregar autenticação</p>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.href = "/auth"}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground shadow-soft hover:shadow-soft-lg transition-all"
            >
              Voltar para login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
