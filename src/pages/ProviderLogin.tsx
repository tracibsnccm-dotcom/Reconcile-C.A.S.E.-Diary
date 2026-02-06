import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ProviderLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] p-4">
      <Card className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Portal</h1>
        <p className="text-gray-700">Provider access coming soon.</p>
        <p className="text-gray-600 mt-2">Medical providers will be able to submit clinical information here.</p>
        <Link to="/" className="mt-6 inline-block text-[#3b6a9b] hover:text-[#2d5480] hover:underline font-medium">
          Return to Home
        </Link>
      </Card>
    </div>
  );
}
