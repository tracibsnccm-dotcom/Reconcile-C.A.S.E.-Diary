import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VoiceConcernsFormProps {
  caseId: string;
}

export function VoiceConcernsForm({ caseId }: VoiceConcernsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  
  // Form state
  const [providerName, setProviderName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [concernDescription, setConcernDescription] = useState("");
  const [feltRespected, setFeltRespected] = useState("");
  const [feltRespectedDetails, setFeltRespectedDetails] = useState("");
  const [careAddressed, setCareAddressed] = useState("");
  const [careAddressedDetails, setCareAddressedDetails] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch assigned providers for this case
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const { data, error } = await supabase
          .from('providers')
          .select('*')
          .eq('accepting_patients', true);

        if (!error && data) {
          setProviders(data);
          // Auto-select if only one provider
          if (data.length === 1) {
            setProviderName(data[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => {
        const isValid = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
        if (!isValid) {
          toast({
            title: "Invalid file type",
            description: "Only PDF, JPG, and PNG files are allowed.",
            variant: "destructive",
          });
        }
        return isValid;
      });
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!concernDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please describe your concern before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("Not authenticated");

      // Insert the concern record
      const { data: concern, error: concernError } = await supabase
        .from('concerns')
        .insert({
          case_id: caseId,
          client_id: user.user.id,
          provider_name: providerName || "Not specified",
          visit_date: visitDate || null,
          concern_description: concernDescription,
          felt_respected: feltRespected || null,
          felt_respected_details: feltRespectedDetails || null,
          care_addressed: careAddressed || null,
          care_addressed_details: careAddressedDetails || null,
          concern_status: 'Open'
        })
        .select()
        .single();

      if (concernError) throw concernError;

      // Upload attachments if any
      if (attachments.length > 0 && concern) {
        for (const file of attachments) {
          const filePath = `${caseId}/${concern.id}/${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('case-documents')
            .upload(filePath, file);

          if (!uploadError) {
            await supabase
              .from('concern_attachments')
              .insert({
                concern_id: concern.id,
                file_path: filePath,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                uploaded_by: user.user.id
              });
          }
        }
      }

      // Find RN CCM assigned to this case and create notification
      const { data: assignments } = await supabase
        .from('case_assignments')
        .select('user_id')
        .eq('case_id', caseId)
        .in('role', ['RN_CM', 'RCMS_CLINICAL_MGMT']);

      if (assignments && assignments.length > 0) {
        // Create in-app message notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.user.id)
          .single();

        await supabase
          .from('messages')
          .insert({
            case_id: caseId,
            sender_id: user.user.id,
            recipient_role: 'RN_CM',
            subject: '🔔 New Concern Report Submitted',
            message_text: `A new concern has been submitted by ${profile?.display_name || 'Client'} at ${new Date().toLocaleString()}. Please review in Voice Your Concerns.`,
            status: 'pending'
          });
      }

      toast({
        title: "✅ Thank you for sharing your experience",
        description: "Your RN Care Manager has received your concern and will reach out to you through the secure in-app messaging system.",
      });

      // Reset form
      setProviderName(providers.length === 1 ? providers[0].name : "");
      setVisitDate("");
      setConcernDescription("");
      setFeltRespected("");
      setFeltRespectedDetails("");
      setCareAddressed("");
      setCareAddressedDetails("");
      setAttachments([]);

    } catch (error) {
      console.error('Error submitting concern:', error);
      toast({
        title: "Error",
        description: "Could not submit your concern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          🗣️ Voice Your Concerns
        </CardTitle>
        <CardDescription>
          Share any issues or experiences about your care or provider interactions. Your RN Care Manager will review and follow up with you through the in-app messaging system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>RN Follow-up Via In-App Message Only</strong><br />
              Your RN Care Manager will respond to your concern through the secure messaging system. You'll receive a notification when they reply.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider Name</Label>
            {loadingProviders ? (
              <Input disabled placeholder="Loading providers..." />
            ) : providers.length > 0 ? (
              <select
                id="provider"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {provider.name} - {provider.specialty}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="provider"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="Enter provider name"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitDate">Visit Date</Label>
            <Input
              type="date"
              id="visitDate"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concern" className="text-base font-semibold">
              Describe What Happened or Your Concern *
            </Label>
            <Textarea
              id="concern"
              required
              value={concernDescription}
              onChange={(e) => setConcernDescription(e.target.value)}
              placeholder="Please describe your experience in detail..."
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Did you feel listened to and respected?
            </Label>
            <RadioGroup value={feltRespected} onValueChange={setFeltRespected}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="respect-yes" />
                <Label htmlFor="respect-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Somewhat" id="respect-somewhat" />
                <Label htmlFor="respect-somewhat" className="font-normal cursor-pointer">Somewhat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="respect-no" />
                <Label htmlFor="respect-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
            {(feltRespected === "Somewhat" || feltRespected === "No") && (
              <div className="mt-3">
                <Label htmlFor="feltRespectedDetails" className="text-sm">
                  Please explain (optional)
                </Label>
                <Textarea
                  id="feltRespectedDetails"
                  value={feltRespectedDetails}
                  onChange={(e) => setFeltRespectedDetails(e.target.value)}
                  placeholder="You can provide more details about your answer here..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Was your care addressed appropriately?
            </Label>
            <RadioGroup value={careAddressed} onValueChange={setCareAddressed}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="care-yes" />
                <Label htmlFor="care-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Somewhat" id="care-somewhat" />
                <Label htmlFor="care-somewhat" className="font-normal cursor-pointer">Somewhat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="care-no" />
                <Label htmlFor="care-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
            {(careAddressed === "Somewhat" || careAddressed === "No") && (
              <div className="mt-3">
                <Label htmlFor="careAddressedDetails" className="text-sm">
                  Please explain (optional)
                </Label>
                <Textarea
                  id="careAddressedDetails"
                  value={careAddressedDetails}
                  onChange={(e) => setCareAddressedDetails(e.target.value)}
                  placeholder="You can provide more details about your answer here..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (optional)</Label>
            <div className="space-y-2">
              <Input
                type="file"
                id="attachments"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Accepted: PDF, JPG, PNG files
              </p>
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Concern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
