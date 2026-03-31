import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function NewTrip() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Trip</h1>
        <p className="text-muted-foreground mt-1">Tell us about your trip to generate the perfect packing list.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Form will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
