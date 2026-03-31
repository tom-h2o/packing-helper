import { useState, useEffect } from "react";
import { fetchTags, createTrip } from "../lib/db";
import type { Tag } from "../lib/schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import { Thermometer, MapPin, Sparkles, Plus, Calendar } from "lucide-react";

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
    
    const { generateListForTrip } = await import("../lib/db");
    await generateListForTrip(trip.id, [selectedTemp, ...selectedActivities]);

    navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center md:text-left mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Create New Trip</h1>
        <p className="text-muted-foreground text-lg font-medium max-w-2xl">Shape your journey perfectly. Tell us where you are going, and we will automatically assemble the essential gear.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-12">
        <div className="glass-card p-10 md:p-14 rounded-[3rem] relative overflow-hidden shadow-2xl shadow-primary/5">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          
           <div className="relative z-10 space-y-10">
              {/* Destination Section */}
              <div className="space-y-4">
                <label htmlFor="tripName" className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                  <div className="p-2 bg-primary/10 rounded-xl"><MapPin className="w-5 h-5 text-primary" /></div>
                  Destination / Trip Name
                </label>
                <Input 
                  id="tripName" 
                  required 
                  placeholder="e.g. Summer in Spain" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="h-16 text-lg px-6 rounded-2xl bg-card border-none ring-2 ring-primary/10 focus-visible:ring-primary/50 shadow-inner"
                />
              </div>

              {/* Dates Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label htmlFor="startDate" className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                    <div className="p-2 bg-emerald-500/10 rounded-xl"><Calendar className="w-5 h-5 text-emerald-500" /></div>
                    Start Date
                  </label>
                  <Input 
                    id="startDate" 
                    required 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="h-16 text-lg px-6 rounded-2xl bg-card border-none ring-2 ring-emerald-500/10 focus-visible:ring-emerald-500/50 shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <label htmlFor="endDate" className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                    <div className="p-2 bg-emerald-500/10 rounded-xl"><Calendar className="w-5 h-5 text-emerald-500" /></div>
                    End Date
                  </label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="h-16 text-lg px-6 rounded-2xl bg-card border-none ring-2 ring-emerald-500/10 focus-visible:ring-emerald-500/50 shadow-inner"
                  />
                </div>
              </div>
           </div>
        </div>

        {/* Tags Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10 rounded-[2.5rem] shadow-xl shadow-orange-500/5 border-orange-500/10 flex flex-col">
               <label className="flex items-center gap-3 text-xl font-extrabold text-foreground mb-6">
                  <div className="p-2 bg-orange-500/10 rounded-xl"><Thermometer className="w-5 h-5 text-orange-500" /></div>
                  Expected Temperature
               </label>
               <div className="flex flex-wrap gap-3 mt-auto">
                 {temperatures.map(t => (
                   <button 
                     type="button"
                     key={t.id} 
                     onClick={() => setSelectedTemp(t.name)}
                     className={`px-5 py-3 rounded-2xl cursor-pointer text-base font-extrabold transition-all border-2 
                       ${selectedTemp === t.name 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30 scale-105' 
                          : 'bg-card/50 border-transparent hover:bg-orange-500/10 hover:border-orange-500/20 text-muted-foreground'}`}
                   >
                     {t.name}
                   </button>
                 ))}
               </div>
            </div>

            <div className="glass-card p-10 rounded-[2.5rem] shadow-xl shadow-fuchsia-500/5 border-fuchsia-500/10 flex flex-col">
               <label className="flex items-center gap-3 text-xl font-extrabold text-foreground mb-6">
                  <div className="p-2 bg-fuchsia-500/10 rounded-xl"><Sparkles className="w-5 h-5 text-fuchsia-500" /></div>
                  Planned Activities
               </label>
               <div className="flex flex-wrap gap-3 mt-auto">
                 {activities.map(t => (
                   <button 
                     type="button"
                     key={t.id} 
                     onClick={() => toggleActivity(t.name)}
                     className={`px-5 py-3 rounded-2xl cursor-pointer text-base font-extrabold transition-all border-2 
                       ${selectedActivities.includes(t.name) 
                          ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/30 scale-105' 
                          : 'bg-card/50 border-transparent hover:bg-fuchsia-500/10 hover:border-fuchsia-500/20 text-muted-foreground'}`}
                   >
                     {t.name}
                   </button>
                 ))}
               </div>
            </div>
        </div>

        <div className="pt-6 flex justify-end">
          <Button type="submit" disabled={loading} size="lg" className="h-16 px-10 rounded-full text-lg font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform">
            {loading ? "Creating..." : <><Plus className="w-6 h-6 mr-2"/> Generate Packing List</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
