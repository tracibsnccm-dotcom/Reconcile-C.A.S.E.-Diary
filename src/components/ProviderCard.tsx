import { Provider } from "@/config/rcms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ExternalLink, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-5 hover:shadow-lg transition-all border-border">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{provider.name}</h3>
          <p className="text-sm text-primary font-medium">{provider.specialty}</p>
        </div>
        <Badge variant={provider.active ? "default" : "secondary"} className="text-xs">
          {provider.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          <span>
            {provider.city}, {provider.state}
            {provider.distanceMiles && (
              <span className="ml-2 text-xs">({provider.distanceMiles} mi)</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={() => navigate(`/provider/${provider.id}`)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Profile
        </Button>
        {provider.schedulingUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={provider.schedulingUrl} target="_blank" rel="noopener noreferrer">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
