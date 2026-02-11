import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PolicyModalProps {
  open: boolean;
  onAgree: () => void;
  onLearnMore: () => void;
}

export function PolicyModal({ open, onAgree, onLearnMore }: PolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[525px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Attorney Notice — Minimum Necessary Data Policy</DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              RCMS C.A.R.E. does <strong>not</strong> collect or store full DOB, street address, or other precise identifiers.
              Retrieve and maintain those only within your firm's secure system.
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Lists show <strong>Case #</strong> and <strong>onset date</strong> only.</li>
              <li>Names/clinical details are hidden unless client consent authorizes sharing with your role.</li>
              <li>We retain only the <strong>minimum necessary</strong> data for case tracking and equitable care analysis.</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onLearnMore}>
            Learn More
          </Button>
          <Button onClick={onAgree}>
            I Understand and Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
