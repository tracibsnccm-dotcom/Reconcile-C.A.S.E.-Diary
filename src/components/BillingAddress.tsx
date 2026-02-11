import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Check } from "lucide-react";
import { toast } from "sonner";

export function BillingAddress() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: "123 Law Office Blvd",
    suite: "Suite 400",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Future: Save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Billing address updated successfully");
    } catch (error) {
      toast.error("Failed to update billing address");
    } finally {
      setLoading(false);
    }
  };

  const usStates = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Billing Address
        </CardTitle>
        <CardDescription>
          Update the address that appears on your invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="suite">Suite / Apartment (Optional)</Label>
          <Input
            id="suite"
            value={address.suite}
            onChange={(e) => setAddress({ ...address, suite: e.target.value })}
            placeholder="Suite 100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              placeholder="New York"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={address.state} onValueChange={(value) => setAddress({ ...address, state: value })}>
              <SelectTrigger id="state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {usStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={address.zipCode}
              onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
              placeholder="10001"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={address.country} onValueChange={(value) => setAddress({ ...address, country: value })}>
              <SelectTrigger id="country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Billing Address
              </>
            )}
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This address will appear on all future invoices and receipts. 
            Tax calculations may vary based on your billing address.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}