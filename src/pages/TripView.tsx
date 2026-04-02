import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTrip, fetchTripItems, fetchItems, fetchTags, updateTripItemStatus, updateTripItemQuantity, addItemToTrip } from "../lib/db";
import { generatePackingSuggestions } from "../lib/ai";
import type { Trip, TripItem, Item, Tag } from "../lib/schema";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Loader2, Sparkles, Plus, PlaneTakeoff, CheckCircle2, ChevronRight, Luggage } from "lucide-react";
import { getFlagEmoji } from "../lib/countries";

export default function TripView() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [tagMap, setTagMap] = useState<Map<string, Tag>>(new Map());
  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const loadTripData = () => {
    if (!id) return;
    Promise.all([
      fetchTrip(id),
      fetchTripItems(id),
      fetchItems(),
      fetchTags()
    ]).then(([t, ti, i, tags]) => {
      setTrip(t);
      setTripItems(ti);
      setAllItems(i);
      setTagMap(new Map(tags.map(tag => [tag.id!, tag])));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadTripData();
  }, [id]);

  const togglePacked = async (tripItemId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, is_packed: !currentStatus } : ti));
    await updateTripItemStatus(tripItemId, !currentStatus);
  };

  const changeQuantity = async (tripItemId: string, current: number, delta: number) => {
    const next = Math.max(1, current + delta);
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, quantity: next } : ti));
    await updateTripItemQuantity(tripItemId, next);
  };

  const handleSuggest = async () => {
    if (!trip) return;
    setAiLoading(true);
    const start = new Date(trip.date_start).getTime();
    const end = new Date(trip.date_end).getTime();
    const diffDays = Math.round((end - start) / (1000 * 3600 * 24)) || 1;
    const tempName = tagMap.get(trip.temperature)?.name ?? trip.temperature;
    const activityNames = trip.activities.map(a => tagMap.get(a)?.name ?? a);
    const res = await generatePackingSuggestions(trip.name, diffDays, tempName, activityNames);
    setSuggestions(res);
    setAiLoading(false);
  };

  const addSuggestionToTrip = async (itemName: string) => {
    if (!trip || !id) return;
    setSuggestions(prev => prev.filter(s => s !== itemName));
    await addItemToTrip(id, itemName, trip.temperature);
    loadTripData();
  };

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
    </div>
  );
  if (!trip) return <div className="p-16 text-center text-muted-foreground font-extrabold text-2xl">Trip not found.</div>;

  const packedCount = tripItems.filter(ti => ti.is_packed).length;
  const totalCount = tripItems.length;
  const progress = totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  const flagEmoji = trip.country ? getFlagEmoji(trip.country) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">

      {/* Header */}
      <div className="glass-card p-10 md:p-14 rounded-[3rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-8">
        {/* Flag as a large background design element */}
        {flagEmoji && (
          <div className="absolute top-4 right-8 text-[9rem] leading-none select-none opacity-20 pointer-events-none">
            {flagEmoji}
          </div>
        )}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
              {flagEmoji
                ? <span className="text-2xl leading-none">{flagEmoji}</span>
                : <PlaneTakeoff className="text-primary w-6 h-6" />}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{trip.name}</h1>
          </div>

          <p className="text-muted-foreground text-lg font-bold flex flex-wrap items-center gap-3">
            {new Date(trip.date_start).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            <ChevronRight className="w-4 h-4 opacity-50" />
            {new Date(trip.date_end).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <span className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-extrabold">
              {tagMap.get(trip.temperature)?.name ?? trip.temperature}
            </span>
            {trip.activities.map(act => (
              <span key={act} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-extrabold shadow-sm">
                {tagMap.get(act)?.name ?? act}
              </span>
            ))}
          </div>

          <div className="mt-12">
            <div className="flex justify-between text-sm font-extrabold mb-3">
              <span>Packing Progress</span>
              <span className="text-primary">{progress}% ({packedCount} / {totalCount})</span>
            </div>
            <div className="w-full bg-secondary/50 rounded-full h-4 overflow-hidden border border-border shadow-inner relative">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full skeleton-shine" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0 self-start md:self-end">
          <Button
            onClick={handleSuggest}
            disabled={aiLoading}
            size="lg"
            className="rounded-full shadow-xl shadow-fuchsia-500/20 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-extrabold h-14 px-8 transition-transform hover:scale-105 group"
          >
            {aiLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 group-hover:animate-pulse" />}
            {aiLoading ? "Analyzing..." : "Ask AI to Check"}
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass-card bg-fuchsia-500/5 border-fuchsia-500/20 p-8 rounded-[2.5rem] shadow-lg shadow-fuchsia-500/5 animate-in slide-in-from-top-4 duration-500 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-fuchsia-500/20 rounded-xl relative">
              <Sparkles className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 absolute animate-ping opacity-75" />
              <Sparkles className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 relative" />
            </div>
            <h2 className="text-2xl font-extrabold">AI Packing Suggestions</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {suggestions.map(s => (
              <Button
                key={s}
                onClick={() => addSuggestionToTrip(s)}
                variant="outline"
                className="rounded-full bg-background border-fuchsia-500/30 hover:bg-fuchsia-500 hover:text-white hover:border-fuchsia-500 transition-all font-bold h-10 px-5 shadow-sm group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="glass-card p-8 md:p-10 rounded-[3rem] shadow-xl">
        <h2 className="text-3xl font-extrabold mb-8 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl"><CheckCircle2 className="w-7 h-7 text-emerald-500" /></div>
          Checklist
        </h2>

        {tripItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mb-6">
              <Luggage className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-lg font-bold">Your bag is completely empty.</p>
            <p className="text-muted-foreground/60 font-medium">Use "Ask AI" to build your list!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tripItems.map((ti, i) => {
              const itemDetail = allItems.find(item => item.id === ti.item_id);
              const showQty = itemDetail?.quantity_relevant && ti.quantity !== undefined;

              return (
                <div
                  key={ti.id}
                  className={`group flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 border-2
                    ${ti.is_packed
                      ? 'bg-muted/30 border-transparent opacity-60 hover:opacity-100'
                      : 'bg-card border-border shadow-sm hover:border-primary/50 hover:shadow-md'}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="pointer-events-none p-1 cursor-pointer"
                    onClick={(e) => togglePacked(ti.id!, ti.is_packed, e)}
                  >
                    <Checkbox
                      checked={ti.is_packed}
                      className={`w-6 h-6 rounded-md transition-all ${ti.is_packed ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500' : ''}`}
                    />
                  </div>

                  <div
                    className="flex-1 overflow-hidden cursor-pointer"
                    onClick={(e) => togglePacked(ti.id!, ti.is_packed, e)}
                  >
                    <span className={`block font-extrabold text-lg transition-all duration-500 truncate
                      ${ti.is_packed ? 'line-through text-muted-foreground' : 'text-foreground group-hover:translate-x-1'}`}>
                      {itemDetail?.name ?? "Unknown Item"}
                    </span>
                  </div>

                  {showQty && !ti.is_packed && (
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => changeQuantity(ti.id!, ti.quantity!, -1)}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 font-bold text-base flex items-center justify-center transition-colors leading-none"
                      >−</button>
                      <span className="w-7 text-center font-extrabold text-base">{ti.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(ti.id!, ti.quantity!, 1)}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 font-bold text-base flex items-center justify-center transition-colors leading-none"
                      >+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
