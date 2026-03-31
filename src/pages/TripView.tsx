import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTrip, fetchTripItems, fetchItems, updateTripItemStatus } from "../lib/db";
import type { Trip, TripItem, Item } from "../lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function TripView() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [id]);

  const togglePacked = async (tripItemId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, is_packed: !currentStatus } : ti));
    await updateTripItemStatus(tripItemId, !currentStatus);
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
        
        <div className="mt-8">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>Packing Progress</span>
            <span>{packedCount} / {totalCount} items</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your Packing List</CardTitle>
        </CardHeader>
        <CardContent>
          {tripItems.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">
               No items matched your trip activities. Start by adding items to your Inventory and tagging them!
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
