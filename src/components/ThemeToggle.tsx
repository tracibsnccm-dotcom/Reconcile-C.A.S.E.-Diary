import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { isOptionalTableError } from "@/lib/optionalTableUtils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { user } = useAuth();

  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("theme")
          .eq("user_id", user.id)
          .single();

        if (!(error && isOptionalTableError(error)) && data?.theme) {
          setTheme(data.theme as "light" | "dark");
          document.documentElement.classList.toggle("dark", data.theme === "dark");
          return;
        }
      }

      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }
    };

    loadTheme();
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);

    if (user) {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: "user_id" });
      if (error && !isOptionalTableError(error)) {
        console.warn("ThemeToggle: could not save theme", error);
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="border-border bg-background hover:bg-accent"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-foreground" />
      ) : (
        <Sun className="h-5 w-5 text-foreground" />
      )}
    </Button>
  );
}