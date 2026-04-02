import { useEffect, useState, useRef } from "react";
import { fetchTags, fetchItems, seedDefaultData, addTag, updateTag, deleteTag, addItem, updateItem, deleteItem } from "../lib/db";
import type { Item, Tag } from "../lib/schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Loader2, Sparkles, Thermometer, Tag as TagIcon, Folder,
  Plus, X, Check, Pencil, Trash2, Package, Hash, ChevronRight,
  ToggleLeft, ToggleRight
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

const TAG_TYPE_META: Record<Tag['type'], { label: string; color: string; icon: React.ReactNode }> = {
  category: {
    label: "Categories",
    color: "indigo",
    icon: <Folder className="w-4 h-4" />,
  },
  activity: {
    label: "Activities",
    color: "fuchsia",
    icon: <Sparkles className="w-4 h-4" />,
  },
  temperature: {
    label: "Temperature",
    color: "orange",
    icon: <Thermometer className="w-4 h-4" />,
  },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; activeBg: string; activeText: string }> = {
  indigo: {
    bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
    text: "text-indigo-500",
    border: "border-indigo-500/20",
    activeBg: "bg-indigo-500",
    activeText: "text-white",
  },
  fuchsia: {
    bg: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20",
    text: "text-fuchsia-500",
    border: "border-fuchsia-500/20",
    activeBg: "bg-fuchsia-500",
    activeText: "text-white",
  },
  orange: {
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
    text: "text-orange-500",
    border: "border-orange-500/20",
    activeBg: "bg-orange-500",
    activeText: "text-white",
  },
};

// ── Tag Group Component ────────────────────────────────────────────────────────

function TagGroup({
  type,
  tags,
  onAdd,
  onRename,
  onDelete,
}: {
  type: Tag['type'];
  tags: Tag[];
  onAdd: (name: string, type: Tag['type']) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TAG_TYPE_META[type];
  const colors = COLOR_CLASSES[meta.color];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed, type);
    setNewName("");
    setAdding(false);
  };

  const handleRename = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  return (
    <div className="glass-card p-8 rounded-[2.5rem] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-${meta.color}-500/10 rounded-2xl shadow-inner ${colors.text}`}>{meta.icon}</div>
          <h2 className="text-xl font-extrabold">{meta.label}</h2>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
            {tags.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="group flex items-center">
            {editingId === tag.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(tag.id!); if (e.key === 'Escape') setEditingId(null); }}
                  className="h-8 w-28 text-sm rounded-lg px-2"
                  autoFocus
                />
                <button type="button" onClick={() => handleRename(tag.id!)} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/40">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${colors.bg} ${colors.text} ${colors.border}`}>
                {tag.name}
                <span className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button type="button" onClick={() => { setEditingId(tag.id!); setEditName(tag.name); }} className="p-0.5 rounded hover:bg-white/20 transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => onDelete(tag.id!)} className="p-0.5 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              </span>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName(""); } }}
              placeholder="Name..."
              className="h-8 w-28 text-sm rounded-lg px-2"
            />
            <button type="button" onClick={handleAdd} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/40">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => { setAdding(false); setNewName(""); }} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Item Drawer ────────────────────────────────────────────────────────────────

function ItemDrawer({
  item,
  tags,
  onClose,
  onSave,
  onDelete,
}: {
  item: Item | null; // null = new item
  tags: Tag[];
  onClose: () => void;
  onSave: (data: Omit<Item, 'id' | 'user_id'>) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(item?.tags ?? []);
  const [quantityRelevant, setQuantityRelevant] = useState(item?.quantity_relevant ?? false);
  const [defaultQuantity, setDefaultQuantity] = useState(item?.default_quantity ?? 1);

  const categories = tags.filter(t => t.type === 'category');
  const activities = tags.filter(t => t.type === 'activity');
  const temperatures = tags.filter(t => t.type === 'temperature');

  const toggleTag = (id: string) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      tags: selectedTags,
      quantity_relevant: quantityRelevant || undefined,
      default_quantity: quantityRelevant ? defaultQuantity : undefined,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-extrabold">{item ? "Edit Item" : "New Item"}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Name */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Item Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rain Jacket"
              className="h-12 rounded-2xl px-5 text-base"
              autoFocus={!item}
            />
          </div>

          {/* Categories */}
          <TagSection
            title="Categories"
            icon={<Folder className="w-4 h-4 text-indigo-500" />}
            tags={categories}
            selected={selectedTags}
            onToggle={toggleTag}
            activeColor="indigo"
          />

          {/* Activities */}
          <TagSection
            title="Activities"
            icon={<Sparkles className="w-4 h-4 text-fuchsia-500" />}
            tags={activities}
            selected={selectedTags}
            onToggle={toggleTag}
            activeColor="fuchsia"
          />

          {/* Temperature */}
          <TagSection
            title="Temperature"
            icon={<Thermometer className="w-4 h-4 text-orange-500" />}
            tags={temperatures}
            selected={selectedTags}
            onToggle={toggleTag}
            activeColor="orange"
          />

          {/* Quantity */}
          <div className="space-y-4">
            <label className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Quantity</label>
            <button
              type="button"
              onClick={() => setQuantityRelevant(q => !q)}
              className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl border-2 transition-all font-bold text-sm
                ${quantityRelevant
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                  : 'border-border bg-card/50 text-muted-foreground hover:border-border/80'}`}
            >
              {quantityRelevant
                ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                : <ToggleLeft className="w-5 h-5" />}
              Quantity-relevant item
              <span className="ml-auto text-xs opacity-70">{quantityRelevant ? "On" : "Off"}</span>
            </button>

            {quantityRelevant && (
              <div className="flex items-center gap-4 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-muted-foreground">Default quantity</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setDefaultQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 font-bold text-lg flex items-center justify-center transition-colors"
                  >−</button>
                  <span className="w-10 text-center font-extrabold text-lg">{defaultQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setDefaultQuantity(q => q + 1)}
                    className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 font-bold text-lg flex items-center justify-center transition-colors"
                  >+</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border flex gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <Button onClick={handleSave} disabled={!name.trim()} className="flex-1 h-12 rounded-2xl font-bold">
            <Check className="w-4 h-4 mr-2" /> {item ? "Save Changes" : "Add Item"}
          </Button>
        </div>
      </div>
    </>
  );
}

function TagSection({
  title, icon, tags, selected, onToggle, activeColor,
}: {
  title: string;
  icon: React.ReactNode;
  tags: Tag[];
  selected: string[];
  onToggle: (id: string) => void;
  activeColor: string;
}) {
  const colors = COLOR_CLASSES[activeColor];
  if (tags.length === 0) return null;
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
        {icon} {title}
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => {
          const active = selected.includes(tag.id!);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id!)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all
                ${active
                  ? `${colors.activeBg} ${colors.activeText} border-transparent shadow-md`
                  : `bg-card/50 border-border hover:${colors.bg} ${colors.text} hover:border-transparent`}`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [drawerItem, setDrawerItem] = useState<Item | null | undefined>(undefined); // undefined = closed, null = new
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [i, t] = await Promise.all([fetchItems(), fetchTags()]);
      setItems(i);
      setTags(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDefaultData();
      await loadData();
    } catch (e) {
      console.error("Seeding failed:", e);
      alert("Error generating data: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSeeding(false);
    }
  };

  const handleAddTag = async (name: string, type: Tag['type']) => {
    await addTag(name, type);
    await loadData();
  };

  const handleRenameTag = async (id: string, name: string) => {
    await updateTag(id, name);
    await loadData();
  };

  const handleDeleteTag = async (id: string) => {
    await deleteTag(id);
    await loadData();
  };

  const handleSaveItem = async (data: Omit<Item, 'id' | 'user_id'>) => {
    if (drawerItem === null) {
      await addItem(data);
    } else if (drawerItem) {
      await updateItem(drawerItem.id!, data);
    }
    setDrawerItem(undefined);
    await loadData();
  };

  const handleDeleteItem = async () => {
    if (!drawerItem?.id) return;
    await deleteItem(drawerItem.id);
    setDrawerItem(undefined);
    await loadData();
  };

  const tagMap = new Map(tags.map(t => [t.id!, t]));

  const filteredItems = searchQuery
    ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const categoryTags = tags.filter(t => t.type === 'category');
  const activityTags = tags.filter(t => t.type === 'activity');
  const temperatureTags = tags.filter(t => t.type === 'temperature');

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 glass-card p-10 rounded-[2.5rem] border border-primary/10 shadow-lg relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Inventory</h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl">Manage your gear, tags, and categories. Everything added here is available when creating a trip.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          {items.length === 0 && (
            <Button onClick={handleSeed} disabled={seeding} size="lg" className="rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform h-14 px-8 text-base font-bold">
              {seeding ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3" />}
              {seeding ? "Generating..." : "Initialize Demo Data"}
            </Button>
          )}
          <Button onClick={() => setDrawerItem(null)} size="lg" className="rounded-full shadow-xl h-14 px-8 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-white border-none">
            <Plus className="w-5 h-5 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Tag Management */}
      <section>
        <h2 className="text-2xl font-extrabold mb-6 px-2 flex items-center gap-3">
          <TagIcon className="w-6 h-6 text-primary" /> Tag Management
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <TagGroup type="category" tags={categoryTags} onAdd={handleAddTag} onRename={handleRenameTag} onDelete={handleDeleteTag} />
          <TagGroup type="activity" tags={activityTags} onAdd={handleAddTag} onRename={handleRenameTag} onDelete={handleDeleteTag} />
          <TagGroup type="temperature" tags={temperatureTags} onAdd={handleAddTag} onRename={handleRenameTag} onDelete={handleDeleteTag} />
        </div>
      </section>

      {/* Gear Items */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2">
          <h2 className="text-2xl font-extrabold flex items-center gap-3">
            <Package className="w-6 h-6 text-emerald-500" /> Gear
            <span className="text-base font-bold text-muted-foreground">({filteredItems.length})</span>
          </h2>
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search gear..."
            className="h-10 w-full sm:w-64 rounded-2xl px-5 text-sm"
          />
        </div>

        {items.length === 0 ? (
          <div className="glass-card py-24 text-center rounded-3xl border-dashed">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold mb-2">No gear yet</h3>
            <p className="text-muted-foreground font-medium mb-6">Add items manually or initialize with demo data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => {
              const itemCats = item.tags
                ?.map(id => tagMap.get(id))
                .filter((t): t is Tag => t?.type === 'category')
                .map(t => t.name) ?? [];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDrawerItem(item)}
                  className="group text-left glass-card p-5 rounded-3xl border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-base leading-tight flex-1">{item.name}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {itemCats.slice(0, 2).map(cat => (
                      <span key={cat} className="text-xs font-bold px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
                        {cat}
                      </span>
                    ))}
                    {item.quantity_relevant && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                        <Hash className="w-3 h-3" />{item.default_quantity ?? 1}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Item Drawer */}
      {drawerItem !== undefined && (
        <ItemDrawer
          item={drawerItem}
          tags={tags}
          onClose={() => setDrawerItem(undefined)}
          onSave={handleSaveItem}
          onDelete={drawerItem ? handleDeleteItem : undefined}
        />
      )}
    </div>
  );
}
