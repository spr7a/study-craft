import { API_BASE } from './content';

export type TutorMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type TutorResponse = {
  reply: string;
  weak_concepts?: Array<{
    name: string;
    difficulty: string;
    dueDate?: string;
  }>;
};

export async function sendTutorMessage({
  message,
  history = [],
  context = '',
  userId = 'demo-user',
}: {
  message: string;
  history?: TutorMessage[];
  context?: string;
  userId?: string;
}): Promise<TutorResponse> {
  const response = await fetch(`${API_BASE}/api/tutor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, context, user_id: userId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Tutor is unavailable');
  }

  return response.json();
}
