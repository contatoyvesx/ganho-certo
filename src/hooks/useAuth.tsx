import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const safeSetAuthState = (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    const bootAuth = async () => {
      try {
        const envMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (envMissing) {
          throw new Error("Credenciais do Supabase não encontradas. Verifique o arquivo .env");
        }

        const {
          data: authListener,
          error: authListenerError,
        } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
          safeSetAuthState(nextSession);
          setLoading(false);

          // 👉 garante profile no primeiro login (email ou Google)
          if (event === "SIGNED_IN" && nextSession?.user) {
            try {
              await supabase.from("profiles").upsert({
                id: nextSession.user.id,
                email: nextSession.user.email,
              });
            } catch (error) {
              console.error("Erro ao garantir profile", error);
            }
          }
        });

        if (authListenerError) {
          console.error("Erro ao inicializar listener de auth", authListenerError);
          setError("Erro ao inicializar autenticação. Tente atualizar a página.");
          setLoading(false);
        }

        const loadSession = async () => {
          try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error("Erro ao carregar sessão", error);
              setError("Não foi possível carregar a sessão. Faça login novamente.");
              return;
            }

            safeSetAuthState(data.session);
          } catch (error) {
            console.error("Erro inesperado ao carregar sessão", error);
            setError("Erro inesperado ao carregar a sessão.");
          } finally {
            setLoading(false);
          }
        };

        void loadSession();

        return authListener?.subscription;
      } catch (error) {
        console.error("Erro ao iniciar autenticação", error);
        setError(error instanceof Error ? error.message : "Erro desconhecido ao iniciar autenticação");
        setLoading(false);
        return null;
      }
    };

    const subscriptionPromise = bootAuth();

    return () => {
      isMounted = false;
      void subscriptionPromise.then((subscription) => subscription?.unsubscribe());
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  // ✅ LOGIN COM GOOGLE
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
