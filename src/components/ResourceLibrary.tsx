import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResourceLibrary() {
  const resources = [
    {
      id: "1",
      type: "article",
      title: "Understanding Your Recovery Journey",
      description: "A guide to managing expectations and milestones in personal injury recovery",
      link: "#",
    },
    {
      id: "2",
      type: "video",
      title: "Pain Management Techniques",
      description: "Evidence-based approaches to managing chronic pain",
      link: "#",
    },
    {
      id: "3",
      type: "article",
      title: "The 4Ps of Wellness Explained",
      description: "Deep dive into Physical, Psychological, Psychosocial, and Professional wellness",
      link: "#",
    },
    {
      id: "4",
      type: "article",
      title: "Working With Your Care Team",
      description: "How to communicate effectively with attorneys, RNs, and providers",
      link: "#",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-rcms-teal" />
          Resources & Support
        </h2>
      </div>

      {/* Crisis Notice */}
      <Alert className="border-2 border-rcms-coral bg-rcms-coral/10 shadow-md">
        <AlertTriangle className="h-5 w-5 text-rcms-coral" />
        <AlertDescription>
          <p className="font-bold text-foreground mb-2">Crisis Support Available 24/7</p>
          <p className="text-foreground">
            If you're experiencing a mental health crisis, call or text <strong className="text-rcms-coral text-lg">988</strong> for the Suicide & Crisis Lifeline.
            For medical emergencies, call <strong className="text-rcms-coral text-lg">911</strong>.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <Card
            key={resource.id}
            className="p-6 border-2 border-rcms-gold hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rcms-teal/10 flex items-center justify-center">
                {resource.type === "video" ? (
                  <Video className="w-6 h-6 text-rcms-teal" />
                ) : (
                  <BookOpen className="w-6 h-6 text-rcms-teal" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-lg mb-2">{resource.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                <Button
                  size="sm"
                  className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold transition-all duration-300"
                  asChild
                >
                  <a href={resource.link} target="_blank" rel="noopener noreferrer">
                    Read More <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
