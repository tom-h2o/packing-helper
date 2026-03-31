import { useEffect, useState } from "react";
import { fetchCategories, fetchTags, fetchItems, seedDefaultData } from "../lib/db";
import type { Category, Item, Tag } from "../lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";

export default function Inventory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

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
    await seedDefaultData();
    await loadData();
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Manager</h1>
          <p className="text-muted-foreground mt-1">Manage your items and categories.</p>
        </div>
        {categories.length === 0 && (
          <Button onClick={handleSeed}>Initialize Demo Data</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? <p className="text-muted-foreground text-sm">No categories found.</p> : (
              <ul className="space-y-2">
                {categories.map(c => (
                  <li key={c.id} className="font-medium p-2 bg-secondary/50 rounded-md border text-sm">{c.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
             {tags.length === 0 ? <p className="text-muted-foreground text-sm">No tags found.</p> : (
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t.id} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>You don't have any items yet. Add some gear to get started!</p>
              <Button variant="outline" className="mt-4">Add Item</Button>
            </div>
          ) : (
             <ul className="space-y-2">
               {items.map(i => <li key={i.id}>{i.name}</li>)}
             </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
