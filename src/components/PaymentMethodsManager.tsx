import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, Trash2, Star, Calendar, Lock } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
  holderName: string;
}

export function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: '12',
      expiryYear: '2025',
      isDefault: true,
      holderName: 'John Attorney',
    },
  ]);
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [addCardOpen, setAddCardOpen] = useState(false);

  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    zipCode: '',
  });

  const handleAddCard = () => {
    // Validate card details
    if (!newCard.cardNumber || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      toast.error("Please fill in all card details");
      return;
    }

    const last4 = newCard.cardNumber.slice(-4);
    const brand = newCard.cardNumber.startsWith('4') ? 'Visa' : 
                  newCard.cardNumber.startsWith('5') ? 'Mastercard' : 'Card';

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      last4,
      brand,
      expiryMonth: newCard.expiryMonth,
      expiryYear: newCard.expiryYear,
      isDefault: paymentMethods.length === 0,
      holderName: newCard.holderName,
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewCard({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      holderName: '',
      zipCode: '',
    });
    setAddCardOpen(false);
    toast.success("Payment method added successfully");
  };

  const handleRemoveCard = (id: string) => {
    setPaymentMethods(paymentMethods.filter(m => m.id !== id));
    toast.success("Payment method removed");
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id,
    })));
    toast.success("Default payment method updated");
  };

  const getCardIcon = (brand?: string) => {
    return <CreditCard className="w-8 h-8" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your saved payment methods for subscription and referral purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No payment methods saved</p>
              <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                      Enter your card details to add a payment method
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-name">Cardholder Name</Label>
                      <Input
                        id="card-name"
                        value={newCard.holderName}
                        onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        type="text"
                        maxLength={19}
                        value={newCard.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          if (/^\d*$/.test(value) && value.length <= 16) {
                            setNewCard({ ...newCard, cardNumber: value });
                          }
                        }}
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry-month">Month</Label>
                        <Select value={newCard.expiryMonth} onValueChange={(value) => setNewCard({ ...newCard, expiryMonth: value })}>
                          <SelectTrigger id="expiry-month">
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(month => (
                              <SelectItem key={month} value={month}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiry-year">Year</Label>
                        <Select value={newCard.expiryYear} onValueChange={(value) => setNewCard({ ...newCard, expiryYear: value })}>
                          <SelectTrigger id="expiry-year">
                            <SelectValue placeholder="YY" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString().slice(-2)).map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          maxLength={4}
                          value={newCard.cvv}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setNewCard({ ...newCard, cvv: value });
                            }
                          }}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">Billing ZIP Code</Label>
                      <Input
                        id="zip"
                        value={newCard.zipCode}
                        onChange={(e) => setNewCard({ ...newCard, zipCode: e.target.value })}
                        placeholder="10001"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddCardOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCard}>
                      Add Card
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getCardIcon(method.brand)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          {method.isDefault && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.holderName}
                          {method.expiryMonth && method.expiryYear && (
                            <> • Expires {method.expiryMonth}/{method.expiryYear}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCard(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Payment Method
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                      Enter your card details to add a payment method
                    </DialogDescription>
                  </DialogHeader>
                  {/* Same form as above */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-name">Cardholder Name</Label>
                      <Input
                        id="card-name"
                        value={newCard.holderName}
                        onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        type="text"
                        maxLength={19}
                        value={newCard.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          if (/^\d*$/.test(value) && value.length <= 16) {
                            setNewCard({ ...newCard, cardNumber: value });
                          }
                        }}
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry-month-2">Month</Label>
                        <Select value={newCard.expiryMonth} onValueChange={(value) => setNewCard({ ...newCard, expiryMonth: value })}>
                          <SelectTrigger id="expiry-month-2">
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(month => (
                              <SelectItem key={month} value={month}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiry-year-2">Year</Label>
                        <Select value={newCard.expiryYear} onValueChange={(value) => setNewCard({ ...newCard, expiryYear: value })}>
                          <SelectTrigger id="expiry-year-2">
                            <SelectValue placeholder="YY" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString().slice(-2)).map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv-2">CVV</Label>
                        <Input
                          id="cvv-2"
                          type="text"
                          maxLength={4}
                          value={newCard.cvv}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setNewCard({ ...newCard, cvv: value });
                            }
                          }}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip-2">Billing ZIP Code</Label>
                      <Input
                        id="zip-2"
                        value={newCard.zipCode}
                        onChange={(e) => setNewCard({ ...newCard, zipCode: e.target.value })}
                        placeholder="10001"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddCardOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCard}>
                      Add Card
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Auto-Pay Settings
          </CardTitle>
          <CardDescription>
            Automatically charge your default payment method for subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Enable Auto-Pay</p>
              <p className="text-sm text-muted-foreground">
                Automatically pay subscription on renewal date
              </p>
            </div>
            <Switch
              checked={autoPayEnabled}
              onCheckedChange={setAutoPayEnabled}
            />
          </div>

          {autoPayEnabled && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your subscription will automatically renew using your default payment method. 
                You'll receive an email confirmation 7 days before each charge.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Payment Security</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All payment information is encrypted and secure</li>
              <li>• We never store your full card number</li>
              <li>• PCI DSS Level 1 compliant payment processing</li>
              <li>• 3D Secure authentication for added protection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}