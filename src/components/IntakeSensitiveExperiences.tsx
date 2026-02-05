import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, Heart, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  saveSensitiveDisclosure, 
  discardSensitiveSection, 
  normalizeItemCode,
  loadSensitiveDisclosures,
  updateAllConsent,
  type ConsentChoice 
} from "@/lib/sensitiveDisclosuresHelper";
import { toast } from "sonner";
import { Loader2, History } from "lucide-react";
import { z } from "zod";

// Validation schema for additional details
const additionalDetailsSchema = z.string()
  .max(250, "Additional details must be 250 characters or less")
  .regex(/^[^<>{}]*$/, "Special characters like <, >, {, } are not allowed")
  .optional();

export interface SensitiveExperiencesData {
  substanceUse: string[];
  safetyTrauma: string[];
  stressors: string[];
  consentAttorney: ConsentChoice;
  consentProvider: ConsentChoice;
  additionalDetails?: string;
  sectionSkipped?: boolean;
  sectionCollapsed?: boolean;
}

export interface SensitiveExperiencesProgress {
  isComplete: boolean;
  hasSelections: boolean;
  needsConsent: boolean;
  consentProvided: boolean;
  blockNavigation: boolean;
}

interface IntakeSensitiveExperiencesProps {
  data: SensitiveExperiencesData;
  onChange: (data: SensitiveExperiencesData) => void;
  caseId?: string; // Required for persistence
  onProgressChange?: (progress: SensitiveExperiencesProgress) => void;
}

// Helper to compute progress
export function computeSensitiveExperiencesProgress(data: SensitiveExperiencesData): SensitiveExperiencesProgress {
  const hasSelections = 
    data.substanceUse.length > 0 || 
    data.safetyTrauma.length > 0 || 
    data.stressors.length > 0;
  
  const needsConsent = hasSelections && 
    !data.substanceUse.includes("None of the above / prefer not to answer") &&
    !data.substanceUse.includes("Not Applicable / N/A") &&
    !data.safetyTrauma.includes("None of the above / prefer not to answer") &&
    !data.safetyTrauma.includes("Not Applicable / N/A") &&
    !data.stressors.includes("None of the above / prefer not to answer") &&
    !data.stressors.includes("Not Applicable / N/A");
  
  const consentProvided = !needsConsent || 
    (data.consentAttorney !== 'unset' && data.consentProvider !== 'unset');
  
  const isComplete = data.sectionSkipped || !hasSelections || consentProvided;
  const blockNavigation = needsConsent && !consentProvided;
  
  return {
    isComplete,
    hasSelections,
    needsConsent,
    consentProvided,
    blockNavigation
  };
}

const substanceUseOptions = [
  "Current alcohol use that concerns you",
  "Past alcohol use that required treatment or caused problems",
  "Current prescription medication misuse or dependency",
  "Past prescription medication misuse or dependency",
  "Current use of non-prescribed or illicit substances",
  "Past use of non-prescribed or illicit substances",
  "Currently in recovery or enrolled in a treatment program",
  "Prior participation in a detox, rehab, or support group",
  "None of the above / prefer not to answer",
  "Not Applicable / N/A",
];

const safetyTraumaOptions = [
  "History of domestic violence or intimate-partner violence",
  "History of physical abuse (childhood or adulthood)",
  "History of emotional or psychological abuse",
  "History of sexual abuse or assault",
  "Current safety concerns at home or in a relationship",
  "Stalking or harassment experience",
  "History of bullying or workplace harassment",
  "Experience of trafficking or exploitation",
  "Witnessed violence (home, community, or workplace)",
  "None of the above / prefer not to answer",
  "Not Applicable / N/A",
];

const stressorsOptions = [
  "Housing instability or homelessness risk",
  "Food insecurity",
  "Financial hardship or loss of income",
  "Recent major loss or grief (family, job, relationship)",
  "Legal issues unrelated to current injury",
  "Caregiver stress (caring for others while managing your own condition)",
  "Workplace or school harassment or discrimination",
  "Limited family or social support",
  "Cultural or language barriers affecting care access",
  "Transportation barriers to appointments",
  "None of the above / prefer not to answer",
  "Not Applicable / N/A",
];

export function IntakeSensitiveExperiences({ data, onChange, caseId, onProgressChange }: IntakeSensitiveExperiencesProps) {
  const isMobile = useIsMobile();
  const [substanceOpen, setSubstanceOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [stressorsOpen, setStressorsOpen] = useState(false);
  const [clientMessage, setClientMessage] = useState<string>("");
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showConsentRevoke, setShowConsentRevoke] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute progress and report to parent
  const progress = computeSensitiveExperiencesProgress(data);
  const { hasSelections, needsConsent } = progress;
  
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [JSON.stringify(progress), onProgressChange]);
  
  // Load existing data and edit history on mount
  useEffect(() => {
    if (!caseId || hasLoadedData) return;
    
    async function loadData() {
      setIsLoading(true);
      try {
        const disclosures = await loadSensitiveDisclosures(caseId);
        
        if (disclosures.length > 0) {
          // Store edit history
          setEditHistory(disclosures.map(d => ({
            itemCode: d.item_code,
            category: d.category,
            updatedAt: d.updated_at,
            auditEvent: d.audit_event
          })));
          
          // Group by category
          const substance = disclosures
            .filter(d => d.category === 'substance_use')
            .map(d => d.item_code);
          const safety = disclosures
            .filter(d => d.category === 'safety_trauma')
            .map(d => d.item_code);
          const stress = disclosures
            .filter(d => d.category === 'stressors')
            .map(d => d.item_code);
          
          // Get consent from first record (should be same for all)
          const consent = disclosures[0];
          
          onChange({
            ...data,
            substanceUse: substance,
            safetyTrauma: safety,
            stressors: stress,
            consentAttorney: (consent.consent_attorney || 'unset') as ConsentChoice,
            consentProvider: (consent.consent_provider || 'unset') as ConsentChoice,
          });
        }
        setHasLoadedData(true);
      } catch (error) {
        console.error('Error loading disclosures:', error);
        setSaveError('Failed to load previous selections. Please refresh the page.');
        toast.error('Failed to load previous selections');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [caseId, hasLoadedData]);

  useEffect(() => {
    if (hasSelections) {
      setClientMessage("Thank you for sharing. Your RN Care Manager will review and follow up to ensure you have the right support.");
    } else {
      setClientMessage("");
    }
  }, [hasSelections]);

  const toggleOption = async (category: keyof Pick<SensitiveExperiencesData, 'substanceUse' | 'safetyTrauma' | 'stressors'>, option: string) => {
    const current = data[category] || [];
    const noneOption = "None of the above / prefer not to answer";
    const naOption = "Not Applicable / N/A";
    
    let newSelections: string[];
    
    if (option === noneOption || option === naOption) {
      // If selecting "None" or "N/A", clear all other options
      newSelections = [option];
    } else {
      // If selecting any other option, remove "None" and "N/A" if they exist
      const filtered = current.filter(o => o !== noneOption && o !== naOption);
      
      if (current.includes(option)) {
        newSelections = filtered.filter(o => o !== option);
      } else {
        newSelections = [...filtered, option];
      }
    }
    
    onChange({
      ...data,
      [category]: newSelections,
    });
    
    // Persist to database if caseId is available
    if (caseId && option) {
      setIsSaving(true);
      setSaveError(null);
      try {
        const categoryMap = {
          substanceUse: 'substance_use',
          safetyTrauma: 'safety_trauma',
          stressors: 'stressors'
        } as const;
        
        await saveSensitiveDisclosure({
          caseId,
          category: categoryMap[category],
          itemCode: normalizeItemCode(option),
          selected: newSelections.includes(option),
          consentAttorney: data.consentAttorney,
          consentProvider: data.consentProvider
        });
        
        // Show saved indicator briefly
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      } catch (error) {
        console.error('Error saving disclosure:', error);
        setSaveError('Failed to save selection');
        toast.error('Failed to save selection. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSkipSection = () => {
    setShowSkipDialog(true);
  };
  
  const confirmSkipSection = async () => {
    setIsSkipping(true);
    
    try {
      // Discard selections in database if caseId exists
      if (caseId) {
        await discardSensitiveSection(caseId);
      }
      
      // Clear local state
      onChange({
        substanceUse: [],
        safetyTrauma: [],
        stressors: [],
        consentAttorney: 'unset',
        consentProvider: 'unset',
        additionalDetails: '',
        sectionSkipped: true,
        sectionCollapsed: true
      });
      
      toast.success('Section skipped. You can resume later if needed.');
    } catch (error) {
      console.error('Error skipping section:', error);
      toast.error('Failed to skip section. Please try again.');
    } finally {
      setIsSkipping(false);
      setShowSkipDialog(false);
    }
  };
  
  const handleResumeSection = () => {
    onChange({
      ...data,
      sectionSkipped: false,
      sectionCollapsed: false
    });
  };
  
  const handleConsentChange = async (type: 'attorney' | 'provider', value: boolean) => {
    const consentValue: ConsentChoice = value ? 'share' : 'no_share';
    
    const updatedData = {
      ...data,
      ...(type === 'attorney' 
        ? { consentAttorney: consentValue }
        : { consentProvider: consentValue }
      )
    };
    
    onChange(updatedData);
    
    // Save immediately if both consents are set and we have a caseId
    if (caseId && updatedData.consentAttorney !== 'unset' && updatedData.consentProvider !== 'unset') {
      setIsSaving(true);
      try {
        await updateAllConsent(caseId, updatedData.consentAttorney, updatedData.consentProvider);
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      } catch (error) {
        console.error('Error saving consent:', error);
        toast.error('Failed to save consent choices');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const retryLastSave = () => {
    setSaveError(null);
    toast.info('Please try your last action again');
  };
  
  const handleAdditionalDetailsChange = (value: string) => {
    setValidationError(null);
    
    // Validate input
    const result = additionalDetailsSchema.safeParse(value);
    
    if (!result.success) {
      const error = result.error.errors[0];
      setValidationError(error.message);
      toast.error(error.message);
      return;
    }
    
    onChange({ ...data, additionalDetails: value });
    
    // Debounced auto-save for additional details
    if (caseId) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          // Save to first selected item's free_text field
          const firstCategory = data.substanceUse.length > 0 ? 'substanceUse' :
                               data.safetyTrauma.length > 0 ? 'safetyTrauma' : 'stressors';
          const firstItem = data[firstCategory][0];
          
          if (firstItem) {
            const categoryMap = {
              substanceUse: 'substance_use',
              safetyTrauma: 'safety_trauma',
              stressors: 'stressors'
            } as const;
            
            await saveSensitiveDisclosure({
              caseId,
              category: categoryMap[firstCategory],
              itemCode: normalizeItemCode(firstItem),
              selected: true,
              freeText: value,
              consentAttorney: data.consentAttorney,
              consentProvider: data.consentProvider
            });
            
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
          }
        } catch (error) {
          console.error('Error auto-saving additional details:', error);
          toast.error('Failed to auto-save details');
        } finally {
          setIsSaving(false);
        }
      }, 1500); // Auto-save 1.5 seconds after user stops typing
    }
  };
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  const handleConsentRevoke = async () => {
    if (!caseId) return;
    
    setIsSaving(true);
    try {
      await updateAllConsent(caseId, 'unset', 'unset');
      onChange({
        ...data,
        consentAttorney: 'unset',
        consentProvider: 'unset'
      });
      setShowConsentRevoke(false);
      toast.success('Consent choices have been reset. Please select your preferences again.');
    } catch (error) {
      console.error('Error revoking consent:', error);
      toast.error('Failed to update consent. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBulkClear = async () => {
    if (!hasSelections) return;
    
    const confirmed = window.confirm(
      'This will clear all your selections in this section. Are you sure you want to continue?'
    );
    
    if (!confirmed) return;
    
    setIsSaving(true);
    try {
      // If we have a caseId, mark all as deselected in database
      if (caseId) {
        const allItems = [
          ...data.substanceUse.map(item => ({ category: 'substanceUse' as const, item })),
          ...data.safetyTrauma.map(item => ({ category: 'safetyTrauma' as const, item })),
          ...data.stressors.map(item => ({ category: 'stressors' as const, item }))
        ];
        
        const categoryMap = {
          substanceUse: 'substance_use',
          safetyTrauma: 'safety_trauma',
          stressors: 'stressors'
        } as const;
        
        // Save each deselection
        for (const { category, item } of allItems) {
          await saveSensitiveDisclosure({
            caseId,
            category: categoryMap[category],
            itemCode: normalizeItemCode(item),
            selected: false,
            consentAttorney: data.consentAttorney,
            consentProvider: data.consentProvider
          });
        }
      }
      
      // Clear local state
      onChange({
        substanceUse: [],
        safetyTrauma: [],
        stressors: [],
        consentAttorney: 'unset',
        consentProvider: 'unset',
        additionalDetails: '',
        sectionSkipped: false,
        sectionCollapsed: false
      });
      
      toast.success('All selections cleared');
    } catch (error) {
      console.error('Error clearing selections:', error);
      toast.error('Failed to clear selections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const shouldShowAdditionalDetails = () => {
    const allOptions = [
      ...(data.substanceUse || []),
      ...(data.safetyTrauma || []),
      ...(data.stressors || [])
    ];
    return allOptions.some(option => 
      option === "None of the above / prefer not to answer" || 
      option === "Not Applicable / N/A" ||
      option === "Other"
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading previous selections...</p>
        </div>
      </Card>
    );
  }
  
  // If section is skipped and collapsed, show badge with resume option
  if (data.sectionSkipped && data.sectionCollapsed) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">Sensitive or Personal Experiences</h3>
              <Badge variant="secondary" className="mt-1">Section Skipped</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleResumeSection}>
            Resume
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Sensitive or Personal Experiences (Optional)</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your responses are private. We only share with your permission.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Save indicators & Actions */}
          <div className="flex items-center gap-2">
            {hasSelections && !data.sectionSkipped && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkClear}
                disabled={isSaving}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            )}
            {editHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                aria-label="View edit history"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>Saving...</span>
              </div>
            )}
            {showSavedIndicator && !isSaving && (
              <div className="flex items-center gap-2 text-sm text-green-600" role="status" aria-live="polite">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>Saved</span>
              </div>
            )}
            {saveError && !isSaving && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={retryLastSave}
                className="text-destructive hover:text-destructive"
                aria-label="Retry save"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
        
        {/* Edit History */}
        {showHistory && editHistory.length > 0 && (
          <Alert>
            <History className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Recent Changes</p>
              <div className="space-y-1 text-xs">
                {editHistory.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.itemCode.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground">
                      {item.auditEvent} - {new Date(item.updatedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Why we ask these questions:</p>
            <p>
              These questions help us understand factors that may affect your health, recovery, and access to care. 
              Your answers help your RN Care Manager connect you with appropriate resources and support.
            </p>
            {!caseId && (
              <p className="text-xs mt-2 text-muted-foreground italic">
                Your selections will be saved when you submit your intake form.
              </p>
            )}
          </AlertDescription>
        </Alert>
        
        {/* Empty State */}
        {!hasSelections && !data.sectionSkipped && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              <p className="font-medium mb-2">💡 Getting Started</p>
              <p className="text-sm">
                Select any experiences that apply to you from the sections below. 
                If nothing applies, you can select "None of the above / prefer not to answer" 
                or click "Skip Section" to continue.
              </p>
              <p className="text-sm mt-2 text-blue-700 italic">
                Your privacy is protected - all information is confidential.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm">
            <strong>Sharing this information is completely voluntary.</strong> You may skip any question that makes you uncomfortable.
            Your answers are confidential and will not be shared with anyone outside the Reconcile C.A.R.E. team without your permission.
          </p>
          <p className="text-sm">
            If you prefer not to complete this section, click "Skip Section" below.
          </p>
          <p className="text-sm">
            For each question, you may also select "Not Applicable / N/A" if it doesn't apply to you.
          </p>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleSkipSection}
          className="w-full"
        >
          Skip Section
        </Button>

        {/* Substance Use */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Substance Use / Dependency</Label>
            {data.substanceUse.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {data.substanceUse.length}
              </Badge>
            )}
          </div>
          {isMobile ? (
            <Sheet open={substanceOpen} onOpenChange={setSubstanceOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between min-h-[48px]",
                    data.substanceUse.length > 0 && "border-primary"
                  )}
                  type="button"
                >
                  <span>
                    {data.substanceUse.length > 0
                      ? `${data.substanceUse.length} selected`
                      : 'Select options'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Substance Use / Dependency</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  {substanceUseOptions.map((option) => (
                    <div key={option} className="flex items-start space-x-3 py-3 border-b last:border-0">
                      <Checkbox
                        id={`substance-mobile-${option}`}
                        checked={data.substanceUse?.includes(option)}
                        onCheckedChange={() => toggleOption('substanceUse', option)}
                        className="mt-1 h-5 w-5"
                      />
                      <Label
                        htmlFor={`substance-mobile-${option}`}
                        className="cursor-pointer font-normal text-sm leading-relaxed flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover open={substanceOpen} onOpenChange={setSubstanceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    data.substanceUse.length > 0 && "border-primary"
                  )}
                  type="button"
                >
                  <span>
                    {data.substanceUse.length > 0
                      ? `${data.substanceUse.length} selected`
                      : 'Select options'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {substanceUseOptions.map((option) => (
                    <div key={option} className="flex items-start space-x-2 py-2">
                      <Checkbox
                        id={`substance-${option}`}
                        checked={data.substanceUse?.includes(option)}
                        onCheckedChange={() => toggleOption('substanceUse', option)}
                      />
                      <Label
                        htmlFor={`substance-${option}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Safety & Trauma */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Safety & Trauma History</Label>
            {data.safetyTrauma.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {data.safetyTrauma.length}
              </Badge>
            )}
          </div>
          {isMobile ? (
            <Sheet open={safetyOpen} onOpenChange={setSafetyOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between min-h-[48px]",
                    data.safetyTrauma.length > 0 && "border-primary"
                  )}
                  type="button"
                >
                  <span>
                    {data.safetyTrauma.length > 0
                      ? `${data.safetyTrauma.length} selected`
                      : 'Select options'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Safety & Trauma History</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  {safetyTraumaOptions.map((option) => (
                    <div key={option} className="flex items-start space-x-3 py-3 border-b last:border-0">
                      <Checkbox
                        id={`safety-mobile-${option}`}
                        checked={data.safetyTrauma?.includes(option)}
                        onCheckedChange={() => toggleOption('safetyTrauma', option)}
                        className="mt-1 h-5 w-5"
                      />
                      <Label
                        htmlFor={`safety-mobile-${option}`}
                        className="cursor-pointer font-normal text-sm leading-relaxed flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover open={safetyOpen} onOpenChange={setSafetyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    data.safetyTrauma.length > 0 && "border-primary"
                  )}
                  type="button"
                >
                  <span>
                    {data.safetyTrauma.length > 0
                      ? `${data.safetyTrauma.length} selected`
                      : 'Select options'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {safetyTraumaOptions.map((option) => (
                    <div key={option} className="flex items-start space-x-2 py-2">
                      <Checkbox
                        id={`safety-${option}`}
                        checked={data.safetyTrauma?.includes(option)}
                        onCheckedChange={() => toggleOption('safetyTrauma', option)}
                      />
                      <Label
                        htmlFor={`safety-${option}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Stressors */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Current Stressors or Barriers</Label>
            {data.stressors.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {data.stressors.length}
              </Badge>
            )}
          </div>
          {isMobile ? (
            <Sheet open={stressorsOpen} onOpenChange={setStressorsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between min-h-[48px]",
                    data.stressors.length > 0 && "border-primary"
                  )}
                  type="button"
                >
                  <span>
                    {data.stressors.length > 0
                      ? `${data.stressors.length} selected`
                      : 'Select options'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Current Stressors or Barriers</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  {stressorsOptions.map((option) => (
                    <div key={option} className="flex items-start space-x-3 py-3 border-b last:border-0">
                      <Checkbox
                        id={`stressors-mobile-${option}`}
                        checked={data.stressors?.includes(option)}
                        onCheckedChange={() => toggleOption('stressors', option)}
                        className="mt-1 h-5 w-5"
                      />
                      <Label
                        htmlFor={`stressors-mobile-${option}`}
                        className="cursor-pointer font-normal text-sm leading-relaxed flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover open={stressorsOpen} onOpenChange={setStressorsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    data.stressors.length > 0 && "border-primary"
                  )}
                  type="button"
                >
                  <span>
                    {data.stressors.length > 0
                      ? `${data.stressors.length} selected`
                      : 'Select options'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {stressorsOptions.map((option) => (
                    <div key={option} className="flex items-start space-x-2 py-2">
                      <Checkbox
                        id={`stressors-${option}`}
                        checked={data.stressors?.includes(option)}
                        onCheckedChange={() => toggleOption('stressors', option)}
                      />
                      <Label
                        htmlFor={`stressors-${option}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Additional Details */}
        {shouldShowAdditionalDetails() && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Optional: If you experienced something not listed above or want to provide more details, please describe it here.
            </Label>
            <p className="text-xs text-muted-foreground">
              (You may leave this blank if you prefer.)
            </p>
            <Textarea
              value={data.additionalDetails || ''}
              onChange={(e) => handleAdditionalDetailsChange(e.target.value)}
              placeholder="Enter additional details here..."
              maxLength={250}
              className={cn("min-h-[100px]", validationError && "border-destructive")}
              aria-label="Additional details about sensitive experiences"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "details-error" : undefined}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck="true"
              inputMode="text"
            />
            <div className="flex justify-between items-center">
              <p id="details-error" className="text-xs text-destructive">
                {validationError || ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {(data.additionalDetails || '').length}/250 characters
              </p>
            </div>
          </div>
        )}

        {/* Consent Section */}
        {needsConsent && (
          <div 
            className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5"
            role="region"
            aria-label="Consent preferences"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                <Label className="text-base font-medium">Consent to Share Information *</Label>
              </div>
              {caseId && progress.consentProvided && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConsentRevoke(true)}
                  className="text-xs"
                >
                  Change Consent
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Please indicate your consent for sharing this information. <strong>Both choices are required to proceed.</strong>
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="consent-attorney" className="text-sm font-normal flex-1">
                  Share with my attorney
                </Label>
                <Switch
                  id="consent-attorney"
                  checked={data.consentAttorney === 'share'}
                  onCheckedChange={(checked) => handleConsentChange('attorney', checked)}
                  disabled={isSaving}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="consent-provider" className="text-sm font-normal flex-1">
                  Share with treating providers
                </Label>
                <Switch
                  id="consent-provider"
                  checked={data.consentProvider === 'share'}
                  onCheckedChange={(checked) => handleConsentChange('provider', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <Alert role="alert">
              <AlertDescription className="text-xs">
                <strong>Required:</strong> You must make a choice for each option to proceed. Toggle ON to share, or leave OFF to not share.
              </AlertDescription>
            </Alert>
            
            {!progress.consentProvided && (
              <Alert variant="destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">
                  Please complete both consent choices above before proceeding to the next section.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {clientMessage && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              {clientMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Summary Section */}
        {hasSelections && (
          <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Your Selections Summary
            </h4>
            <div className="space-y-2 text-sm">
              {data.substanceUse.length > 0 && (
                <div>
                  <span className="font-medium">Substance Use:</span> {data.substanceUse.length} item(s) selected
                </div>
              )}
              {data.safetyTrauma.length > 0 && (
                <div>
                  <span className="font-medium">Safety & Trauma:</span> {data.safetyTrauma.length} item(s) selected
                </div>
              )}
              {data.stressors.length > 0 && (
                <div>
                  <span className="font-medium">Stressors:</span> {data.stressors.length} item(s) selected
                </div>
              )}
              {needsConsent && (
                <div className="pt-2 border-t mt-3 space-y-1">
                  <div>
                    <span className="font-medium">Share with Attorney:</span>{' '}
                    {data.consentAttorney === 'share' ? '✓ Yes' : 
                     data.consentAttorney === 'no_share' ? '✗ No' : '⚠ Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Share with Providers:</span>{' '}
                    {data.consentProvider === 'share' ? '✓ Yes' : 
                     data.consentProvider === 'no_share' ? '✗ No' : '⚠ Not set'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      
      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip this section?</AlertDialogTitle>
            <AlertDialogDescription>
              Any selections you made here will be cleared. Safety-critical items (e.g., self-harm) 
              that were already flagged will remain active for your RN team to review.
              <br /><br />
              You can resume this section later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSkipping}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSkipSection}
              disabled={isSkipping}
            >
              {isSkipping ? 'Skipping...' : 'Skip Section'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Consent Revocation Dialog */}
      <AlertDialog open={showConsentRevoke} onOpenChange={setShowConsentRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Consent Preferences?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your consent choices so you can update them. Your selected 
              experiences will remain, but you'll need to choose your sharing preferences again.
              <br /><br />
              <strong>Note:</strong> You must complete both consent choices before proceeding 
              to the next section of the intake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConsentRevoke}
              disabled={isSaving}
            >
              {isSaving ? 'Updating...' : 'Reset Consent Choices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
