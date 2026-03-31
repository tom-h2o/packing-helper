import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button } from "./ui/button";
import { Backpack, List, LogOut } from "lucide-react";

export default function Layout() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) navigate("/login");
    });
    return unsub;
  }, [navigate]);

  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Backpack className="w-5 h-5 text-primary" />
          <span>Packing Helper</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Trips</Link>
          <Link to="/inventory" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"><List className="w-4 h-4"/> Inventory</Link>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
