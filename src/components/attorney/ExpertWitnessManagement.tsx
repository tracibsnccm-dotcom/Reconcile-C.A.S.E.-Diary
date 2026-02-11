import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Phone, Mail, DollarSign, FileText, Star } from "lucide-react";

interface ExpertWitness {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  hourlyRate: number;
  phone: string;
  email: string;
  rating: number;
  casesWorked: number;
  lastUsed?: string;
  notes?: string;
}

export function ExpertWitnessManagement() {
  const [witnesses, setWitnesses] = useState<ExpertWitness[]>([
    {
      id: "1",
      name: "Dr. Sarah Mitchell",
      specialty: "Orthopedic Surgery",
      credentials: "MD, Board Certified",
      hourlyRate: 500,
      phone: "(555) 123-4567",
      email: "dr.mitchell@medical.com",
      rating: 5,
      casesWorked: 23,
      lastUsed: "2024-02-15",
      notes: "Excellent courtroom presence. Strong in complex spine cases."
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");

  const filteredWitnesses = witnesses.filter(w => 
    (w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     w.specialty.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterSpecialty === "all" || w.specialty === filterSpecialty)
  );

  const specialties = Array.from(new Set(witnesses.map(w => w.specialty)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expert Witness Network</h2>
          <p className="text-muted-foreground">Manage your trusted expert witnesses</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Expert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Expert Witness</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input placeholder="Dr. John Smith" />
                </div>
                <div>
                  <Label>Specialty</Label>
                  <Input placeholder="Neurology" />
                </div>
              </div>
              <div>
                <Label>Credentials</Label>
                <Input placeholder="MD, PhD, Board Certified" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hourly Rate</Label>
                  <Input type="number" placeholder="500" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="expert@medical.com" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea placeholder="Experience, strengths, case types..." rows={3} />
              </div>
              <Button>Save Expert</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search experts by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredWitnesses.map((witness) => (
          <Card key={witness.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{witness.name}</h3>
                  <Badge variant="secondary">{witness.specialty}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{witness.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{witness.credentials}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{witness.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{witness.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${witness.hourlyRate}/hour</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{witness.casesWorked} cases</span>
                  </div>
                </div>

                {witness.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                    {witness.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Contact
                </Button>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
