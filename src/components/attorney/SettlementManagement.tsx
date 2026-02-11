import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, FileText, Calculator, Plus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Settlement {
  id: string;
  caseId: string;
  clientName: string;
  status: 'negotiating' | 'pending' | 'accepted';
  demandAmount: number;
  offerAmount: number;
  lastUpdated: Date;
  notes: string;
}

export default function SettlementManagement() {
  const [settlements] = useState<Settlement[]>([
    {
      id: '1',
      caseId: 'RC-12345678',
      clientName: 'John Doe',
      status: 'negotiating',
      demandAmount: 150000,
      offerAmount: 75000,
      lastUpdated: new Date(),
      notes: 'Waiting for response to counteroffer'
    }
  ]);

  const [medicalBills, setMedicalBills] = useState<string>('');
  const [lostWages, setLostWages] = useState<string>('');
  const [painMultiplier, setPainMultiplier] = useState<string>('3');

  const calculateSettlement = () => {
    const bills = parseFloat(medicalBills) || 0;
    const wages = parseFloat(lostWages) || 0;
    const multiplier = parseFloat(painMultiplier) || 3;
    
    const economicDamages = bills + wages;
    const painAndSuffering = bills * multiplier;
    const total = economicDamages + painAndSuffering;
    
    return { economicDamages, painAndSuffering, total };
  };

  const calculation = calculateSettlement();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'negotiating': return <Badge variant="secondary">Negotiating</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'accepted': return <Badge variant="default" className="bg-success">Accepted</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{settlements.length}</p>
              <p className="text-sm text-muted-foreground">Active Settlements</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-warning">{settlements.filter(s => s.status === 'negotiating').length}</p>
              <p className="text-sm text-muted-foreground">In Negotiation</p>
            </div>
            <TrendingUp className="h-8 w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(settlements.reduce((sum, s) => sum + s.demandAmount, 0))}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Settlement Negotiations</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Settlement
            </Button>
          </div>

          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {settlements.filter(s => s.status !== 'accepted').map(settlement => (
                    <div key={settlement.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{settlement.clientName}</h4>
                          <p className="text-sm text-muted-foreground">{settlement.caseId}</p>
                        </div>
                        {getStatusBadge(settlement.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Demand:</span>
                          <span className="font-semibold text-foreground">{formatCurrency(settlement.demandAmount)}</span>
                        </div>
                        {settlement.offerAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Offer:</span>
                            <span className="font-semibold text-warning">{formatCurrency(settlement.offerAmount)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">{settlement.notes}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {format(settlement.lastUpdated, 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="accepted">
              <div className="flex flex-col items-center justify-center h-[400px]">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No accepted settlements yet</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Settlement Calculator</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="medical">Medical Bills</Label>
              <Input
                id="medical"
                type="number"
                placeholder="0"
                value={medicalBills}
                onChange={(e) => setMedicalBills(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="wages">Lost Wages</Label>
              <Input
                id="wages"
                type="number"
                placeholder="0"
                value={lostWages}
                onChange={(e) => setLostWages(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="multiplier">Pain & Suffering Multiplier</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.5"
                placeholder="3"
                value={painMultiplier}
                onChange={(e) => setPainMultiplier(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Economic Damages:</span>
                <span className="font-semibold text-foreground">{formatCurrency(calculation.economicDamages)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pain & Suffering:</span>
                <span className="font-semibold text-foreground">{formatCurrency(calculation.painAndSuffering)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-semibold text-foreground">Estimated Value:</span>
                <span className="font-bold text-primary text-xl">{formatCurrency(calculation.total)}</span>
              </div>
            </div>

            <Button className="w-full mt-4">
              <FileText className="h-4 w-4 mr-2" />
              Generate Demand Letter
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
