import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { fetchTrips, fetchItems, fetchTags } from "../lib/db";
import type { Trip, Tag } from "../lib/schema";
import { Button } from "../components/ui/button";
import { Plus, PlaneTakeoff, Backpack, Compass, Luggage, Archive } from "lucide-react";
import { getFlagEmoji } from "../lib/countries";

export default function Dashboard() {
  const user = auth.currentUser;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [tagMap, setTagMap] = useState<Map<string, Tag>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTrips(), fetchItems(), fetchTags()]).then(([t, i, tags]) => {
      setTrips(t);
      setTotalItems(i.length);
      setTagMap(new Map(tags.map(tag => [tag.id!, tag])));
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] glass-card p-10 md:p-14 text-center md:text-left shadow-xl shadow-primary/5">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[20rem] h-[20rem] bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            Ready for your <br className="hidden md:block"/> next adventure?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mb-10">
            Automate your packing checklist and leverage AI to make sure you never forget your essentials at home.
          </p>
          <Link to="/new-trip">
            <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-xl shadow-primary/30 font-bold border border-white/20 hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 mr-2" /> Start Packing
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Luggage className="h-6 w-6 text-primary" />
          </div>
          <span className="text-3xl font-extrabold">{trips.filter(t => !t.archived).length}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-bold">Planned Trips</span>
        </div>
        <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Backpack className="h-6 w-6 text-indigo-500" />
          </div>
          <span className="text-3xl font-extrabold">{totalItems}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-bold">Inventory Gear</span>
        </div>
        <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Compass className="h-6 w-6 text-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold">{trips.reduce((acc, t) => acc + t.activities.length, 0)}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-bold">Activities Logged</span>
        </div>
        <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
          <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PlaneTakeoff className="h-6 w-6 text-orange-500" />
          </div>
          <span className="text-3xl font-extrabold">{(() => {
            const now = new Date();
            const upcoming = trips
              .filter(t => new Date(t.date_start) >= now)
              .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
            return upcoming.length > 0
              ? new Date(upcoming[0].date_start).toLocaleDateString(undefined, {month:'short', day:'numeric'})
              : '-';
          })()}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-bold">Next Departure</span>
        </div>
      </section>

      {/* Trips Grid */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Your Trips</h2>
          {trips.some(t => t.archived) && (
            <button
              type="button"
              onClick={() => setShowArchived(s => !s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors
                ${showArchived ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              <Archive className="w-4 h-4" />
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>
          )}
        </div>

        {trips.filter(t => showArchived ? t.archived : !t.archived).length === 0 ? (
          <div className="glass-card py-20 text-center rounded-3xl border-dashed">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <PlaneTakeoff className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No trips planned yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto font-medium">Your checklist awaits! Create your first trip to organize your inventory intelligently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.filter(t => showArchived ? t.archived : !t.archived).map((trip, i) => (
              <Link to={`/trip/${trip.id}`} key={trip.id} className="group relative" style={{animationDelay: `${i * 100}ms`}} >
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/40 to-indigo-500/40 rounded-[2rem] blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative glass-card h-full p-8 text-left rounded-3xl flex flex-col bg-card/80 overflow-hidden">
                  {trip.country && (
                    <div className="absolute top-3 right-4 text-[4.5rem] leading-none select-none opacity-20 pointer-events-none">
                      {getFlagEmoji(trip.country)}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    {trip.country && <span className="text-2xl leading-none shrink-0">{getFlagEmoji(trip.country)}</span>}
                    <h3 className="text-2xl font-extrabold line-clamp-1">{trip.name}</h3>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground/80 mb-6 flex items-center gap-2">
                    {new Date(trip.date_start).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                    <span className="text-muted-foreground/40 text-xs text-center border-b px-2 flex-1 mx-2 relative top-[-4px]">to</span>
                    {new Date(trip.date_end).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-border flex gap-2 flex-wrap">
                    <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20">{tagMap.get(trip.temperature)?.name ?? trip.temperature}</span>
                    <span className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold shadow-sm">{trip.activities.length} Activities</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
