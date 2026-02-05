import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, HelpCircle } from "lucide-react";
import { Consent, Client } from "@/config/rcms";
import { RETURN_WITHIN_7_DAYS, INTAKE_WINDOW_EXPIRED, PAUSE_AND_RESUME_COPY } from "@/config/clientMessaging";

interface IntakeWelcomeProps {
  client: Client;
  consent: Consent;
  sensitiveTag: boolean;
  onClientChange: (client: Client) => void;
  onConsentChange: (consent: Consent) => void;
  onSensitiveChange: (sensitive: boolean) => void;
  onContinue: () => void;
}

export function IntakeWelcome({
  client,
  consent,
  sensitiveTag,
  onClientChange,
  onConsentChange,
  onSensitiveChange,
  onContinue,
}: IntakeWelcomeProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showCaraModal, setShowCaraModal] = useState(false);
  const [caraQuestion, setCaraQuestion] = useState("");
  const [caraLang, setCaraLang] = useState("en");
  const [caraStyle, setCaraStyle] = useState("simple");
  const [caraAnswer, setCaraAnswer] = useState("");
  const [isLoadingCara, setIsLoadingCara] = useState(false);
  const [countdownText, setCountdownText] = useState(`⏳ ${RETURN_WITHIN_7_DAYS}`);

  const VIDEO_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&autoplay=1";

  // 7-day countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const savedExpiry = localStorage.getItem('rcms_expiry_iso');
      if (!savedExpiry) {
        setCountdownText(`⏳ ${RETURN_WITHIN_7_DAYS}`);
        return;
      }

      const ms = new Date(savedExpiry).getTime() - new Date().getTime();
      if (ms <= 0) {
        setCountdownText(`⚠️ ${INTAKE_WINDOW_EXPIRED}`);
        return;
      }

      const days = Math.floor(ms / 86400000);
      const hrs = Math.floor((ms % 86400000) / 3600000);
      setCountdownText(`⏳ You can return within ${days} days ${hrs} hours — progress saves automatically.`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 3600000); // refresh hourly

    return () => clearInterval(interval);
  }, []);

  const handleCaraExplain = async () => {
    if (!caraQuestion.trim()) {
      return;
    }
    
    setIsLoadingCara(true);
    try {
      // This would call your CARA API endpoint
      // For now, we'll show a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCaraAnswer("CARA will help explain this in your preferred language and style. This feature connects to your CARA assistant backend.");
    } catch (error) {
      console.error("CARA error:", error);
      setCaraAnswer("Could not reach CARA at this time. Please try again.");
    } finally {
      setIsLoadingCara(false);
    }
  };

  const handleAskCara = (prefillText?: string) => {
    setCaraQuestion(prefillText || "");
    setCaraAnswer("");
    setShowCaraModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="rcms-welcome">
        <div className="rcms-welcome__copy">
          <h1 className="rcms-welcome__title">Welcome to Your Guided Intake</h1>
          <p className="rcms-welcome__body">
            This step-by-step intake helps us understand your situation and ensure your case receives the care and attention it deserves.
            Most people complete it in about <strong>30 minutes</strong>, but the time may vary depending on how much medical history or medication information you need to share.
          </p>
          <p className="rcms-welcome__body">
            {PAUSE_AND_RESUME_COPY}
          </p>
          
          {/* 7-Day countdown note */}
          <p className="rcms-expiry-note">
            {countdownText}
          </p>

          <div className="rcms-welcome__assist">
            <div className="cara-inline-help">
              <span className="cara-dot"></span>
              <strong>CARA</strong><span className="cara-sub"> — Your Care Reflection Assistant</span>
            </div>
            <p className="rcms-welcome__hint">
              This system is designed to be <strong>interactive</strong> — if you come across a question or term you're unsure about, <strong>CARA</strong> can help clarify and guide you as you complete your intake.
            </p>
            <button 
              className="cara-btn" 
              onClick={() => handleAskCara()}
              type="button"
            >
              ✨ Talk with CARA
            </button>
          </div>

          <div className="rcms-badges">
            <span className="rcms-badge">HIPAA-Aligned</span>
            <span className="rcms-badge">Secure & Encrypted</span>
            <span className="rcms-badge">Save & Resume</span>
          </div>
        </div>

        {/* Explainer video */}
        <div className="rcms-welcome__video">
          <div className="rcms-video__frame">
            <iframe
              src={showVideo ? VIDEO_URL : 'about:blank'}
              title="Intake Explainer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {!showVideo && (
              <div className="rcms-video__overlay" onClick={() => setShowVideo(true)}>
                <button className="rcms-video__play" aria-label="Play explainer video" type="button">
                  ▶
                </button>
                <div className="rcms-video__caption">Watch: How this works (2:10)</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .rcms-welcome {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          align-items: start;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .rcms-welcome {
            grid-template-columns: 1fr;
          }
        }

        .rcms-welcome__title {
          margin: 0 0 6px;
          color: #0f2a6a;
          font-weight: 900;
        }
        .rcms-welcome__body {
          margin: 0 0 8px;
          color: #333;
        }
        .rcms-welcome__assist {
          margin: 10px 0 12px;
        }
        .rcms-welcome__hint {
          margin: 6px 0 10px;
          color: #222;
        }

        .rcms-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .rcms-badge {
          font-size: 0.8rem;
          border: 1px solid #b09837;
          color: #0f2a6a;
          border-radius: 999px;
          padding: 4px 10px;
          background: #fff;
        }

        /* Video */
        .rcms-video__frame {
          position: relative;
          padding-top: 56.25%;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #b09837;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .rcms-video__frame iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: #000;
        }
        .rcms-video__overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }
        .rcms-video__play {
          background: #fff;
          border: 0;
          border-radius: 999px;
          width: 64px;
          height: 64px;
          font-size: 22px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .rcms-video__play:hover {
          transform: scale(1.1);
        }
        .rcms-video__caption {
          margin-top: 8px;
          color: #fff;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        }

        /* CARA bits */
        .cara-inline-help {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f2a6a;
          font-weight: 800;
        }
        .cara-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #0f2a6a;
          display: inline-block;
        }
        .cara-sub {
          color: #333;
          margin-left: 2px;
        }
        .cara-btn {
          border: 2px solid #0f2a6a;
          background: #0f2a6a;
          color: #fff;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cara-btn:hover {
          background: #0a1f4d;
          border-color: #0a1f4d;
        }

        /* Expiry countdown */
        .rcms-expiry-note {
          font-size: 0.9rem;
          color: #0f2a6a;
          font-weight: 700;
          background: #fdf8e1;
          border-left: 4px solid #b09837;
          padding: 6px 10px;
          margin: 8px 0 12px;
          border-radius: 6px;
        }
      `}</style>

      {/* Consent Card */}
      <Card className="p-6 border-2 border-accent">
        <h2 className="text-2xl font-bold text-primary mb-2">Welcome & Consent Gate</h2>
        <p className="text-black mb-6">
          Please tell us your name and how you want us to share information with your care team.
        </p>

        <div className="space-y-6">
          <div>
            <Label htmlFor="client-name" className="flex items-center gap-2 mb-2">
              Client full name
              <button
                className="text-xs text-black hover:text-black"
                onClick={() => handleAskCara("Please explain why you need my full name")}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </Label>
            <Input
              id="client-name"
              value={client.fullName || ""}
              onChange={(e) => onClientChange({ ...client, fullName: e.target.value })}
              placeholder="e.g., Sue Smith"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="consent-attorney"
                checked={consent.scope.shareWithAttorney}
                onCheckedChange={(checked) =>
                  onConsentChange({
                    ...consent,
                    scope: { ...consent.scope, shareWithAttorney: checked as boolean },
                  })
                }
              />
              <Label htmlFor="consent-attorney" className="cursor-pointer flex items-center gap-2">
                Authorize sharing with attorney
                <button
                  className="text-xs text-black hover:text-black"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAskCara("What does authorizing sharing with attorney mean?");
                  }}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="consent-providers"
                checked={consent.scope.shareWithProviders}
                onCheckedChange={(checked) =>
                  onConsentChange({
                    ...consent,
                    scope: { ...consent.scope, shareWithProviders: checked as boolean },
                  })
                }
              />
              <Label htmlFor="consent-providers" className="cursor-pointer flex items-center gap-2">
                Authorize sharing with providers
                <button
                  className="text-xs text-black hover:text-black"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAskCara("What does authorizing sharing with providers mean?");
                  }}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                onConsentChange({
                  ...consent,
                  signed: true,
                  signedAt: new Date().toISOString(),
                });
                onContinue();
              }}
              className="bg-accent hover:bg-accent/90 text-background"
            >
              <Check className="w-4 h-4 mr-2" />
              Agree & Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onConsentChange({ ...consent, signed: false });
                onContinue();
              }}
            >
              Not now
            </Button>
          </div>

          {/* Sensitive Case Banner */}
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="sensitive-tag"
                checked={sensitiveTag}
                onCheckedChange={(checked) => onSensitiveChange(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="sensitive-tag" className="cursor-pointer font-bold flex items-center gap-2">
                  Mark as Sensitive Case
                  <button
                    className="text-xs text-black hover:text-black"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAskCara("What is a sensitive case and why would I mark it?");
                    }}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </Label>
                <p className="text-sm text-black mt-1">
                  (sexual assault, minor, hate-crime) — If checked, your case is restricted and only visible to a limited team with additional protections.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* CARA Modal */}
      <Dialog open={showCaraModal} onOpenChange={setShowCaraModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Ask CARA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cara-question">What would you like help with?</Label>
              <Textarea
                id="cara-question"
                value={caraQuestion}
                onChange={(e) => setCaraQuestion(e.target.value)}
                placeholder="Type or paste the question you want explained or translated…"
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cara-modal-lang">Language</Label>
                <Select value={caraLang} onValueChange={setCaraLang}>
                  <SelectTrigger id="cara-modal-lang" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ht">Kreyòl Ayisyen</SelectItem>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cara-modal-style">Style</Label>
                <Select value={caraStyle} onValueChange={setCaraStyle}>
                  <SelectTrigger id="cara-modal-style" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple & clear</SelectItem>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleCaraExplain} 
              disabled={isLoadingCara || !caraQuestion.trim()}
              className="w-full"
            >
              {isLoadingCara ? "Thinking..." : "Explain / Translate"}
            </Button>

            {caraAnswer && (
              <Card className="p-4 bg-secondary/20">
                <p className="text-sm whitespace-pre-wrap">{caraAnswer}</p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
