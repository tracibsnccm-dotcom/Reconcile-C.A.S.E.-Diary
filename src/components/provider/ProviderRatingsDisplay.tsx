import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Rating {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  client_id: string;
}

interface ProviderRatingsDisplayProps {
  providerId: string;
}

export function ProviderRatingsDisplay({ providerId }: ProviderRatingsDisplayProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, [providerId]);

  async function fetchRatings() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("provider_ratings")
        .select("id, rating, review_text, created_at, client_id")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRatings(data || []);

      // Calculate average
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading ratings...</div>;
  }

  if (ratings.length === 0) {
    return <div className="text-sm text-muted-foreground">No ratings yet</div>;
  }

  return (
    <div className="space-y-4">
      {/* Average Rating Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {ratings.length} {ratings.length === 1 ? "review" : "reviews"}
          </div>
        </div>
      </Card>

      {/* Individual Reviews */}
      <div className="space-y-3">
        {ratings.map((rating) => (
          <Card key={rating.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(rating.created_at), "MMM d, yyyy")}
              </span>
            </div>
            {rating.review_text && (
              <p className="text-sm text-muted-foreground">{rating.review_text}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
