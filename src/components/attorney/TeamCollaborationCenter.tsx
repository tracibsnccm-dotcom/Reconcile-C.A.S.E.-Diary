import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, FileText, Video, Plus, Send } from "lucide-react";

const teamMembers = [
  { name: "Sarah Johnson", role: "Paralegal", status: "online", avatar: "SJ", caseload: 12 },
  { name: "Michael Chen", role: "Associate Attorney", status: "online", avatar: "MC", caseload: 8 },
  { name: "Emily Rodriguez", role: "Legal Assistant", status: "away", avatar: "ER", caseload: 15 },
  { name: "David Park", role: "Case Manager", status: "offline", avatar: "DP", caseload: 10 },
];

const messages = [
  { from: "Sarah Johnson", message: "Updated the medical records summary for C-2024-1892", time: "10:30 AM", avatar: "SJ" },
  { from: "Michael Chen", message: "Settlement demand letter ready for review", time: "Yesterday", avatar: "MC" },
  { from: "Emily Rodriguez", message: "Client requested callback regarding treatment plan", time: "Yesterday", avatar: "ER" },
];

const sharedDocuments = [
  { name: "Case Strategy Template.docx", sharedBy: "Michael Chen", date: "2024-06-25", category: "Templates" },
  { name: "Medical Chronology Format.xlsx", sharedBy: "Sarah Johnson", date: "2024-06-24", category: "Templates" },
  { name: "Q2 Performance Report.pdf", sharedBy: "You", date: "2024-06-20", category: "Reports" },
];

export function TeamCollaborationCenter() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="shared">Shared Files</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Team Members</h3>
                <p className="text-sm text-muted-foreground">4 members online</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member, idx) => (
                <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                            member.status === "online"
                              ? "bg-green-500"
                              : member.status === "away"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{member.caseload} cases</Badge>
                      <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Caseload</div>
              <div className="text-2xl font-bold">45</div>
              <div className="text-xs text-muted-foreground mt-1">Across team</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avg per Member</div>
              <div className="text-2xl font-bold">11.25</div>
              <div className="text-xs text-muted-foreground mt-1">Cases</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Team Efficiency</div>
              <div className="text-2xl font-bold text-green-600">92%</div>
              <div className="text-xs text-muted-foreground mt-1">This month</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Team Chat</h3>
            </div>

            <div className="space-y-4 mb-6">
              {messages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{msg.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{msg.from}</span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input placeholder="Type a message..." />
              <Button>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Shared Documents</h3>
                <p className="text-sm text-muted-foreground">Team knowledge base</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Share File
              </Button>
            </div>

            <div className="space-y-3">
              {sharedDocuments.map((doc, idx) => (
                <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Shared by {doc.sharedBy} • {doc.date}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{doc.category}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Team Meetings</h3>
                <p className="text-sm text-muted-foreground">Schedule and manage meetings</p>
              </div>
              <Button>
                <Video className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { title: "Weekly Case Review", date: "2024-06-28", time: "10:00 AM", attendees: 4, type: "Recurring" },
                { title: "Strategy Session - Johnson Case", date: "2024-06-27", time: "2:00 PM", attendees: 3, type: "One-time" },
                { title: "Client Meeting Prep", date: "2024-06-29", time: "11:00 AM", attendees: 2, type: "One-time" },
              ].map((meeting, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{meeting.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {meeting.date} at {meeting.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{meeting.type}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        <Users className="inline h-3 w-3 mr-1" />
                        {meeting.attendees} attendees
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
