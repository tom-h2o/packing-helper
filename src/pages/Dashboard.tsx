import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { fetchTrips } from "../lib/db";
import type { Trip } from "../lib/schema";
import { Button } from "../components/ui/button";
import { Plus, Plane } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export default function Dashboard() {
  const user = auth.currentUser;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTrips().then(data => {
      setTrips(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading trips...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
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

      {trips.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Plane className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No trips planned yet</h3>
            <p className="text-muted-foreground mb-6">Create your very first trip to generate a smart packing list!</p>
            <Link to="/new-trip">
              <Button size="lg"><Plus className="w-5 h-5 mr-2" /> Create First Trip</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map(trip => (
            <Link to={`/trip/${trip.id}`} key={trip.id}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary h-full">
                <CardHeader>
                  <CardTitle>{trip.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">
                    {new Date(trip.date_start).toLocaleDateString()} - {new Date(trip.date_end).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold">{trip.temperature}</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">{trip.activities.length} Activities</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
