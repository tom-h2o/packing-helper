import { useState, useEffect } from "react";
import { fetchTags, createTrip } from "../lib/db";
import type { Tag } from "../lib/schema";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import { CountryCombobox } from "../components/ui/country-combobox";
import { useNavigate } from "react-router-dom";
import { Thermometer, MapPin, Sparkles, Plus, Globe, FileText, CalendarDays } from "lucide-react";
import { getFlagEmoji } from "../lib/countries";

export default function NewTrip() {
  const [country, setCountry] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
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

  const toggleActivity = (id: string) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dateRange?.from || !selectedTemp) return;

    setLoading(true);
    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : startDate;

    const trip = await createTrip({
      name,
      country: country || undefined,
      description: description || undefined,
      date_start: startDate,
      date_end: endDate,
      temperature: selectedTemp,
      activities: selectedActivities
    });

    const { generateListForTrip } = await import("../lib/db");
    await generateListForTrip(trip.id, [selectedTemp, ...selectedActivities]);

    navigate(`/trip/${trip.id}`);
  };

  const dateLabel = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
    : dateRange?.from
      ? `${format(dateRange.from, "MMM d, yyyy")} — pick end date`
      : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center md:text-left mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Create New Trip</h1>
        <p className="text-muted-foreground text-lg font-medium max-w-2xl">Shape your journey perfectly. Tell us where you are going, and we will automatically assemble the essential gear.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">

        {/* Top row: destination + name + description */}
        <div className="glass-card p-10 md:p-14 rounded-[3rem] relative overflow-hidden shadow-2xl shadow-primary/5 space-y-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-10">
            {/* Country */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                <div className="p-2 bg-blue-500/10 rounded-xl"><Globe className="w-5 h-5 text-blue-500" /></div>
                Country
                {country && <span className="text-2xl leading-none">{getFlagEmoji(country)}</span>}
              </label>
              <CountryCombobox value={country} onChange={setCountry} />
            </div>

            {/* Trip Name */}
            <div className="space-y-4">
              <label htmlFor="tripName" className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                <div className="p-2 bg-primary/10 rounded-xl"><MapPin className="w-5 h-5 text-primary" /></div>
                Trip Name
              </label>
              <Input
                id="tripName"
                required
                placeholder="e.g. Summer in Barcelona"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="off"
                name="trip-destination-name"
                className="h-16 text-lg px-6 rounded-2xl bg-card border-none ring-2 ring-primary/10 focus-visible:ring-primary/50 shadow-inner"
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <label htmlFor="tripDesc" className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                <div className="p-2 bg-violet-500/10 rounded-xl"><FileText className="w-5 h-5 text-violet-500" /></div>
                Description
                <span className="text-sm font-medium text-muted-foreground ml-1">(optional)</span>
              </label>
              <Textarea
                id="tripDesc"
                placeholder="e.g. Short trip with Mum, festival with the boys..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                autoComplete="off"
                className="text-base px-6 py-4 rounded-2xl bg-card border-none ring-2 ring-violet-500/10 focus-visible:ring-violet-500/50 shadow-inner min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Date Range — inline calendar */}
        <div className="glass-card p-10 md:p-14 rounded-[3rem] relative overflow-hidden shadow-2xl shadow-emerald-500/5 space-y-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CalendarDays className="w-5 h-5 text-emerald-500" />
                </div>
                Travel Dates
              </label>
              {dateLabel && (
                <span className="text-base font-bold text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                  {dateLabel}
                </span>
              )}
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="p-0"
              />
            </div>
          </div>
        </div>

        {/* Temperature + Activities */}
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
                  onClick={() => setSelectedTemp(t.id!)}
                  className={`px-5 py-3 rounded-2xl cursor-pointer text-base font-extrabold transition-all border-2
                    ${selectedTemp === t.id
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
                  onClick={() => toggleActivity(t.id!)}
                  className={`px-5 py-3 rounded-2xl cursor-pointer text-base font-extrabold transition-all border-2
                    ${selectedActivities.includes(t.id!)
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
          <Button
            type="submit"
            disabled={loading || !dateRange?.from || !selectedTemp}
            size="lg"
            className="h-16 px-10 rounded-full text-lg font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform"
          >
            {loading ? "Creating..." : <><Plus className="w-6 h-6 mr-2" /> Generate Packing List</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
