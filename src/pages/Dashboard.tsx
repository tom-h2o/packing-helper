import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export default function Dashboard() {
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    // We will load trips here
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Trips</h1>
          <p className="text-muted-foreground mt-1">Manage your packing lists for upcoming adventures.</p>
        </div>
        <Link to="/new-trip">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Trip
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder Trips */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Weekend Camping</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Oct 12 - Oct 14 • Mild • Camping</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
