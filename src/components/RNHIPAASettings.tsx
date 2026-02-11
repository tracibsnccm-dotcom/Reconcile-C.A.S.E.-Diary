import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, FileCheck, Lock } from "lucide-react";

export function RNHIPAASettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            HIPAA Compliance Status
          </CardTitle>
          <CardDescription>Your account complies with HIPAA security requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium">HIPAA Compliant</div>
                <div className="text-sm text-muted-foreground">All security measures active</div>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Measures</CardTitle>
          <CardDescription>HIPAA-required security features in place</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium">Data Encryption</div>
                <div className="text-sm text-muted-foreground">
                  All PHI is encrypted at rest and in transit using AES-256 encryption
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium">Audit Logging</div>
                <div className="text-sm text-muted-foreground">
                  All access to PHI is logged and monitored for compliance
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium">Access Controls</div>
                <div className="text-sm text-muted-foreground">
                  Role-based access ensures only authorized personnel view PHI
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium">Secure Messaging</div>
                <div className="text-sm text-muted-foreground">
                  All communications are HIPAA-compliant and encrypted
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training & Certification</CardTitle>
          <CardDescription>HIPAA compliance training status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">HIPAA Privacy Rule Training</div>
                <div className="text-sm text-muted-foreground">Completed on Jan 15, 2025</div>
              </div>
              <Badge variant="default">Current</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">HIPAA Security Rule Training</div>
                <div className="text-sm text-muted-foreground">Completed on Jan 15, 2025</div>
              </div>
              <Badge variant="default">Current</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="text-orange-700 dark:text-orange-400">Important Notice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Never share patient information outside the secure portal</li>
            <li>Always verify recipient identity before discussing PHI</li>
            <li>Report any suspected security breaches immediately</li>
            <li>Log out when leaving your workstation unattended</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
