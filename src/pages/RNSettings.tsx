import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RNProfileSettings } from "@/components/RNProfileSettings";
import { RNContactInfo } from "@/components/RNContactInfo";
import { RNAvailabilitySettings } from "@/components/RNAvailabilitySettings";
import { RNCommunicationPreferences } from "@/components/RNCommunicationPreferences";
import { RNSecuritySettings } from "@/components/RNSecuritySettings";
import { RNHIPAASettings } from "@/components/RNHIPAASettings";
import { RNPerformanceView } from "@/components/RNPerformanceView";
import { RNActivityLog } from "@/components/RNActivityLog";
import { RNDataExport } from "@/components/RNDataExport";
import { RNSessionManagement } from "@/components/RNSessionManagement";
import { User, Phone, Calendar, MessageSquare, Shield, FileText, BarChart3, Activity, Download, Monitor } from "lucide-react";

export default function RNSettings() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0f2a6a]">RN CM Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, availability, HIPAA compliance, and communication preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Contact</span>
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Availability</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Communication</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="hipaa" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>HIPAA</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile">
            <RNProfileSettings />
          </TabsContent>

          <TabsContent value="contact">
            <RNContactInfo />
          </TabsContent>

          <TabsContent value="availability">
            <RNAvailabilitySettings />
          </TabsContent>

          <TabsContent value="communication">
            <RNCommunicationPreferences />
          </TabsContent>

          <TabsContent value="security">
            <RNSecuritySettings />
          </TabsContent>

          <TabsContent value="hipaa">
            <RNHIPAASettings />
          </TabsContent>

          <TabsContent value="performance">
            <RNPerformanceView />
          </TabsContent>

          <TabsContent value="activity">
            <RNActivityLog />
          </TabsContent>

          <TabsContent value="sessions">
            <RNSessionManagement />
          </TabsContent>

          <TabsContent value="export">
            <RNDataExport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
