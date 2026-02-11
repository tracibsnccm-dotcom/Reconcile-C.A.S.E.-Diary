import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, DollarSign, Search, Plus, Mail, Phone, Star } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface ReferralSource {
  id: string;
  name: string;
  type: 'attorney' | 'medical' | 'business' | 'client';
  totalReferrals: number;
  activeReferrals: number;
  totalRevenue: number;
  lastReferral: Date;
  contactEmail: string;
  contactPhone: string;
  rating: number;
}

export default function ReferralNetworkManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const referralSources: ReferralSource[] = [
    {
      id: '1',
      name: 'Smith & Associates Law Firm',
      type: 'attorney',
      totalReferrals: 24,
      activeReferrals: 5,
      totalRevenue: 75000,
      lastReferral: new Date(),
      contactEmail: 'contact@smithlaw.com',
      contactPhone: '555-0101',
      rating: 4.8
    },
    {
      id: '2',
      name: 'Dr. Johnson Medical Center',
      type: 'medical',
      totalReferrals: 18,
      activeReferrals: 3,
      totalRevenue: 54000,
      lastReferral: new Date(Date.now() - 86400000),
      contactEmail: 'admin@johnsonmedical.com',
      contactPhone: '555-0102',
      rating: 4.6
    }
  ];

  const filteredSources = referralSources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'attorney': return <Badge variant="default">Attorney</Badge>;
      case 'medical': return <Badge variant="secondary">Medical</Badge>;
      case 'business': return <Badge className="bg-accent text-accent-foreground">Business</Badge>;
      case 'client': return <Badge variant="outline">Client</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{referralSources.length}</p>
              <p className="text-sm text-muted-foreground">Referral Sources</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{referralSources.reduce((sum, s) => sum + s.totalReferrals, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-warning">{referralSources.reduce((sum, s) => sum + s.activeReferrals, 0)}</p>
              <p className="text-sm text-muted-foreground">Active Referrals</p>
            </div>
            <Users className="h-8 w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(referralSources.reduce((sum, s) => sum + s.totalRevenue, 0))}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referral sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Referral Source
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="attorney">Attorneys</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSources.map(source => (
              <Card key={source.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{source.name}</h3>
                      {getTypeBadge(source.type)}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(source.rating)
                              ? 'fill-warning text-warning'
                              : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">{source.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                    <p className="text-lg font-bold text-foreground">{source.totalReferrals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-lg font-bold text-warning">{source.activeReferrals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(source.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Referral</p>
                    <p className="text-sm font-medium text-foreground">{format(source.lastReferral, 'MMM d')}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{source.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{source.contactPhone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button size="sm" className="flex-1">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['attorney', 'medical', 'business'].map(type => (
          <TabsContent key={type} value={type}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSources.filter(s => s.type === type).map(source => (
                <Card key={source.id} className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{source.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Referrals</p>
                      <p className="text-lg font-bold text-foreground">{source.totalReferrals}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(source.totalRevenue)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
