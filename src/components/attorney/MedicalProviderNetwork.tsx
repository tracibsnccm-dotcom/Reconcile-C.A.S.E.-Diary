import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, MapPin, Star, Clock, DollarSign, Users } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: string;
  specialty: string[];
  phone: string;
  email: string;
  address: string;
  rating: number;
  referralCount: number;
  avgResponseTime: string;
  acceptsLiens: boolean;
  hourlyRate?: number;
  notes?: string;
}

export function MedicalProviderNetwork() {
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: "1",
      name: "City Medical Center",
      type: "Hospital",
      specialty: ["Emergency Care", "Surgery", "Imaging"],
      phone: "(555) 987-6543",
      email: "referrals@citymedical.com",
      address: "123 Healthcare Blvd, City, ST 12345",
      rating: 4.8,
      referralCount: 45,
      avgResponseTime: "2-3 days",
      acceptsLiens: true,
      notes: "Excellent for complex trauma cases. Fast turnaround on medical records."
    },
    {
      id: "2",
      name: "Dr. James Patterson",
      type: "Specialist",
      specialty: ["Orthopedics", "Sports Medicine"],
      phone: "(555) 123-7890",
      email: "dr.patterson@orthoclinic.com",
      address: "456 Medical Plaza, Suite 200",
      rating: 5.0,
      referralCount: 67,
      avgResponseTime: "1-2 days",
      acceptsLiens: true,
      hourlyRate: 400,
      notes: "Great courtroom testimony. Specializes in spine and joint injuries."
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");

  const filteredProviders = providers.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.specialty.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterType === "all" || p.type === filterType) &&
    (filterSpecialty === "all" || p.specialty.includes(filterSpecialty))
  );

  const allSpecialties = Array.from(new Set(providers.flatMap(p => p.specialty)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medical Provider Network</h2>
          <p className="text-muted-foreground">Your trusted network of medical professionals</p>
        </div>
        <Button>Add Provider</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{providers.length}</div>
          <div className="text-sm text-muted-foreground">Total Providers</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {providers.filter(p => p.acceptsLiens).length}
          </div>
          <div className="text-sm text-muted-foreground">Accept Liens</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {providers.reduce((sum, p) => sum + p.referralCount, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Referrals</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">4.9</div>
          <div className="text-sm text-muted-foreground">Avg Rating</div>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search providers by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Hospital">Hospital</SelectItem>
            <SelectItem value="Specialist">Specialist</SelectItem>
            <SelectItem value="Clinic">Clinic</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {allSpecialties.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredProviders.map((provider) => (
          <Card key={provider.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <Badge variant="secondary">{provider.type}</Badge>
                  {provider.acceptsLiens && (
                    <Badge className="bg-green-500/10 text-green-500">Accepts Liens</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {provider.specialty.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Response: {provider.avgResponseTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{provider.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.referralCount} referrals</span>
                  </div>
                </div>

                {provider.notes && (
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    {provider.notes}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Contact
                </Button>
                <Button variant="outline" size="sm">Refer Client</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
