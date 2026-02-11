import { Case } from "@/config/rcms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/store";
import { Clock, AlertCircle, CheckCircle, User, ShieldAlert, Ban, FileText, MessageSquare, Flag, Star, Eye } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { isBlockedForAttorney, canAccess, FEATURE, getDisplayName } from "@/lib/access";
import { ConsentBlockedBanner } from "./ConsentBlockedBanner";
import { SDOHChip } from "./SDOHChip";
import { RiskIndicator } from "./RiskIndicator";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePinnedCases } from "@/hooks/usePinnedCases";

interface CaseCardProps {
  case: Case;
  onClick?: () => void;
  onQuickView?: (caseId: string) => void;
}

const statusConfig = {
  NEW: { label: "New", className: "bg-status-new/10 text-status-new border-status-new/20", icon: Clock },
  AWAITING_CONSENT: { label: "Awaiting Consent", className: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  ROUTED: { label: "Routed", className: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
  IN_PROGRESS: { label: "In Progress", className: "bg-status-active/10 text-status-active border-status-active/20", icon: CheckCircle },
  HOLD_SENSITIVE: { label: "Hold (Sensitive)", className: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldAlert },
  CLOSED: { label: "Closed", className: "bg-status-closed/10 text-status-closed border-status-closed/20", icon: CheckCircle },
};

export function CaseCard({ case: caseData, onClick, onQuickView }: CaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isPinned, togglePin } = usePinnedCases();
  const navigate = useNavigate();

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(caseData.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(caseData.id);
    }
  };

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    switch (action) {
      case "docs":
        navigate(`/cases/${caseData.id}#documents`);
        break;
      case "message":
        navigate(`/dashboard?tab=rn-liaison&case=${caseData.id}`);
        break;
      case "flag":
        navigate(`/cases/${caseData.id}#follow-ups`);
        break;
    }
  };
  const { role } = useApp();
  const statusInfo = statusConfig[caseData.status];
  const StatusIcon = statusInfo.icon;
  
  const blockStatus = isBlockedForAttorney(role, caseData);
  const allowIdentity = canAccess(role, caseData, FEATURE.VIEW_IDENTITY);
  const allowClinical = canAccess(role, caseData, FEATURE.VIEW_CLINICAL);
  const displayName = getDisplayName(role, caseData);

  return (
    <Card
      className={cn(
        "p-5 hover:shadow-lg transition-all cursor-pointer border-border relative",
        blockStatus.blocked && "border-destructive/50 bg-destructive/5"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pin Star and Quick View */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <TooltipProvider>
          {onQuickView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-background shadow-sm"
                  onClick={handleQuickView}
                  aria-label="Quick view case summary"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quick View</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handlePinClick}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md border transition-colors",
                  isPinned(caseData.id) 
                    ? "text-rcms-gold bg-background border-rcms-gold hover:bg-rcms-gold/10" 
                    : "text-muted-foreground bg-background border-border hover:text-rcms-gold hover:border-rcms-gold"
                )}
                aria-label={isPinned(caseData.id) ? "Unpin case" : "Pin case"}
              >
                <Star className={cn("w-4 h-4", isPinned(caseData.id) && "fill-current")} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isPinned(caseData.id) ? "Unpin case" : "Pin case"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Hover Quick Actions */}
      {isHovered && !blockStatus.blocked && (
        <div className="absolute top-16 right-4 flex gap-2 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-background shadow-md"
                  onClick={(e) => handleQuickAction(e, "docs")}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Documents</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-background shadow-md"
                  onClick={(e) => handleQuickAction(e, "message")}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Message RN CM</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-background shadow-md"
                  onClick={(e) => handleQuickAction(e, "flag")}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Flag Follow-Up</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Red Circle with Line Through - No Access Indicator */}
      {blockStatus.blocked && (
        <div className="absolute top-14 right-4">
          <div className="relative">
            <Ban className="w-12 h-12 text-destructive" strokeWidth={2.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[10px] font-bold text-destructive leading-tight text-center">
                NO<br/>ACCESS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Blocked Banner */}
      {blockStatus.blocked && blockStatus.reason && (
        <ConsentBlockedBanner reason={blockStatus.reason} />
      )}
      
      <div className="flex items-start justify-between mb-4 pr-14">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold text-lg transition-opacity",
              blockStatus.blocked ? "text-destructive line-through" : "text-foreground",
              caseData.riskLevel && caseData.riskLevel !== "stable" && !blockStatus.blocked && "animate-care-pulse"
            )}>
              {caseData.id}
            </h3>
            {caseData.riskLevel && !blockStatus.blocked && (
              <RiskIndicator level={caseData.riskLevel} size="md" />
            )}
            {blockStatus.blocked && (
              <Ban className="w-5 h-5 text-destructive flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Client: {allowIdentity ? (
              <span className="select-none relative inline-block">
                <span className="absolute -top-3 right-0 text-[8px] text-muted-foreground/60">
                  IDENTITY
                </span>
                {displayName}
              </span>
            ) : (
              <span className="select-none">{displayName}</span>
            )}
          </p>
        </div>
        <Badge className={cn("border", statusInfo.className)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Incident Type:</span>
          <span className={cn(
            "font-medium",
            blockStatus.blocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {allowClinical ? caseData.intake.incidentType : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Incident Date:</span>
          <span className={cn(
            "font-medium",
            blockStatus.blocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {allowClinical ? fmtDate(caseData.intake.incidentDate) : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Severity:</span>
          <span className={cn(
            "font-medium",
            blockStatus.blocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {allowClinical ? `${caseData.intake.severitySelfScore}/10` : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Consent:</span>
          <span className={cn(
            "font-medium",
            caseData.consent.signed ? "text-green-600" : "text-destructive"
          )}>
            {caseData.consent.signed ? "✓ Signed" : "✗ Not Signed"}
          </span>
        </div>
        {blockStatus.blocked && (
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground w-32">Attorney Access:</span>
            <span className="font-medium text-destructive flex items-center gap-1">
              <Ban className="w-3 h-3" />
              Blocked
            </span>
          </div>
        )}
      </div>

      {allowClinical && caseData.sdohFlags && caseData.sdohFlags.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-2 font-medium">SDOH Barriers:</div>
          <div className="flex flex-wrap gap-2">
            {caseData.sdohFlags.map((flag) => (
              <SDOHChip key={flag} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {allowClinical && caseData.flags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {caseData.flags.map((flag) => (
            <Badge key={flag} variant="outline" className="text-xs">
              {flag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {caseData.client.state || "N/A"}
        </div>
        <div>Updated {fmtDate(caseData.updatedAt)}</div>
      </div>
    </Card>
  );
}
