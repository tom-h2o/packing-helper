import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function TripView() {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trip Checklist: {id}</h1>
        <p className="text-muted-foreground mt-1">Check things off as you pack them.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Packing List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">List of items to pack.</p>
        </CardContent>
      </Card>
    </div>
  );
}
