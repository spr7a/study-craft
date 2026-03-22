import { useCallback, useState } from 'react';
import {
  processContent,
  markAsStudied,
  getRevisionPlan,
  downloadNotes,
  ProcessContentPayload,
  ProcessContentResponse,
  RevisionPlan,
} from '../services/content';

export function useContent(userId = 'demo-user') {
  const [content, setContent] = useState<ProcessContentResponse | null>(null);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const runProcess = useCallback(async (payload: ProcessContentPayload) => {
    setIsProcessing(true);
    setMessage('');
    setError('');
    try {
      const result = await processContent(payload);
      setContent(result);
      setMessage('Structured notes ready');
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process content';
      setError(msg);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const markStudied = useCallback(async () => {
    if (!content?.concepts?.length) return null;
    setIsMarking(true);
    setError('');
    try {
      await markAsStudied(content.concepts, userId);
      setMessage('Study session saved');
      const plan = await getRevisionPlan(userId);
      setRevisionPlan(plan);
      return plan;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save study session';
      setError(msg);
      throw err;
    } finally {
      setIsMarking(false);
    }
  }, [content, userId]);

  const refreshRevisionPlan = useCallback(async () => {
    try {
      const plan = await getRevisionPlan(userId);
      setRevisionPlan(plan);
      return plan;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch revision plan';
      setError(msg);
      return null;
    }
  }, [userId]);

  const downloadCurrentNotes = useCallback(() => {
    if (content) {
      downloadNotes(content);
    }
  }, [content]);

  return {
    content,
    revisionPlan,
    isProcessing,
    isMarking,
    message,
    error,
    runProcess,
    markStudied,
    refreshRevisionPlan,
    downloadCurrentNotes,
  };
}
