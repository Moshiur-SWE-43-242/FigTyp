/**
 * Hook to fetch CMS content
 * Usage: const timeline = useCMSContent('timeline');
 */

import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface CMSItem {
  _id?: string;
  contentType: string;
  key: string;
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  date?: string;
  color?: string;
  data?: any;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const useCMSContent = (contentType: string) => {
  const [content, setContent] = useState<CMSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/cms/type/${contentType}`);
        
        if (res.ok) {
          const data = await res.json();
          setContent(data);
          setError(null);
        } else {
          setError('Failed to fetch content');
        }
      } catch (err) {
        console.error('Failed to fetch CMS content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentType]);

  return { content, loading, error };
};

export const getCMSContentByKey = async (key: string): Promise<CMSItem | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cms/key/${key}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch CMS content by key:', error);
    return null;
  }
};
