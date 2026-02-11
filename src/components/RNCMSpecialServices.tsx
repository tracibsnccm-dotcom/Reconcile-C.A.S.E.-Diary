import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  code: string;
  name: string;
  price: number;
  desc: string;
}

const SERVICES: Service[] = [
  { code:'EMRR', name:'Expedited Medical Records Retrieval', price:500,
    desc:'Priority retrieval of records within 48 hours with completeness verification.' },
  { code:'MRAP', name:'Medication Reconciliation & Adherence Plan', price:800,
    desc:'RN review for safety, accuracy, adherence, with practical recommendations.' },
  { code:'CNR',  name:'Clinical Narrative Report', price:850,
    desc:'RN-authored summary of case details, chronology, and milestones.' },
  { code:'HEAS', name:'Hospitalization Event Alert & Summary', price:1100,
    desc:'Immediate alert plus RN-prepared summary of hospitalization/ED event.' },
  { code:'ERHS', name:'ER / Hospital Visit Summary', price:1100,
    desc:'Condensed clinical summary of ER/inpatient episode with next steps.' },
  { code:'PCC',  name:'Provider Coordination Call', price:1200,
    desc:'RN-led coordination call with treating provider(s) to address gaps and documentation.' },
  { code:'IMEL', name:'IME / Peer Review Liaison', price:1200,
    desc:'RN coordination with IME/peer reviewer for context and guideline alignment.' },
  { code:'ECNR', name:'Enhanced Clinical Narrative Report', price:1250,
    desc:'Expanded narrative with clinical reasoning and integrated outcome assessment.' },
  { code:'FIS',  name:'Functional Impact Summary', price:1500,
    desc:'Links medical findings to functional capacity (ADLs, mobility, work impact).' },
  { code:'CTB',  name:'Custom Clinical Timeline Build / Summary', price:2200,
    desc:'Visual timeline of encounters, diagnostics, and interventions for demand packages.' },
  { code:'RNMNA',name:'RN Clinical Review & Medical Necessity Analysis', price:3950,
    desc:'Full clinical review with ODG/MCG validation, gaps, and written justification.' },
  { code:'PFCPA',name:'Prognosis & Future Care Projection Addendum', price:4200,
    desc:'Projected future medical needs based on trajectory and standards of care.' },
  { code:'CHIU', name:'Case Health Index Update', price:4500,
    desc:'Quarterly snapshot of adherence, red flags, and resolution readiness.' },
  { code:'DPP',  name:'Deposition Prep Packet (Clinical)', price:7200,
    desc:'Comprehensive RN packet with chronology, data points, and exhibits.' },
];

const CHECKOUT: Record<string, string> = {
  EMRR: 'https://checkout.example/EMRR',
  MRAP: 'https://checkout.example/MRAP',
  CNR:  'https://checkout.example/CNR',
  HEAS: 'https://checkout.example/HEAS',
  ERHS: 'https://checkout.example/ERHS',
  PCC:  'https://checkout.example/PCC',
  IMEL: 'https://checkout.example/IMEL',
  ECNR: 'https://checkout.example/ECNR',
  FIS:  'https://checkout.example/FIS',
  CTB:  'https://checkout.example/CTB',
  RNMNA:'https://checkout.example/RNMNA',
  PFCPA:'https://checkout.example/PFCPA',
  CHIU: 'https://checkout.example/CHIU',
  DPP:  'https://checkout.example/DPP',
};

interface RNCMSpecialServicesProps {
  walletBalance?: number;
  isSubscriber?: boolean;
  caseId?: string;
  attorneyId?: string;
}

export function RNCMSpecialServices({ 
  walletBalance = 0, 
  isSubscriber = false,
  caseId,
  attorneyId 
}: RNCMSpecialServicesProps) {
  const { toast } = useToast();

  const walletDiscountPct = (balance: number) => {
    if (balance >= 5000) return 0.30;
    if (balance >= 1500) return 0.20;
    return 0.10;
  };

  const fmtUSD = (n: number) => 
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handlePayCard = (service: Service) => {
    const url = CHECKOUT[service.code] || '#';
    if (url === '#') {
      toast({
        title: "Error",
        description: "Checkout link missing. Please contact support.",
        variant: "destructive"
      });
      return;
    }
    window.location.href = url;
  };

  const handlePayWallet = (service: Service) => {
    if (!isSubscriber) {
      toast({
        title: "Subscribers Only",
        description: "eWallet discounts are available to subscribers only.",
        variant: "destructive"
      });
      return;
    }

    const discount = walletDiscountPct(walletBalance);
    const final = Math.round((1 - discount) * service.price);
    
    if (walletBalance < final) {
      toast({
        title: "Insufficient Funds",
        description: "Insufficient eWallet funds. Please top up to use your discount.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Order Placed",
      description: `${service.name} — paid via eWallet (${Math.round(discount*100)}% off).`
    });
  };

  return (
    <section id="rcms-referral-card" className="my-8">
      <h2 className="text-[1.6rem] font-extrabold mb-2 text-foreground">RN CM Special Services</h2>
      <p className="text-muted-foreground mb-1">
        Order à la carte clinical services. Purchases are linked to your case and routed to our RN Care Management team.
      </p>
      <p className="text-[#333] mb-4 text-[1rem] leading-relaxed">
        ⚖️ <strong className="text-[#0f2a6a]">Refund Policy:</strong> There are no cash refunds. Refunds, if granted, are issued as credits to the account or applied toward another service.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((service) => {
          const showWallet = isSubscriber;
          const discount = showWallet ? walletDiscountPct(walletBalance) : 0;
          const walletPrice = Math.max(0, Math.round((1 - discount) * service.price));

          return (
            <article 
              key={service.code}
              className="border-2 rounded-xl p-4 bg-card shadow-md flex flex-col justify-between min-h-[240px]"
              style={{ borderColor: '#b09837' }}
            >
              <header>
                <h3 className="font-extrabold mb-2" style={{ color: '#0f2a6a' }}>
                  {service.name}
                </h3>
                <p className="text-[0.96rem] text-foreground/80 mb-3">
                  {service.desc}
                </p>
                <div className="font-extrabold text-[1.05rem] mb-2">
                  <div>Price: {fmtUSD(service.price)}</div>
                  {showWallet && (
                    <div>eWallet: {fmtUSD(walletPrice)}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {caseId && (
                    <span className="inline-block text-xs px-2 py-1 rounded-full border bg-amber-50 text-foreground" style={{ borderColor: '#b09837' }}>
                      Case: {caseId}
                    </span>
                  )}
                  {showWallet && (
                    <span className="inline-block text-xs px-2 py-1 rounded-full border bg-amber-50 text-foreground" style={{ borderColor: '#b09837' }}>
                      eWallet {Math.round(discount*100)}% tier
                    </span>
                  )}
                </div>
              </header>
              
              <div className="flex gap-2 flex-wrap mt-4">
                <button
                  onClick={() => handlePayCard(service)}
                  className="px-3 py-2 rounded-lg font-bold text-white border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    backgroundColor: '#0f2a6a', 
                    borderColor: '#0f2a6a',
                    outlineColor: '#b09837'
                  }}
                >
                  Pay with Card
                </button>
                {showWallet && (
                  <button
                    onClick={() => handlePayWallet(service)}
                    className="px-3 py-2 rounded-lg font-bold border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ 
                      backgroundColor: '#b09837', 
                      borderColor: '#b09837',
                      color: '#000',
                      outlineColor: '#b09837'
                    }}
                  >
                    Pay with eWallet
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
