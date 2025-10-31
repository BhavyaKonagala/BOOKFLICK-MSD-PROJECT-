import { Film, Moon, Sun, LogIn, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Header = () => {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <Film className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">BookFlick</span>
        </div>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" onClick={toggleTheme}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
