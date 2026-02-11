import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeedbackSummary {
  overallRating: number;
  totalResponses: number;
  trend: "up" | "down" | "stable";
  categories: {
    communication: number;
    responsiveness: number;
    careQuality: number;
    professionalism: number;
  };
  recentComments: string[];
}

export function RNClientSatisfaction() {
  // Mock data - replace with real data from Supabase
  const feedback: FeedbackSummary = {
    overallRating: 4.8,
    totalResponses: 24,
    trend: "up",
    categories: {
      communication: 4.9,
      responsiveness: 4.7,
      careQuality: 4.8,
      professionalism: 5.0,
    },
    recentComments: [
      "Very attentive and thorough in explaining my care plan.",
      "Quick to respond to my questions, felt well supported.",
      "Professional and compassionate care throughout my recovery.",
    ],
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Client Satisfaction Summary
        </CardTitle>
        <CardDescription>Feedback from your clients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold">{feedback.overallRating}</span>
              <div>
                <StarRating rating={feedback.overallRating} />
                <p className="text-xs text-muted-foreground">{feedback.totalResponses} responses</p>
              </div>
            </div>
          </div>
          {feedback.trend === "up" && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Improving
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">Category Ratings</p>
          {Object.entries(feedback.categories).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="font-medium">{value}/5</span>
              </div>
              <Progress value={(value / 5) * 100} className="h-2" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recent Comments
          </p>
          <div className="space-y-2">
            {feedback.recentComments.map((comment, index) => (
              <div key={index} className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-1">
                "{comment}"
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
