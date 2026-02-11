import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'case' | 'client' | 'document';
  title: string;
  subtitle: string;
  link: string;
  metadata?: any;
}

export const useGlobalSearch = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchAll = async () => {
      setIsLoading(true);
      try {
        const searchTerm = `%${query}%`;
        const allResults: SearchResult[] = [];

        // Search cases  
        const { data: cases } = await supabase
          .from('cases')
          .select('id, status, created_at')
          .ilike('status', searchTerm)
          .limit(5);

        if (cases) {
          allResults.push(
            ...cases.map((c) => ({
              id: c.id,
              type: 'case' as const,
              title: `Case: RC-${c.id.substring(0, 8)}`,
              subtitle: c.status,
              link: `/case-detail/${c.id}`,
              metadata: c,
            }))
          );
        }

        // Search profiles (clients)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, email')
          .or(`display_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
          .limit(5);

        if (profiles) {
          allResults.push(
            ...profiles.map((p) => ({
              id: p.id,
              type: 'client' as const,
              title: p.display_name || 'Unknown',
              subtitle: p.email || '',
              link: `/client-portal`, // Could be enhanced with client detail page
              metadata: p,
            }))
          );
        }

        // Search documents
        const { data: documents } = await supabase
          .from('documents')
          .select('id, file_name, document_type, case_id')
          .ilike('file_name', searchTerm)
          .limit(5);

        if (documents) {
          allResults.push(
            ...documents.map((d) => ({
              id: d.id,
              type: 'document' as const,
              title: d.file_name,
              subtitle: d.document_type || 'Document',
              link: `/documents?doc=${d.id}`,
              metadata: d,
            }))
          );
        }

        setResults(allResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchAll, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { results, isLoading };
};
