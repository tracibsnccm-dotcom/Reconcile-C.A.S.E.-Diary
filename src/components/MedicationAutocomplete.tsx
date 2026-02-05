import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Medication {
  id: string;
  name: string;
  form: string;
  frequency: string;
  startDate: string;
  stopDate?: string;
}

interface MedicationAutocompleteProps {
  medications: Medication[];
  onMedicationsChange: (medications: Medication[]) => void;
}

export function MedicationAutocomplete({ medications, onMedicationsChange }: MedicationAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMed, setCurrentMed] = useState({
    name: '',
    form: '',
    frequency: '',
    startDate: '',
    stopDate: '',
  });
  const searchTimerRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search medications
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('medications_reference')
          .select('*')
          .ilike('search_text', `%${searchQuery.toLowerCase()}%`)
          .limit(10);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Medication search failed:', error);
      }
    }, 300);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: any) => {
    setCurrentMed(prev => ({
      ...prev,
      name: `${suggestion.name} ${suggestion.strength || ''}`.trim(),
      form: suggestion.form || '',
    }));
    setSearchQuery(`${suggestion.name} ${suggestion.strength || ''}`.trim());
    setShowSuggestions(false);
  };

  const handleAddMedication = () => {
    if (!currentMed.name.trim()) return;

    const newMed: Medication = {
      id: Date.now().toString(),
      name: currentMed.name,
      form: currentMed.form,
      frequency: currentMed.frequency,
      startDate: currentMed.startDate,
      stopDate: currentMed.stopDate,
    };

    onMedicationsChange([...medications, newMed]);

    // Reset form
    setCurrentMed({
      name: '',
      form: '',
      frequency: '',
      startDate: '',
      stopDate: '',
    });
    setSearchQuery('');
  };

  const handleRemoveMedication = (id: string) => {
    onMedicationsChange(medications.filter(med => med.id !== id));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div ref={wrapperRef} className="relative">
              <Label htmlFor="med-search">Search Medication</Label>
              <Input
                id="med-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMed(prev => ({ ...prev, name: e.target.value }));
                }}
                placeholder="e.g., Gabapentin 300mg"
                className="mt-1"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-black">
                        {suggestion.form} {suggestion.strength && `• ${suggestion.strength}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="med-form">Form</Label>
                <Select value={currentMed.form} onValueChange={(value) => setCurrentMed(prev => ({ ...prev, form: value }))}>
                  <SelectTrigger id="med-form" className="mt-1">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Liquid">Liquid</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                    <SelectItem value="Topical">Topical</SelectItem>
                    <SelectItem value="Patch">Patch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="med-frequency">Frequency</Label>
                <Input
                  id="med-frequency"
                  value={currentMed.frequency}
                  onChange={(e) => setCurrentMed(prev => ({ ...prev, frequency: e.target.value }))}
                  placeholder="e.g., 2x daily"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="med-start">Start Date</Label>
                <Input
                  id="med-start"
                  type="date"
                  value={currentMed.startDate}
                  onChange={(e) => setCurrentMed(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="med-stop">Stop Date (if applicable)</Label>
                <Input
                  id="med-stop"
                  type="date"
                  value={currentMed.stopDate}
                  onChange={(e) => setCurrentMed(prev => ({ ...prev, stopDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <Button type="button" onClick={handleAddMedication} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </CardContent>
      </Card>

      {medications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Label className="mb-3 block">Current Medications</Label>
            <div className="space-y-2">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{med.name}</div>
                    <div className="text-sm text-black">
                      {med.form && `${med.form} • `}
                      {med.frequency && `${med.frequency} • `}
                      {med.startDate && `Started ${med.startDate}`}
                      {med.stopDate && ` • Stopped ${med.stopDate}`}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMedication(med.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
