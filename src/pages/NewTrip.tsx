import { useState, useEffect } from "react";
import { fetchTags, createTrip } from "../lib/db";
import type { Tag } from "../lib/schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { useNavigate } from "react-router-dom";

export default function NewTrip() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedTemp, setSelectedTemp] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTags().then(setTags);
  }, []);

  const temperatures = tags.filter(t => t.type === 'temperature');
  const activities = tags.filter(t => t.type === 'activity');

  const toggleActivity = (name: string) => {
    if (selectedActivities.includes(name)) {
      setSelectedActivities(selectedActivities.filter(a => a !== name));
    } else {
      setSelectedActivities([...selectedActivities, name]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !selectedTemp) return;
    
    setLoading(true);
    const trip = await createTrip({
      name,
      date_start: startDate,
      date_end: endDate || startDate,
      temperature: selectedTemp,
      activities: selectedActivities
    });
    
    // Generate the physical packing list 
    const { generateListForTrip } = await import("../lib/db");
    await generateListForTrip(trip.id, [selectedTemp, ...selectedActivities]);

    navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Trip</h1>
        <p className="text-muted-foreground mt-1">Tell us about your trip to generate the perfect packing list.</p>
      </div>
      <Card className="shadow-md">
        <form onSubmit={handleCreate}>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="tripName" className="text-sm font-medium">Destination / Trip Name</label>
              <Input id="tripName" required placeholder="e.g. Summer in Spain" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                 <Input id="startDate" required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
               </div>
               <div className="space-y-2">
                 <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                 <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-sm font-medium block">Expected Temperature</label>
               <div className="flex flex-wrap gap-3">
                 {temperatures.map(t => (
                   <div 
                     key={t.id} 
                     onClick={() => setSelectedTemp(t.name)}
                     className={`px-4 py-2 border rounded-md cursor-pointer text-sm font-medium transition-colors ${selectedTemp === t.name ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                   >
                     {t.name}
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-sm font-medium block">Planned Activities</label>
               <div className="flex flex-wrap gap-3">
                 {activities.map(t => (
                   <div 
                     key={t.id} 
                     onClick={() => toggleActivity(t.name)}
                     className={`px-4 py-2 border rounded-md cursor-pointer text-sm font-medium transition-colors ${selectedActivities.includes(t.name) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                   >
                     {t.name}
                   </div>
                 ))}
               </div>
            </div>

          </CardContent>
          <CardFooter className="bg-muted/30 pt-4 flex justify-end">
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Creating..." : "Generate Packing List"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
