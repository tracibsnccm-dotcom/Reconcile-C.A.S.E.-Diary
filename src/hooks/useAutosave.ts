import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAutosaveProps {
  formData: any;
  step: number;
  caseId?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutosave({ 
  formData, 
  step, 
  caseId,
  enabled = true,
  debounceMs = 3000 
}: UseAutosaveProps) {
  const { toast } = useToast();
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const draftIdRef = useRef<string | null>(null);

  const saveToDatabase = useCallback(async () => {
    if (!enabled) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentData = JSON.stringify({ formData, step });
      
      // Don't save if data hasn't changed
      if (currentData === lastSavedRef.current) return;

      const draftJson = { formData, step };
      const updateData: any = {
        draft_json: draftJson,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      if (draftIdRef.current) {
        // Update existing draft
        const { error } = await supabase
          .from('intake_drafts')
          .update(updateData)
          .eq('id', draftIdRef.current);

        if (error) throw error;
        console.debug('Autosave: draft updated');
      } else {
        // Create new draft
        const insertData: any = {
          owner_user_id: user.id,
          draft_json: draftJson,
          status: 'draft',
        };

        if (caseId) {
          insertData.case_id = caseId;
        }

        const { data, error } = await supabase
          .from('intake_drafts')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          draftIdRef.current = data.id;
          console.debug('Autosave: draft created');
        }
      }

      lastSavedRef.current = currentData;
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [formData, step, caseId, enabled]);

  const scheduleSave = useCallback(() => {
    if (!enabled) return;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveToDatabase();
    }, debounceMs);
  }, [saveToDatabase, debounceMs, enabled]);

  const loadDraft = useCallback(async () => {
    if (!enabled) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from('intake_drafts')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      
      if (data && data.draft_json) {
        draftIdRef.current = data.id;
        const { formData, step } = data.draft_json;
        console.debug('Autosave: draft loaded');
        return {
          formData,
          step,
          updatedAt: data.updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [enabled, caseId]);

  const deleteDraft = useCallback(async () => {
    if (!draftIdRef.current) return;

    try {
      const { error } = await supabase
        .from('intake_drafts')
        .delete()
        .eq('id', draftIdRef.current);

      if (error) throw error;
      
      draftIdRef.current = null;
      lastSavedRef.current = '';
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, []);

  useEffect(() => {
    scheduleSave();
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [scheduleSave]);

  return {
    loadDraft,
    deleteDraft,
    saveNow: saveToDatabase,
  };
}
