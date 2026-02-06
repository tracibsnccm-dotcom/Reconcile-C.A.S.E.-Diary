import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare } from "lucide-react";

interface ClientMessagingProps {
  caseId: string;
}

/**
 * Secure messaging placeholder for C.A.S.E. client portal.
 * Full messaging (client_direct_messages, team members) requires authenticated client identity.
 * Clients sign in with case number + PIN (sessionStorage); messaging can be enabled when
 * client account is linked to Supabase auth.
 */
export function ClientMessaging({ caseId: _caseId }: ClientMessagingProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Messages
          </CardTitle>
          <CardDescription>Communicate with your care team</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-slate-50 border-slate-200">
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              Secure messaging with your care team will appear here once your account is fully linked.
              For now, please contact your attorney&apos;s office with any questions or updates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
