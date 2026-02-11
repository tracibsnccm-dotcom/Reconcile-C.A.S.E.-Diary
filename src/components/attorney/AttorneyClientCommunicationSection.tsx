import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";
import {
  insertClientCommunication,
  type ClientCommunicationType,
} from "@/lib/caseRequestsApi";

const COMM_TYPES: ClientCommunicationType[] = ["Phone", "Email", "In-Person", "Written"];

interface AttorneyClientCommunicationSectionProps {
  caseId: string;
  onSaved?: () => void;
}

export function AttorneyClientCommunicationSection({
  caseId,
  onSaved,
}: AttorneyClientCommunicationSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [commType, setCommType] = useState<ClientCommunicationType>("Phone");
  const [message, setMessage] = useState("");
  const [ccRn, setCcRn] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast({ title: "Message required", description: "Please enter message / notes.", variant: "destructive" });
      return;
    }
    if (!user?.id) {
      toast({ title: "Sign-in required", description: "Please sign in to record communication.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await insertClientCommunication({
        caseId,
        actorUserId: user.id,
        communicationType: commType,
        message: trimmed,
        ccRn,
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Saved", description: "Client communication recorded." });
      setOpen(false);
      setMessage("");
      setCcRn(false);
      setCommType("Phone");
      onSaved?.();
    } catch (e: unknown) {
      const err = e && typeof e === "object" && "message" in e ? String((e as Error).message) : String(e);
      toast({ title: "Error", description: err, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setMessage("");
    setCcRn(false);
    setCommType("Phone");
  };

  return (
    <>
      <div className="mb-2">
        <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="bg-[hsl(var(--rcms-gold))] text-foreground hover:bg-foreground hover:text-[hsl(var(--rcms-gold))]">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Contact Client
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleCancel())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Communication type</Label>
              <Select value={commType} onValueChange={(v) => setCommType(v as ClientCommunicationType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message / Notes (required)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Document the communication…"
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="cc-rn"
                  checked={ccRn}
                  onCheckedChange={(v) => setCcRn(v === true)}
                />
                <Label htmlFor="cc-rn" className="font-normal cursor-pointer text-sm leading-tight">
                  CC RN (clinical matters only)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Only CC the RN if this communication relates to clinical care. Do not include legal strategy.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!message.trim() || saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
