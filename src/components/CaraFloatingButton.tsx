import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export const CaraFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [style, setStyle] = useState('simple');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    setAnswer('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAnswer('Please sign in to use CARA.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cara-suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: 'explain',
          text: question,
          style: style,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnswer(result.answer || 'CARA could not generate a response.');
      } else {
        setAnswer('Could not reach CARA. Please try again.');
      }
    } catch (error) {
      console.error('CARA error:', error);
      setAnswer('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Desktop FAB */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-5 bottom-5 z-50 rounded-full shadow-lg h-14 px-5 hidden md:flex"
        size="lg"
      >
        ✨ Talk with CARA
      </Button>

      {/* Mobile bottom bar */}
      <div className="fixed left-0 right-0 bottom-0 p-2 bg-background/95 backdrop-blur border-t z-50 md:hidden">
        <Button onClick={() => setIsOpen(true)} className="w-full" size="lg">
          ✨ CARA
        </Button>
      </div>

      {/* CARA Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Ask CARA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cara-question">What would you like help with?</Label>
              <Textarea
                id="cara-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type or paste the question you want explained…"
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="cara-style">Response Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger id="cara-style" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple & clear</SelectItem>
                  <SelectItem value="encouraging">Encouraging</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExplain} 
              disabled={isLoading || !question.trim()}
              className="w-full"
            >
              {isLoading ? 'Thinking...' : 'Explain / Translate'}
            </Button>

            {answer && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
