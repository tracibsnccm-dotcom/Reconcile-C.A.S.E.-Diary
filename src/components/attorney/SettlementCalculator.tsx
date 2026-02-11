import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, FileText, Download, TrendingUp } from "lucide-react";

export function SettlementCalculator() {
  const [medicalBills, setMedicalBills] = useState(85000);
  const [futureMedical, setFutureMedical] = useState(25000);
  const [lostWages, setLostWages] = useState(35000);
  const [futureLostWages, setFutureLostWages] = useState(0);
  const [propertyDamage, setPropertyDamage] = useState(8500);
  const [nonEconomicMultiplier, setNonEconomicMultiplier] = useState(3);
  const [liensTotal, setLiensTotal] = useState(32000);
  const [attorneyFeePercent, setAttorneyFeePercent] = useState(33);
  const [costs, setCosts] = useState(5000);

  // Calculations
  const economicDamages = medicalBills + futureMedical + lostWages + futureLostWages + propertyDamage;
  const nonEconomicDamages = (medicalBills + futureMedical) * nonEconomicMultiplier;
  const totalDamages = economicDamages + nonEconomicDamages;
  
  // Settlement analysis
  const attorneyFees = (totalDamages * attorneyFeePercent) / 100;
  const netToClient = totalDamages - attorneyFees - liensTotal - costs;
  const demandAmount = Math.round(totalDamages * 1.3); // Add negotiation buffer

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Settlement Calculator & Demand Generator</h3>
            <p className="text-sm text-muted-foreground">
              Calculate case value and generate professional demand letters
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Economic Damages</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="medical-bills">Past Medical Bills</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="medical-bills"
                  type="number"
                  value={medicalBills}
                  onChange={(e) => setMedicalBills(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="future-medical">Future Medical Expenses</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="future-medical"
                  type="number"
                  value={futureMedical}
                  onChange={(e) => setFutureMedical(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lost-wages">Past Lost Wages</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lost-wages"
                  type="number"
                  value={lostWages}
                  onChange={(e) => setLostWages(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="future-wages">Future Lost Earning Capacity</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="future-wages"
                  type="number"
                  value={futureLostWages}
                  onChange={(e) => setFutureLostWages(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="property-damage">Property Damage</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="property-damage"
                  type="number"
                  value={propertyDamage}
                  onChange={(e) => setPropertyDamage(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="multiplier">Non-Economic Damages Multiplier</Label>
              <Select 
                value={nonEconomicMultiplier.toString()} 
                onValueChange={(v) => setNonEconomicMultiplier(parseInt(v))}
              >
                <SelectTrigger id="multiplier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.5">1.5x (Minor injuries)</SelectItem>
                  <SelectItem value="2">2x (Moderate injuries)</SelectItem>
                  <SelectItem value="3">3x (Serious injuries)</SelectItem>
                  <SelectItem value="4">4x (Severe injuries)</SelectItem>
                  <SelectItem value="5">5x (Catastrophic injuries)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />
            <h4 className="font-semibold">Deductions</h4>

            <div>
              <Label htmlFor="liens">Total Medical Liens</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="liens"
                  type="number"
                  value={liensTotal}
                  onChange={(e) => setLiensTotal(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="costs">Case Costs</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="costs"
                  type="number"
                  value={costs}
                  onChange={(e) => setCosts(parseInt(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fee">Attorney Fee %</Label>
              <Select 
                value={attorneyFeePercent.toString()} 
                onValueChange={(v) => setAttorneyFeePercent(parseInt(v))}
              >
                <SelectTrigger id="fee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="33">33%</SelectItem>
                  <SelectItem value="40">40%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <h4 className="font-semibold mb-4">Settlement Valuation</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Economic Damages:</span>
                <span className="text-xl font-bold">${economicDamages.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Non-Economic Damages:</span>
                <span className="text-xl font-bold">${nonEconomicDamages.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Case Value:</span>
                <span className="text-3xl font-bold text-primary">
                  ${totalDamages.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold mb-4">Demand Amount Recommendation</h4>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-muted-foreground">Suggested Demand</div>
                <div className="text-sm text-muted-foreground">(130% of calculated value)</div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${demandAmount.toLocaleString()}
              </div>
            </div>
            <Badge className="w-full justify-center py-2">
              <TrendingUp className="mr-2 h-4 w-4" />
              Leaves room for negotiation
            </Badge>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold mb-4">Client Net Recovery</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Settlement Amount:</span>
                <span className="font-medium">${totalDamages.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Attorney Fees ({attorneyFeePercent}%):</span>
                <span>-${attorneyFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Medical Liens:</span>
                <span>-${liensTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Case Costs:</span>
                <span>-${costs.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Net to Client:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${netToClient.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Generate Demand Letter
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>

          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is a preliminary valuation tool. Actual settlement value depends on
              liability strength, venue, jury pool, and other factors. Always consult case-specific circumstances.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
