import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Case, Provider } from "@/config/rcms";
import { sendProviderConfirmation, createConfirmationPayload } from "@/lib/webhooks";

interface ProviderConfirmationButtonProps {
  caseData: Case;
  provider: Provider;
  confirmationType?: "appointment_confirmed" | "appointment_scheduled" | "appointment_completed";
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  onSuccess?: () => void;
}

export function ProviderConfirmationButton({
  caseData,
  provider,
  confirmationType = "appointment_confirmed",
  variant = "default",
  size = "default",
  onSuccess,
}: ProviderConfirmationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      const payload = createConfirmationPayload(caseData, provider, confirmationType);
      const result = await sendProviderConfirmation(payload);

      if (result.success) {
        toast.success("Provider confirmation sent successfully", {
          description: `Confirmed ${provider.name} for ${caseData.id}`,
        });
        onSuccess?.();
      } else {
        toast.error("Failed to send confirmation", {
          description: result.error || "Please check webhook configuration",
        });
      }
    } catch (error) {
      toast.error("Error sending confirmation", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConfirm}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Provider
        </>
      )}
    </Button>
  );
}

interface OpenConfirmationFormButtonProps {
  caseData: Case;
  provider: Provider;
  formUrl?: string;
}

export function OpenConfirmationFormButton({
  caseData,
  provider,
  formUrl = "https://form.highlevelforms.com/YOUR_FORM_URL",
}: OpenConfirmationFormButtonProps) {
  const handleOpenForm = () => {
    const params = new URLSearchParams({
      case_id: caseData.id,
      provider_name: provider.name,
      attorney_name: caseData.client.attyRef,
      service_requested: provider.specialty,
    });

    const url = `${formUrl}?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleOpenForm}>
      <ExternalLink className="w-4 h-4 mr-2" />
      Open Confirmation Form
    </Button>
  );
}
