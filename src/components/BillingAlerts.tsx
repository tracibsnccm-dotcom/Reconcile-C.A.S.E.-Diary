import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, CreditCard, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BillingAlerts() {
  const [alerts, setAlerts] = useState({
    paymentFailure: true,
    upcomingRenewal: true,
    lowBalance: true,
    unusualActivity: true,
  });
  const [balanceThreshold, setBalanceThreshold] = useState("500");
  const [renewalReminderDays, setRenewalReminderDays] = useState("7");

  const handleSave = () => {
    toast.success("Alert preferences saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Billing Alerts
        </CardTitle>
        <CardDescription>
          Configure alerts for important billing events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <Label htmlFor="payment-failure">Payment Failure Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified if a payment fails
                </p>
              </div>
            </div>
            <Switch
              id="payment-failure"
              checked={alerts.paymentFailure}
              onCheckedChange={(checked) =>
                setAlerts({ ...alerts, paymentFailure: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="renewal-reminder">Renewal Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminder before subscription renewal
                </p>
              </div>
            </div>
            <Switch
              id="renewal-reminder"
              checked={alerts.upcomingRenewal}
              onCheckedChange={(checked) =>
                setAlerts({ ...alerts, upcomingRenewal: checked })
              }
            />
          </div>

          {alerts.upcomingRenewal && (
            <div className="ml-12 space-y-2">
              <Label htmlFor="reminder-days">Days Before Renewal</Label>
              <Input
                id="reminder-days"
                type="number"
                min="1"
                max="30"
                value={renewalReminderDays}
                onChange={(e) => setRenewalReminderDays(e.target.value)}
                className="w-32"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <div>
                <Label htmlFor="low-balance">Low eWallet Balance</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when wallet balance is low
                </p>
              </div>
            </div>
            <Switch
              id="low-balance"
              checked={alerts.lowBalance}
              onCheckedChange={(checked) =>
                setAlerts({ ...alerts, lowBalance: checked })
              }
            />
          </div>

          {alerts.lowBalance && (
            <div className="ml-12 space-y-2">
              <Label htmlFor="balance-threshold">Balance Threshold ($)</Label>
              <Input
                id="balance-threshold"
                type="number"
                min="0"
                step="100"
                value={balanceThreshold}
                onChange={(e) => setBalanceThreshold(e.target.value)}
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Alert when balance falls below this amount
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <Label htmlFor="unusual-activity">Unusual Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for suspicious transactions
                </p>
              </div>
            </div>
            <Switch
              id="unusual-activity"
              checked={alerts.unusualActivity}
              onCheckedChange={(checked) =>
                setAlerts({ ...alerts, unusualActivity: checked })
              }
            />
          </div>
        </div>

        <Alert>
          <Bell className="w-4 h-4" />
          <AlertDescription>
            Alerts will be sent via email and in-app notifications. Make sure your contact 
            information is up to date in Profile settings.
          </AlertDescription>
        </Alert>

        <Button onClick={handleSave} className="w-full">
          Save Alert Preferences
        </Button>
      </CardContent>
    </Card>
  );
}