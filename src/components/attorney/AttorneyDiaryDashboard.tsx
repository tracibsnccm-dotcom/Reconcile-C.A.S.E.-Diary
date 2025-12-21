// src/components/attorney/AttorneyDiaryDashboard.tsx

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export const AttorneyDiaryDashboard: React.FC = () => {
  // Mock data for now
  const clientEntries = [
    { id: 1, date: "2024-03-15", physical: 1, psychological: 2, psychosocial: 3, professional: 1, notes: "Severe pain, couldn't sleep" },
    { id: 2, date: "2024-03-14", physical: 2, psychological: 3, psychosocial: 4, professional: 2, notes: "Moderate pain, some improvement" },
    { id: 3, date: "2024-03-13", physical: 1, psychological: 1, psychosocial: 2, professional: 1, notes: "Very bad day, bedridden" },
  ];

  const calculateAverage = (entries: any[], key: string) => {
    const sum = entries.reduce((acc, entry) => acc + entry[key], 0);
    return (sum / entries.length).toFixed(1);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Attorney Dashboard - C.A.S.E. Diary</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review your client's diary entries and track their 4Ps scores over time.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Client Summary */}
          <div>
            <h3 className="text-md font-semibold mb-2">Client: John Doe (Case: PI-2024-001)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold">{calculateAverage(clientEntries, 'physical')}</div>
                <div className="text-xs text-gray-600">Physical Avg</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold">{calculateAverage(clientEntries, 'psychological')}</div>
                <div className="text-xs text-gray-600">Psychological Avg</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold">{calculateAverage(clientEntries, 'psychosocial')}</div>
                <div className="text-xs text-gray-600">Psychosocial Avg</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold">{calculateAverage(clientEntries, 'professional')}</div>
                <div className="text-xs text-gray-600">Professional Avg</div>
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div>
            <h3 className="text-md font-semibold mb-2">Recent Diary Entries</h3>
            <div className="space-y-3">
              {clientEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium">{entry.date}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">P: {entry.physical}/5</Badge>
                      <Badge variant="outline" className="text-xs">S: {entry.psychological}/5</Badge>
                      <Badge variant="outline" className="text-xs">SO: {entry.psychosocial}/5</Badge>
                      <Badge variant="outline" className="text-xs">W: {entry.professional}/5</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{entry.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Download Client Report
            </Button>
            <Button variant="outline">
              Request More Frequent Entries
            </Button>
            <Button variant="outline">
              Send Message to Client
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
