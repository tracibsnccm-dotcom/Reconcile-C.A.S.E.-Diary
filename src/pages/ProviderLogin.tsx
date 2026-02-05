import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ProviderLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700 p-4">
      <Card className="p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-black mb-4">Provider Portal</h1>
        <p className="text-gray-600">Provider access coming soon.</p>
        <p className="text-gray-600 mt-2">Medical providers will be able to submit clinical information here.</p>
        <Link to="/" className="mt-6 inline-block text-purple-600 hover:text-purple-800 underline">
          Return to Home
        </Link>
      </Card>
    </div>
  );
}
