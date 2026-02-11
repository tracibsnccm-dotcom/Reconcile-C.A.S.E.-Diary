import { AlertCircle } from "lucide-react";

export function SupportFooter() {
  return (
    <div className="bg-rcms-navy p-8 rounded-lg border-2 border-rcms-gold shadow-xl">
      <div className="text-center space-y-5">
        <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-rcms-gold" />
          ⚠️ In Crisis?
        </h3>
        <div className="space-y-4 text-white">
          <p className="text-base md:text-lg leading-relaxed">
            If you are experiencing a medical or mental health emergency, call{" "}
            <a href="tel:911" className="font-bold text-2xl md:text-3xl text-red-600 hover:text-red-500 transition-colors">
              911
            </a>{" "}
            immediately.
          </p>
          <p className="text-base md:text-lg leading-relaxed">
            If you are in emotional distress or having thoughts of harming yourself or someone else, call or text{" "}
            <a href="tel:988" className="font-bold text-2xl md:text-3xl text-red-600 hover:text-red-500 transition-colors">
              988
            </a>{" "}
            to connect with the Suicide & Crisis Lifeline (available 24/7).
          </p>
        </div>
      </div>
    </div>
  );
}
