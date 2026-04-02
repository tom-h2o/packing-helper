import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchTrip, fetchTripItems, fetchItems, fetchTags,
  updateTripItemStatus, updateTripItemQuantity, updateTripItemNote,
  addItemToTrip, addExistingItemToTrip, removeTripItem,
  updateTrip, archiveTrip, duplicateTrip, reorderTripItems,
  generateListForTrip,
} from "../lib/db";
import { generatePackingSuggestions } from "../lib/ai";
import type { Trip, TripItem, Item, Tag } from "../lib/schema";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calendar } from "../components/ui/calendar";
import { CountryCombobox } from "../components/ui/country-combobox";
import {
  Loader2, Sparkles, Plus, PlaneTakeoff, CheckCircle2, ChevronRight,
  Luggage, Pencil, Archive, ArchiveRestore, Copy, X, Check,
  GripVertical, MessageSquare, Thermometer, Folder, Trash2,
  ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { getFlagEmoji } from "../lib/countries";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Trip Edit Drawer ───────────────────────────────────────────────────────────

function TripEditDrawer({
  trip,
  tags,
  onClose,
  onSave,
}: {
  trip: Trip;
  tags: Tag[];
  onClose: () => void;
  onSave: (data: Partial<Omit<Trip, "id" | "user_id">>) => void;
}) {
  const [name, setName] = useState(trip.name);
  const [country, setCountry] = useState(trip.country ?? "");
  const [description, setDescription] = useState(trip.description ?? "");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    trip.date_start ? { from: new Date(trip.date_start + "T00:00:00"), to: new Date(trip.date_end + "T00:00:00") } : undefined
  );
  const [selectedTemp, setSelectedTemp] = useState(trip.temperature);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(trip.activities);

  const temperatures = tags.filter(t => t.type === 'temperature');
  const activities = tags.filter(t => t.type === 'activity');

  const toggleActivity = (id: string) =>
    setSelectedActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const handleSave = () => {
    if (!name.trim() || !dateRange?.from || !selectedTemp) return;
    onSave({
      name: name.trim(),
      country: country || undefined,
      description: description || undefined,
      date_start: format(dateRange.from, "yyyy-MM-dd"),
      date_end: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(dateRange.from, "yyyy-MM-dd"),
      temperature: selectedTemp,
      activities: selectedActivities,
    });
  };

  const dateLabel = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
    : dateRange?.from ? format(dateRange.from, "MMM d, yyyy") : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl"><Pencil className="w-5 h-5 text-primary" /></div>
            <h2 className="text-xl font-extrabold">Edit Trip</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Country */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Country</label>
            <CountryCombobox value={country} onChange={setCountry} />
          </div>

          {/* Name */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Trip Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-2xl px-5 text-base" />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes..."
              className="w-full min-h-[80px] rounded-2xl px-5 py-3 text-sm bg-background border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Travel Dates</label>
              {dateLabel && <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-xl">{dateLabel}</span>}
            </div>
            <div className="flex justify-center overflow-x-auto">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="p-0" />
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              <Thermometer className="w-4 h-4 text-orange-500" /> Temperature
            </label>
            <div className="flex flex-wrap gap-2">
              {temperatures.map(t => (
                <button key={t.id} type="button" onClick={() => setSelectedTemp(t.id!)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all
                    ${selectedTemp === t.id ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-card/50 border-border hover:border-orange-500/30 text-muted-foreground'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-fuchsia-500" /> Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {activities.map(t => (
                <button key={t.id} type="button" onClick={() => toggleActivity(t.id!)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all
                    ${selectedActivities.includes(t.id!) ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-md' : 'bg-card/50 border-border hover:border-fuchsia-500/30 text-muted-foreground'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border">
          <Button onClick={handleSave} disabled={!name.trim() || !dateRange?.from || !selectedTemp} className="w-full h-12 rounded-2xl font-bold">
            <Check className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Quick-Add Drawer ───────────────────────────────────────────────────────────

function QuickAddDrawer({
  allItems,
  tripItemIds,
  tags,
  onClose,
  onAdd,
}: {
  allItems: Item[];
  tripItemIds: Set<string>;
  tags: Tag[];
  onClose: () => void;
  onAdd: (itemId: string, quantity?: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("");
  const tagMap = new Map(tags.map(t => [t.id!, t]));
  const categories = tags.filter(t => t.type === 'category');

  const filtered = allItems.filter(item => {
    if (tripItemIds.has(item.id!)) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCat && !item.tags.includes(selectedCat)) return false;
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl"><Plus className="w-5 h-5 text-emerald-500" /></div>
            <h2 className="text-xl font-extrabold">Add Item</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pt-5 pb-4 space-y-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gear..." className="pl-10 h-10 rounded-2xl" autoFocus />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setSelectedCat("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${!selectedCat ? 'bg-primary text-primary-foreground border-transparent' : 'border-border hover:bg-muted'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c.id} type="button" onClick={() => setSelectedCat(selectedCat === c.id! ? "" : c.id!)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedCat === c.id! ? 'bg-indigo-500 text-white border-transparent' : 'border-border hover:bg-muted'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 font-medium">No items found.</p>
          ) : filtered.map(item => {
            const cats = item.tags.map(id => tagMap.get(id)).filter(t => t?.type === 'category').map(t => t!.name);
            return (
              <button key={item.id} type="button" onClick={() => onAdd(item.id!, item.quantity_relevant ? item.default_quantity : undefined)}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted/80 transition-colors text-left group">
                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <span className="font-bold text-sm block truncate">{item.name}</span>
                  {cats.length > 0 && <span className="text-xs text-muted-foreground">{cats.join(', ')}</span>}
                </div>
                {item.quantity_relevant && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">×{item.default_quantity ?? 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Sortable Checklist Item ────────────────────────────────────────────────────

function SortableTripItem({
  ti,
  itemDetail,
  onToggle,
  onQuantityChange,
  onNoteChange,
  onRemove,
}: {
  ti: TripItem;
  itemDetail: Item | undefined;
  onToggle: () => void;
  onQuantityChange: (delta: number) => void;
  onNoteChange: (note: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ti.id! });
  const [showNote, setShowNote] = useState(!!ti.note);
  const [noteValue, setNoteValue] = useState(ti.note ?? "");
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const handleNoteChange = (val: string) => {
    setNoteValue(val);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => onNoteChange(val), 600);
  };

  const showQty = itemDetail?.quantity_relevant && ti.quantity !== undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col rounded-3xl border-2 transition-all duration-200
        ${ti.is_packed ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card border-border shadow-sm hover:border-primary/40 hover:shadow-md'}
        ${isDragging ? 'shadow-xl z-10' : ''}`}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Checkbox */}
        <div className="cursor-pointer p-0.5 shrink-0" onClick={onToggle}>
          <Checkbox
            checked={ti.is_packed}
            className={`w-5 h-5 rounded-md transition-all ${ti.is_packed ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500' : ''}`}
          />
        </div>

        {/* Name */}
        <div className="flex-1 overflow-hidden cursor-pointer" onClick={onToggle}>
          <span className={`block font-extrabold text-base truncate transition-all duration-300 ${ti.is_packed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {itemDetail?.name ?? "Unknown Item"}
          </span>
          {ti.note && !showNote && (
            <span className="text-xs text-muted-foreground truncate block mt-0.5 italic">{ti.note}</span>
          )}
        </div>

        {/* Quantity */}
        {showQty && !ti.is_packed && (
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => onQuantityChange(-1)} className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/70 font-bold flex items-center justify-center text-sm transition-colors">−</button>
            <span className="w-6 text-center font-extrabold text-sm">{ti.quantity}</span>
            <button type="button" onClick={() => onQuantityChange(1)} className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/70 font-bold flex items-center justify-center text-sm transition-colors">+</button>
          </div>
        )}

        {/* Note toggle */}
        {!ti.is_packed && (
          <button type="button" onClick={() => setShowNote(s => !s)}
            className={`p-1.5 rounded-xl transition-colors shrink-0 ${showNote || ti.note ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'}`}>
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Remove */}
        <button type="button" onClick={onRemove}
          className="p-1.5 rounded-xl text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-red-500 hover:bg-red-500/10 transition-all shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {showNote && !ti.is_packed && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            value={noteValue}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder="Add a note (e.g. borrow from dad)..."
            className="w-full text-xs px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TripView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadTripData = () => {
    if (!id) return;
    Promise.all([fetchTrip(id), fetchTripItems(id), fetchItems(), fetchTags()])
      .then(([t, ti, i, tgs]) => {
        setTrip(t);
        const sorted = [...ti].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setTripItems(sorted);
        setAllItems(i);
        setTags(tgs);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTripData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tagMap = new Map(tags.map(t => [t.id!, t]));

  const togglePacked = async (tripItemId: string, currentStatus: boolean) => {
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, is_packed: !currentStatus } : ti));
    await updateTripItemStatus(tripItemId, !currentStatus);
  };

  const changeQuantity = async (tripItemId: string, current: number, delta: number) => {
    const next = Math.max(1, current + delta);
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, quantity: next } : ti));
    await updateTripItemQuantity(tripItemId, next);
  };

  const changeNote = async (tripItemId: string, note: string) => {
    setTripItems(prev => prev.map(ti => ti.id === tripItemId ? { ...ti, note } : ti));
    await updateTripItemNote(tripItemId, note);
  };

  const handleRemoveItem = async (tripItemId: string) => {
    setTripItems(prev => prev.filter(ti => ti.id !== tripItemId));
    await removeTripItem(tripItemId);
  };

  const handleSuggest = async () => {
    if (!trip) return;
    setAiLoading(true);
    const diffDays = Math.round((new Date(trip.date_end).getTime() - new Date(trip.date_start).getTime()) / (1000 * 3600 * 24)) || 1;
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

  const handleQuickAdd = async (itemId: string, quantity?: number) => {
    if (!id) return;
    await addExistingItemToTrip(id, itemId, quantity);
    setQuickAddOpen(false);
    loadTripData();
  };

  const handleSaveEdit = async (data: Partial<Omit<Trip, "id" | "user_id">>) => {
    if (!id) return;
    await updateTrip(id, data);
    // If temperature or activities changed, regenerate list
    const tempChanged = data.temperature && data.temperature !== trip?.temperature;
    const activitiesChanged = JSON.stringify(data.activities) !== JSON.stringify(trip?.activities);
    if (tempChanged || activitiesChanged) {
      const newTags = [data.temperature ?? trip!.temperature, ...(data.activities ?? trip!.activities)];
      await generateListForTrip(id, newTags);
    }
    setEditOpen(false);
    loadTripData();
  };

  const handleDuplicate = async () => {
    if (!id) return;
    const newId = await duplicateTrip(id);
    navigate(`/trip/${newId}`);
  };

  const handleArchiveToggle = async () => {
    if (!id || !trip) return;
    await archiveTrip(id, !trip.archived);
    setConfirmArchive(false);
    loadTripData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tripItems.findIndex(ti => ti.id === active.id);
    const newIndex = tripItems.findIndex(ti => ti.id === over.id);
    const reordered = arrayMove(tripItems, oldIndex, newIndex);
    setTripItems(reordered);
    await reorderTripItems(reordered.map((ti, i) => ({ id: ti.id!, order: i })));
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
  const tripItemIds = new Set(tripItems.map(ti => ti.item_id));

  // Group by category tag
  const categoryTags = tags.filter(t => t.type === 'category');
  const grouped: { label: string; color: string; items: TripItem[] }[] = [];

  if (groupByCategory && categoryTags.length > 0) {
    for (const cat of categoryTags) {
      const catItems = tripItems.filter(ti => {
        const item = allItems.find(i => i.id === ti.item_id);
        return item?.tags.includes(cat.id!);
      });
      if (catItems.length > 0) grouped.push({ label: cat.name, color: 'indigo', items: catItems });
    }
    const uncategorised = tripItems.filter(ti => {
      const item = allItems.find(i => i.id === ti.item_id);
      return !item || !categoryTags.some(c => item.tags.includes(c.id!));
    });
    if (uncategorised.length > 0) grouped.push({ label: 'Other', color: 'zinc', items: uncategorised });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">

      {/* Header */}
      <div className="glass-card p-10 md:p-14 rounded-[3rem] shadow-xl relative overflow-hidden">
        {flagEmoji && (
          <div className="absolute top-4 right-8 text-[9rem] leading-none select-none opacity-15 pointer-events-none">{flagEmoji}</div>
        )}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                {flagEmoji ? <span className="text-2xl leading-none">{flagEmoji}</span> : <PlaneTakeoff className="text-primary w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{trip.name}</h1>
                  {trip.archived && (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-bold border border-amber-500/20">Archived</span>
                  )}
                </div>
                {trip.description && <p className="text-muted-foreground text-sm mt-1 font-medium">{trip.description}</p>}
              </div>
            </div>

            <p className="text-muted-foreground font-bold flex flex-wrap items-center gap-2 mb-6">
              {new Date(trip.date_start + "T00:00:00").toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              <ChevronRight className="w-4 h-4 opacity-50" />
              {new Date(trip.date_end + "T00:00:00").toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-extrabold">
                {tagMap.get(trip.temperature)?.name ?? trip.temperature}
              </span>
              {trip.activities.map(act => (
                <span key={act} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-xl text-xs font-extrabold shadow-sm">
                  {tagMap.get(act)?.name ?? act}
                </span>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm font-extrabold mb-2">
                <span>Packing Progress</span>
                <span className="text-primary">{progress}% ({packedCount}/{totalCount})</span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-3.5 overflow-hidden border border-border shadow-inner relative">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0 flex-wrap">
            <Button onClick={handleSuggest} disabled={aiLoading} size="lg"
              className="rounded-full shadow-xl shadow-fuchsia-500/20 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-extrabold h-12 px-6 transition-transform hover:scale-105 group">
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />}
              {aiLoading ? "Analyzing..." : "Ask AI"}
            </Button>
            <button type="button" onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border border-border hover:bg-muted transition-colors">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button type="button" onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border border-border hover:bg-muted transition-colors">
              <Copy className="w-4 h-4" /> Duplicate
            </button>
            <button type="button" onClick={() => setConfirmArchive(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-colors
                ${trip.archived ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10' : 'border-border hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30'}`}>
              {trip.archived ? <><ArchiveRestore className="w-4 h-4" /> Restore</> : <><Archive className="w-4 h-4" /> Archive</>}
            </button>
          </div>
        </div>
      </div>

      {/* Archive confirm */}
      {confirmArchive && (
        <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <p className="font-bold text-sm">{trip.archived ? "Restore this trip to your active list?" : "Archive this trip? It will be hidden from the dashboard."}</p>
          <div className="flex gap-2 shrink-0">
            <Button onClick={handleArchiveToggle} className="h-9 px-5 rounded-xl text-sm bg-amber-500 hover:bg-amber-600 text-white border-none">Confirm</Button>
            <button type="button" onClick={() => setConfirmArchive(false)} className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass-card bg-fuchsia-500/5 border-fuchsia-500/20 p-8 rounded-[2.5rem] shadow-lg animate-in slide-in-from-top-4 duration-500 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-fuchsia-500/20 rounded-xl relative">
              <Sparkles className="w-5 h-5 text-fuchsia-600 absolute animate-ping opacity-75" />
              <Sparkles className="w-5 h-5 text-fuchsia-600 relative" />
            </div>
            <h2 className="text-xl font-extrabold">AI Suggestions</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {suggestions.map(s => (
              <Button key={s} onClick={() => addSuggestionToTrip(s)} variant="outline"
                className="rounded-full bg-background border-fuchsia-500/30 hover:bg-fuchsia-500 hover:text-white hover:border-fuchsia-500 transition-all font-bold h-10 px-5 group">
                <Plus className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="glass-card p-8 md:p-10 rounded-[3rem] shadow-xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h2 className="text-2xl font-extrabold flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
            Checklist
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setGroupByCategory(g => !g)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors
                ${groupByCategory ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'border-border hover:bg-muted text-muted-foreground'}`}>
              <Folder className="w-3.5 h-3.5" /> {groupByCategory ? 'Grouped' : 'Group by category'}
            </button>
            <button type="button" onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          </div>
        </div>

        {tripItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mb-6">
              <Luggage className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-lg font-bold">Your bag is completely empty.</p>
            <p className="text-muted-foreground/60 font-medium">Use "Ask AI" or "Add item" to build your list!</p>
          </div>
        ) : groupByCategory && grouped.length > 0 ? (
          // Grouped view — no DnD across groups for simplicity
          <div className="space-y-8">
            {grouped.map(group => (
              <CategoryGroup key={group.label} group={group} allItems={allItems}
                onToggle={togglePacked} onQuantityChange={changeQuantity}
                onNoteChange={changeNote} onRemove={handleRemoveItem} />
            ))}
          </div>
        ) : (
          // Flat DnD view
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tripItems.map(ti => ti.id!)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {tripItems.map(ti => (
                  <SortableTripItem
                    key={ti.id}
                    ti={ti}
                    itemDetail={allItems.find(i => i.id === ti.item_id)}
                    onToggle={() => togglePacked(ti.id!, ti.is_packed)}
                    onQuantityChange={(delta) => changeQuantity(ti.id!, ti.quantity!, delta)}
                    onNoteChange={(note) => changeNote(ti.id!, note)}
                    onRemove={() => handleRemoveItem(ti.id!)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Drawers */}
      {editOpen && (
        <TripEditDrawer trip={trip} tags={tags} onClose={() => setEditOpen(false)} onSave={handleSaveEdit} />
      )}
      {quickAddOpen && (
        <QuickAddDrawer
          allItems={allItems}
          tripItemIds={tripItemIds}
          tags={tags}
          onClose={() => setQuickAddOpen(false)}
          onAdd={handleQuickAdd}
        />
      )}
    </div>
  );
}

// ── Category Group (grouped, non-DnD view) ────────────────────────────────────

function CategoryGroup({
  group, allItems, onToggle, onQuantityChange, onNoteChange, onRemove,
}: {
  group: { label: string; color: string; items: TripItem[] };
  allItems: Item[];
  onToggle: (id: string, status: boolean) => void;
  onQuantityChange: (id: string, qty: number, delta: number) => void;
  onNoteChange: (id: string, note: string) => void;
  onRemove: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const packed = group.items.filter(ti => ti.is_packed).length;

  return (
    <div>
      <button type="button" onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 mb-3 w-full text-left group">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
          <Folder className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <span className="font-extrabold text-sm text-foreground">{group.label}</span>
        <span className="text-xs text-muted-foreground font-bold">({packed}/{group.items.length})</span>
        <span className="ml-auto text-muted-foreground">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2 pl-2 border-l-2 border-indigo-500/20">
          {group.items.map(ti => {
            const itemDetail = allItems.find(i => i.id === ti.item_id);
            return (
              <SortableTripItem
                key={ti.id}
                ti={ti}
                itemDetail={itemDetail}
                onToggle={() => onToggle(ti.id!, ti.is_packed)}
                onQuantityChange={(delta) => onQuantityChange(ti.id!, ti.quantity!, delta)}
                onNoteChange={(note) => onNoteChange(ti.id!, note)}
                onRemove={() => onRemove(ti.id!)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
