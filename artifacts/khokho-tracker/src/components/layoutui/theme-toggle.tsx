import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // Default to energetic dark mode

  useEffect(() => {
    const isDarkStored = localStorage.getItem("kk_theme") === "dark";
    setIsDark(isDarkStored !== false); // Default true if null
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kk_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kk_theme", "light");
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="rounded-full hover-elevate"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
