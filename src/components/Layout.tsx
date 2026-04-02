import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { LogOut, PlaneTakeoff, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

export default function Layout() {
  const [user, setUser] = useState(auth.currentUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u && location.pathname !== "/login") navigate("/login");
    });
    return unsub;
  }, [navigate, location.pathname]);

  if (!user && location.pathname !== "/login") return null;

  return (
    <div className="min-h-screen relative overflow-x-hidden text-foreground">
      {user && (
        <header className="sticky top-0 z-50 w-full glass shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight transition-transform hover:scale-105">
                <PlaneTakeoff className="h-6 w-6" />
                <span>PackMule</span>
              </Link>
              
              <nav className="hidden md:flex gap-2">
                <Link to="/" className={`px-4 py-2 flex items-center gap-2 rounded-full text-sm font-bold transition-all ${location.pathname === '/' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  Dashboard
                </Link>
                <Link to="/inventory" className={`px-4 py-2 flex items-center gap-2 rounded-full text-sm font-bold transition-all ${location.pathname === '/inventory' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  Inventory
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold hidden md:block opacity-60 mix-blend-multiply dark:mix-blend-screen">{user.email}</span>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all" onClick={() => auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
