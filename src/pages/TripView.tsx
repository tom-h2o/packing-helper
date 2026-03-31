import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTrip, fetchTripItems, fetchItems, updateTripItemStatus, addItemToTrip } from "../lib/db";
import { generatePackingSuggestions } from "../lib/ai";
import type { Trip, TripItem, Item } from "../lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Loader2, Sparkles, Plus } from "lucide-react";

export default function TripView() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const loadTripData = () => {
    if (!id) return;
    Promise.all([
      fetchTrip(id),
      fetchTripItems(id),
      fetchItems()
    ]).then(([t, ti, i]) => {
      setTrip(t);
      setTripItems(ti);
      setAllItems(i);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadTripData();
  }, [id]);

  const togglePacked = async (tripItemId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, is_packed: !currentStatus } : ti));
    await updateTripItemStatus(tripItemId, !currentStatus);
  };

  const handleSuggest = async () => {
    if (!trip) return;
    setAiLoading(true);
    // calculate days
    const start = new Date(trip.date_start).getTime();
    const end = new Date(trip.date_end).getTime();
    const diffDays = Math.round((end - start) / (1000 * 3600 * 24)) || 1;

    const res = await generatePackingSuggestions(trip.name, diffDays, trip.temperature, trip.activities);
    setSuggestions(res);
    setAiLoading(false);
  };

  const addSuggestionToTrip = async (itemName: string) => {
    if (!trip || !id) return;
    // remove from suggestion list optimistically
    setSuggestions(prev => prev.filter(s => s !== itemName));
    // Add to DB
    await addItemToTrip(id, itemName, trip.temperature);
    // Reload data silently to show it in the main list
    loadTripData();
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!trip) return <div className="p-8 text-center text-muted-foreground">Trip not found.</div>;

  const packedCount = tripItems.filter(ti => ti.is_packed).length;
  const totalCount = tripItems.length;
  const progress = totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">{trip.name}</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          {new Date(trip.date_start).toLocaleDateString()} to {new Date(trip.date_end).toLocaleDateString()}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-2.5 py-1 bg-secondary rounded-md text-xs font-bold">{trip.temperature}</span>
          {trip.activities.map(act => (
            <span key={act} className="px-2.5 py-1 bg-secondary rounded-md text-xs font-bold">{act}</span>
          ))}
        </div>
        
        <div className="mt-8 flex items-end justify-between">
          <div className="w-full mr-12">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span>Packing Progress</span>
              <span>{packedCount} / {totalCount} items</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <Button onClick={handleSuggest} disabled={aiLoading} variant="outline" className="shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
            {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2" />}
            Ask AI
          </Button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader className="pb-3 text-indigo-900 flex flex-row items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">AI Suggestions for {trip.name}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex flex-wrap gap-2">
               {suggestions.map(s => (
                 <Button key={s} onClick={() => addSuggestionToTrip(s)} size="sm" variant="outline" className="rounded-full bg-white border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300">
                   <Plus className="w-3 h-3 mr-1" /> {s}
                 </Button>
               ))}
             </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your Packing List</CardTitle>
        </CardHeader>
        <CardContent>
          {tripItems.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">
               No items matched your trip activities. Ask the AI for suggestions or add items manually to your inventory.
             </p>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {tripItems.map(ti => {
                 const itemDetail = allItems.find(i => i.id === ti.item_id);
                 return (
                   <div 
                     key={ti.id} 
                     className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${ti.is_packed ? 'bg-muted/30 opacity-70' : 'bg-card'}`}
                     onClick={() => togglePacked(ti.id!, ti.is_packed)}
                   >
                      <Checkbox checked={ti.is_packed} onCheckedChange={() => togglePacked(ti.id!, ti.is_packed)} />
                      <div className="flex-1">
                        <span className={`font-medium ${ti.is_packed ? 'line-through text-muted-foreground' : ''}`}>
                          {itemDetail ? itemDetail.name : "Unknown Item"}
                        </span>
                      </div>
                   </div>
                 );
               })}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
