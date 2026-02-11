import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Languages, Globe } from "lucide-react";

export function AttorneyLanguagePreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        // Extract language preferences if stored
        setLanguage((data as any).language || "en");
        setDateFormat((data as any).date_format || "MM/DD/YYYY");
        setTimeFormat((data as any).time_format || "12h");
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
        } as any);

      if (error) throw error;
      toast.success("Language preferences saved");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-primary" />
          Language & Region
        </CardTitle>
        <CardDescription>
          Customize language and regional formatting preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Display Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
                <SelectItem value="it">Italiano (Italian)</SelectItem>
                <SelectItem value="pt">Português (Portuguese)</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                <SelectItem value="ko">한국어 (Korean)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Interface language for the platform
            </p>
          </div>

          <div className="pt-4 border-t space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Regional Formats
            </h3>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (German)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Example: {new Date().toLocaleDateString('en-US')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger id="time-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (3:30 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (15:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Language changes will take effect after refreshing the page. 
            Some legal terminology may remain in English for accuracy.
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}