import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { PLAN_TIERS_CATALOG, PlanTier } from "@/data/planTiersCatalog";

interface TierServicesMatrixProps {
  currentTier?: string | null;
}

export function TierServicesMatrix({ currentTier = "Basic" }: TierServicesMatrixProps) {
  const normalizedCurrentTier = currentTier || "Basic";

  return (
    <Card className="border-[#e9e9e9] shadow-sm">
      <CardHeader className="bg-[#0f2a6a] text-white rounded-t-2xl">
        <CardTitle>What's Included in Your Plan</CardTitle>
        <p className="text-sm text-white/80 mt-2">
          Compare features across Basic, Clinical, and Premium tiers.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f7f7f7] hover:bg-[#f7f7f7]">
                <TableHead className="font-bold text-[#0f2a6a] w-1/4" scope="col">
                  Feature
                </TableHead>
                {PLAN_TIERS_CATALOG.tiers.map((tier) => (
                  <TableHead
                    key={tier}
                    className="text-center font-bold text-[#0f2a6a] border-l-2 border-[#b09837]"
                    scope="col"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>{tier}</span>
                      {tier === normalizedCurrentTier && (
                        <Badge className="bg-[#b09837] hover:bg-[#b09837] text-black text-xs">
                          Your Plan
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLAN_TIERS_CATALOG.features.map((feature, idx) => (
                <TableRow
                  key={feature.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-[#f7f7f7]"}
                >
                  <TableCell className="font-medium" scope="row">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{feature.label}</span>
                        {feature.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-[#128f8b] cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                  {Object.entries(feature.tooltip).map(([tier, text]) => (
                                    <div key={tier}>
                                      <p className="font-semibold text-[#0f2a6a]">{tier}:</p>
                                      <p className="text-sm">{text}</p>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </TableCell>
                  {PLAN_TIERS_CATALOG.tiers.map((tier) => (
                    <TableCell
                      key={tier}
                      className="text-center border-l-2 border-[#b09837]/20"
                    >
                      <span className="text-sm">
                        {feature.availability[tier]}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Accordion View */}
        <div className="md:hidden p-4">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {PLAN_TIERS_CATALOG.features.map((feature) => (
              <AccordionItem key={feature.id} value={feature.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{feature.label}</span>
                      {feature.tooltip && (
                        <Info className="h-4 w-4 text-[#128f8b]" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    {PLAN_TIERS_CATALOG.tiers.map((tier) => (
                      <div
                        key={tier}
                        className="flex justify-between items-start p-3 bg-[#f7f7f7] rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0f2a6a]">{tier}</span>
                          {tier === normalizedCurrentTier && (
                            <Badge className="bg-[#b09837] hover:bg-[#b09837] text-black text-xs">
                              Your Plan
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-right flex-1 ml-2">
                          {feature.availability[tier]}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
