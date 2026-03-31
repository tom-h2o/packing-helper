import { useEffect, useState } from "react";
import { fetchCategories, fetchTags, fetchItems, seedDefaultData } from "../lib/db";
import type { Category, Item, Tag } from "../lib/schema";
import { Button } from "../components/ui/button";
import { Loader2, Sparkles, Map, Thermometer, Folder } from "lucide-react";

export default function Inventory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, i, t] = await Promise.all([fetchCategories(), fetchItems(), fetchTags()]);
      setCategories(c);
      setItems(i);
      setTags(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    await seedDefaultData();
    await loadData();
    setSeeding(false);
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" /></div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-r from-primary/10 via-background to-background p-10 rounded-[2.5rem] border border-primary/10 shadow-lg relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Inventory Manager</h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl">Keep track of your gear, manage categories, and configure dynamic tags to automate your packing.</p>
        </div>
        {items.length === 0 && (
          <Button onClick={handleSeed} disabled={seeding} size="lg" className="relative z-10 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform h-14 px-8 text-base font-bold border border-white/20">
            {seeding ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <Sparkles className="w-5 h-5 mr-3" />}
            {seeding ? "Generating..." : "Initialize Demo Data"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Categories */}
        <div className="glass-card p-8 rounded-[2.5rem] flex flex-col h-[450px]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 bg-indigo-500/10 rounded-2xl shadow-inner"><Folder className="w-6 h-6 text-indigo-500" /></div>
            <h2 className="text-2xl font-extrabold">Categories</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-3 space-y-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {categories.length === 0 ? <p className="text-muted-foreground font-medium text-center py-12">No categories found.</p> : (
               categories.map(c => (
                <div key={c.id} className="font-extrabold px-6 py-4 bg-muted/40 hover:bg-muted/80 transition-colors rounded-2xl border border-white/20 dark:border-white/5 flex gap-4 items-center shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
                  {c.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card p-8 rounded-[2.5rem] flex flex-col h-[450px]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 bg-orange-500/10 rounded-2xl shadow-inner"><Map className="w-6 h-6 text-orange-500" /></div>
            <h2 className="text-2xl font-extrabold">Trip Tags</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {tags.length === 0 ? <p className="text-muted-foreground font-medium text-center py-12">No tags found.</p> : (
              <div className="flex flex-wrap gap-3 content-start">
                {tags.map(t => (
                  <span key={t.id} className="px-5 py-2.5 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-colors text-primary rounded-xl text-sm font-extrabold border border-primary/20 shadow-sm flex items-center gap-2 cursor-default">
                    {t.type === 'temperature' ? <Thermometer className="w-4 h-4 opacity-80"/> : <Map className="w-4 h-4 opacity-80"/>}
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="glass-card p-8 rounded-[2.5rem] flex flex-col h-[450px] md:col-span-2 lg:col-span-1 border-primary/20 shadow-2xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl shadow-inner"><Sparkles className="w-6 h-6 text-emerald-500" /></div>
            <h2 className="text-2xl font-extrabold">Total Gear</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-3 relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 content-start [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
             {items.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground font-medium col-span-full">
                  <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center"><Sparkles className="w-8 h-8 opacity-50"/></div>
                  <p>You don't have any items yet.<br/> Add some gear to get started!</p>
                </div>
              ) : (
                items.map(i => (
                  <div key={i.id} className="font-extrabold px-5 py-3.5 bg-card/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 shadow-sm flex items-center gap-4 text-sm hover:scale-[1.02] transition-transform cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] flex-shrink-0"></div>
                    <span className="truncate flex-1">{i.name}</span>
                  </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
