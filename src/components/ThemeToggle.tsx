import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const getInitialTheme = () => {
    if (typeof window === "undefined") return "dark";

    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return "dark";
  };

  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 text-sm font-medium text-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-pressed={theme === "dark"}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
    </button>
  );
};

export default ThemeToggle;
