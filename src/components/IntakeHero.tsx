import { useState } from 'react';

interface IntakeHeroProps {
  onOpenCara?: () => void;
}

export function IntakeHero({ onOpenCara }: IntakeHeroProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&autoplay=1';

  const handleVideoClick = () => {
    setVideoLoaded(true);
  };

  return (
    <section className="rcms-welcome">
      <div className="rcms-welcome__copy">
        <h1 className="rcms-welcome__title">Welcome to Your Guided Intake</h1>
        <p className="rcms-welcome__body">
          This step-by-step intake helps us understand your situation and ensure your case receives the care and attention it deserves.
          Most people complete it in about <strong>30 minutes</strong>, but the time may vary depending on how much medical history or medication information you need to share.
        </p>
        <p className="rcms-welcome__body">
          You can <strong>pause anytime</strong> and come back within <strong>7 days</strong> to finish. Your progress saves automatically, and all information is kept private and secure.
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
            onClick={onOpenCara}
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
            src={videoLoaded ? VIDEO_URL : 'about:blank'}
            title="Intake Explainer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {!videoLoaded && (
            <div className="rcms-video__overlay" onClick={handleVideoClick}>
              <button className="rcms-video__play" aria-label="Play explainer video" type="button">
                ▶
              </button>
              <div className="rcms-video__caption">Watch: How this works (2:10)</div>
            </div>
          )}
        </div>
      </div>

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
      `}</style>
    </section>
  );
}
