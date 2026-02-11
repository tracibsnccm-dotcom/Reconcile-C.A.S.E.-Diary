import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, DollarSign, CheckCircle } from "lucide-react";
import { RN_CM_SERVICES_CATALOG, RNCMService } from "@/config/rnCmServices";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";

export function RNCMServiceCatalog() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<RNCMService | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [multiSelectValues, setMultiSelectValues] = useState<Record<string, string[]>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  function openRequestDialog(service: RNCMService) {
    setSelectedService(service);
    setFormData({});
    setMultiSelectValues({});
    setAcknowledged(false);
  }

  function closeDialog() {
    setSelectedService(null);
    setFormData({});
    setMultiSelectValues({});
    setAcknowledged(false);
  }

  function handleInputChange(fieldName: string, value: any) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }

  function handleMultiSelectToggle(fieldName: string, option: string) {
    setMultiSelectValues((prev) => {
      const current = prev[fieldName] || [];
      const updated = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option];
      return { ...prev, [fieldName]: updated };
    });
  }

  async function handleSubmit() {
    if (!user || !selectedService) return;

    // Validate required fields
    const requiredFields = selectedService.form_schema.filter((f) => f.required);
    for (const field of requiredFields) {
      if (field.type === "multiselect") {
        if (!multiSelectValues[field.name]?.length) {
          toast({
            title: "Required Field",
            description: `${field.label} is required.`,
            variant: "destructive",
          });
          return;
        }
      } else if (!formData[field.name]) {
        toast({
          title: "Required Field",
          description: `${field.label} is required.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedService.requires_ack && !acknowledged) {
      toast({
        title: "Acknowledgment Required",
        description: "Please acknowledge the terms to proceed.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const priceDollars = selectedService.price_cents / 100;
      const processingFee = priceDollars * 0.0325;
      const tax = selectedService.taxable ? priceDollars * 0.0 : 0; // Tax calculation placeholder
      const totalAmount = priceDollars + processingFee + tax;

      // Combine form data with multiselect values
      const combinedFormData = {
        ...formData,
        ...Object.entries(multiSelectValues).reduce((acc, [key, val]) => {
          acc[key] = val.join(", ");
          return acc;
        }, {} as Record<string, string>),
      };

      // Create service request
      const { error: requestError } = await supabase
        .from("rn_cm_service_requests")
        .insert({
          attorney_id: user.id,
          service_id: selectedService.id,
          service_title: selectedService.title,
          form_data: combinedFormData,
          price_cents: selectedService.price_cents,
          status: "pending",
          acknowledged_at: selectedService.requires_ack ? new Date().toISOString() : null,
        });

      if (requestError) throw requestError;

      // Create wallet transaction
      await supabase.from("wallet_transactions").insert({
        attorney_id: user.id,
        transaction_type: "service_charge",
        amount: priceDollars,
        processing_fee: processingFee,
        tax,
        total_amount: totalAmount,
        description: `${RN_CM_SERVICES_CATALOG.workflow.billing.item_label_prefix}: ${selectedService.title}`,
        status: "completed",
        payment_method: "Wallet/Card",
        case_id: formData.case_id || null,
      });

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_role: "ATTORNEY",
        action: "rn_cm_service_requested",
        case_id: formData.case_id || null,
        meta: {
          service_id: selectedService.id,
          service_title: selectedService.title,
          price_cents: selectedService.price_cents,
        },
      });

      toast({
        title: "Request Submitted",
        description: `Your request for ${selectedService.title} has been submitted. Expected delivery: ${selectedService.sla_business_days} business days.`,
      });

      closeDialog();
    } catch (error) {
      console.error("Error submitting service request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function renderFormField(field: RNCMService["form_schema"][number]) {
    switch (field.type) {
      case "text":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              value={formData[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={formData[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
              rows={3}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={formData[field.name] || ""}
              onValueChange={(value) => handleInputChange(field.name, value)}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "multiselect":
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.name}-${option}`}
                    checked={multiSelectValues[field.name]?.includes(option) || false}
                    onCheckedChange={() => handleMultiSelectToggle(field.name, option)}
                  />
                  <Label
                    htmlFor={`${field.name}-${option}`}
                    className="font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "date":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={formData[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case "daterange":
        return (
          <div key={field.name} className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${field.name}-start`}>
                Start Date {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={`${field.name}-start`}
                type="date"
                value={formData[`${field.name}_start`] || ""}
                onChange={(e) => handleInputChange(`${field.name}_start`, e.target.value)}
                required={field.required}
              />
            </div>
            <div>
              <Label htmlFor={`${field.name}-end`}>
                End Date {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={`${field.name}-end`}
                type="date"
                value={formData[`${field.name}_end`] || ""}
                onChange={(e) => handleInputChange(`${field.name}_end`, e.target.value)}
                required={field.required}
              />
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleInputChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {RN_CM_SERVICES_CATALOG.catalog.map((service) => (
          <Card
            key={service.id}
            className="hover:border-[#128f8b] transition-colors cursor-pointer"
            onClick={() => openRequestDialog(service)}
          >
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-4 text-[#0f2a6a]">
                <span className="text-base">{service.title}</span>
                <Badge className="bg-[#b09837] text-black hover:bg-[#b09837]/90 shrink-0">
                  ${(service.price_cents / 100).toFixed(0)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{service.short_desc}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{service.sla_business_days} business days</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{service.delivery_type.toUpperCase()}</span>
                </div>
                {service.requires_ack && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Ack Required</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedService} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0f2a6a]">{selectedService?.title}</DialogTitle>
            <DialogDescription>{selectedService?.long_desc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#b09837]" />
                <span className="font-semibold">
                  ${((selectedService?.price_cents || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                + 3.25% processing{selectedService?.taxable && " + tax"}
              </div>
            </div>

            {selectedService?.form_schema.map((field) => renderFormField(field))}

            {selectedService?.requires_ack && (
              <div className="flex items-start gap-3 p-4 bg-[#b09837]/10 rounded-lg border border-[#b09837]/20">
                <Checkbox
                  id="service-ack"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <Label htmlFor="service-ack" className="text-sm leading-relaxed cursor-pointer">
                  I acknowledge this service will be charged to my eWallet or card on file. Service
                  fees are non-refundable once work begins. Expected delivery:{" "}
                  {selectedService.sla_business_days} business days.
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
