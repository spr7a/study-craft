import { jsPDF } from 'jspdf';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

export type Concept = {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  times_studied?: number;
  last_studied?: string;
};

export type StructuredNotes = {
  introduction: string;
  key_points: string[];
  examples: string[];
  formulas: string[];
  mistakes?: string[];
};

export type ProcessContentResponse = {
  title: string;
  summary: string;
  notes: StructuredNotes;
  concepts: Concept[];
};

export type ConceptTask = Concept & {
  dueDate: string;
  assignedAt?: string;
};

export type RevisionPlan = {
  today_tasks: ConceptTask[];
  upcoming: ConceptTask[];
  weak_concepts: ConceptTask[];
};

export type ProcessContentPayload = {
  transcript: string;
  videoId?: string;
  videoUrl?: string;
  title?: string;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export function processContent(payload: ProcessContentPayload) {
  return request<ProcessContentResponse>(`${API_BASE}/api/content/process`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function markAsStudied(concepts: Concept[], userId = 'demo-user') {
  return request<{ status: string; assigned: number }>(`${API_BASE}/api/content/complete`, {
    method: 'POST',
    body: JSON.stringify({ concepts, user_id: userId }),
  });
}

export function getRevisionPlan(userId = 'demo-user') {
  const url = new URL(`${API_BASE}/api/revision/plan`);
  url.searchParams.set('user_id', userId);
  return request<RevisionPlan>(url.toString());
}

export function downloadNotes(data: ProcessContentResponse) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let cursorY = 60;
  const pageHeight = doc.internal.pageSize.getHeight();

  const sanitize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'video-notes';

  const ensureSpace = (height = 40) => {
    if (cursorY + height > pageHeight - 40) {
      doc.addPage();
      cursorY = 60;
    }
  };

  const addHeading = (text: string) => {
    if (!text) return;
    ensureSpace(32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(text, 40, cursorY);
    cursorY += 24;
  };

  const addParagraph = (text: string) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, 515);
    ensureSpace(lines.length * 16 + 10);
    doc.text(lines, 40, cursorY);
    cursorY += lines.length * 14 + 10;
  };

  const addList = (label: string, items: string[]) => {
    if (!items || items.length === 0) return;
    addHeading(label);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, 495);
      ensureSpace(lines.length * 16);
      doc.text(lines, 50, cursorY);
      cursorY += lines.length * 14;
    });
    cursorY += 10;
  };

  addHeading(data.title);
  addParagraph(`Summary: ${data.summary}`);
  addHeading('Introduction');
  addParagraph(data.notes.introduction);
  addList('Key Points', data.notes.key_points);
  addList('Examples', data.notes.examples);
  addList('Formulas', data.notes.formulas);
  if (data.notes.mistakes) {
    addList('Common Mistakes', data.notes.mistakes);
  }

  if (data.concepts?.length) {
    addHeading('Concepts');
    data.concepts.forEach((concept) => {
      addParagraph(`${concept.name} — Difficulty: ${concept.difficulty}`);
    });
  }

  doc.save(`${sanitize(data.title)}-notes.pdf`);
}
