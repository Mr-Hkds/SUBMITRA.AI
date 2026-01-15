import { FormQuestion, QuestionType } from '../types';

// Map Google Form internal type IDs to our Enum
// Based on Gold Edition heuristics and standard observations
const GOOGLE_TYPE_MAP: Record<number, QuestionType> = {
  0: QuestionType.SHORT_ANSWER,
  1: QuestionType.PARAGRAPH,
  2: QuestionType.MULTIPLE_CHOICE,
  3: QuestionType.DROPDOWN,
  4: QuestionType.CHECKBOXES,
  5: QuestionType.LINEAR_SCALE,
  7: QuestionType.GRID, // Not fully supported but mapped
  9: QuestionType.DATE,
  10: QuestionType.TIME,
};

const truncateTitle = (title: string, maxLength: number = 60): string => {
  if (!title) return 'Untitled Form';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

// Proxy Providers for CORS - Prioritize our own API
const PROXY_PROVIDERS = [
  {
    name: 'Vercel/Local API',
    fetch: async (url: string) => {
      // This routes through Vercel serverless function in prod or vite proxy in dev
      const res = await fetch(`/api/fetch-form?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
      }
      return await res.text();
    }
  },
  {
    name: 'AllOrigins',
    fetch: async (url: string) => {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.contents;
    }
  },
  {
    name: 'CORS Anywhere (Heroku)',
    fetch: async (url: string) => {
      const res = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    }
  }
];

export const fetchAndParseForm = async (url: string): Promise<{ title: string; questions: FormQuestion[] }> => {
  // Sanitize URL - remove query parameters
  const cleanUrl = url.split('?')[0];

  let html = '';
  let lastError;
  const errors: string[] = [];

  for (const proxy of PROXY_PROVIDERS) {
    try {
      console.log(`[FormParser] Fetching via ${proxy.name}...`);
      html = await proxy.fetch(cleanUrl);

      // Validate we got actual form data
      if (html && html.includes('FB_PUBLIC_LOAD_DATA_')) {
        console.log(`[FormParser] ✓ Successfully fetched via ${proxy.name}`);
        break;
      } else {
        throw new Error('Response does not contain valid form data');
      }
    } catch (e: any) {
      const errorMsg = `${proxy.name}: ${e.message}`;
      console.warn(`[FormParser] ${errorMsg}`);
      errors.push(errorMsg);
      lastError = e;
    }
  }

  if (!html || !html.includes('FB_PUBLIC_LOAD_DATA_')) {
    console.error('[FormParser] All proxy methods failed:', errors);
    throw new Error(
      'Unable to load the form. This may be due to:\n' +
      '• The form link is invalid or has been deleted\n' +
      '• The form is not publicly accessible\n' +
      '• Network connectivity issues\n\n' +
      'Please verify the form URL and try again.'
    );
  }

  // Extract Data
  const scriptRegex = /var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\])\s*;/s;
  const match = html.match(scriptRegex);

  if (!match || !match[1]) {
    throw new Error('Invalid form structure. Could not find data payload.');
  }

  try {
    const json = JSON.parse(match[1]);
    return parseGoogleJson(json);
  } catch (e) {
    console.error('[FormParser] JSON Error:', e);
    throw new Error('Failed to parse form data.');
  }
};

const parseGoogleJson = (data: any): { title: string; questions: FormQuestion[] } => {
  const rawTitle = data[1][8] || 'Untitled Form';
  const formTitle = truncateTitle(rawTitle);
  const rawQuestions = data[1][1];

  const questions: FormQuestion[] = [];

  if (!Array.isArray(rawQuestions)) {
    return { title: formTitle, questions: [] };
  }

  rawQuestions.forEach((q: any) => {
    if (!q || !q[1]) return; // Skip invalid entries

    const title = q[1].trim();
    const typeId = q[3];
    let type = GOOGLE_TYPE_MAP[typeId] || QuestionType.UNKNOWN;

    // Fallback/Correction for specific types if map fails
    if (type === QuestionType.UNKNOWN) {
      if (typeId === 0 || typeId === 1) type = QuestionType.SHORT_ANSWER;
      else if (typeId === 2) type = QuestionType.MULTIPLE_CHOICE;
      else if (typeId === 3) type = QuestionType.DROPDOWN;
      else if (typeId === 4) type = QuestionType.CHECKBOXES;
      else if (typeId === 5) type = QuestionType.LINEAR_SCALE;
    }

    const required = q[4] && q[4][0] && q[4][0][2] === 1;

    let options: { value: string }[] = [];

    // Robust Options Extraction
    // Options can be in q[4] directly, or nested in q[4][0], or q[4][0][1] depending on version/type
    let rawOptions = [];

    // Path 1: Direct (Gold Standard for most types) -> [[text, ...], ...]
    if (Array.isArray(q[4]) && q[4].length > 0 && Array.isArray(q[4][0]) && typeof q[4][0][0] === 'string') {
      rawOptions = q[4];
    }
    // Path 2: Nested Container -> [ [[text, ...], ...], otherData ]
    else if (Array.isArray(q[4]) && q[4].length > 0 && Array.isArray(q[4][0]) && Array.isArray(q[4][0][0])) {
      rawOptions = q[4][0];
    }
    // Path 3: Deep Nested (Older logic) -> [ [id, [[text, ...], ...], ...], ... ]
    else if (Array.isArray(q[4]) && q[4].length > 0 && q[4][0] && Array.isArray(q[4][0][1])) {
      rawOptions = q[4][0][1];
    }

    // Checkboxes/Grid specific fix: sometimes in q[4][0][1] even if Path 2 matched partially? 
    // Let's stick to the found rawOptions if valid.

    if (rawOptions && Array.isArray(rawOptions)) {
      rawOptions.forEach((opt: any) => {
        // opt[0] is the option text
        if (opt && typeof opt[0] === 'string' && opt[0] !== "") {
          options.push({ value: opt[0] });
        }
      });
    }

    // Special handling for linear scale
    if (type === QuestionType.LINEAR_SCALE && q[4] && q[4].length > 0) {
      // Linear scale options usually come in a different structure or just labels
      // Often defined by min/max in other fields, but sometimes labels are in q[4]
      // If we didn't find standard options, let's generate 1-5 or 1-10 based on typical scale
      // For MVP, if empty, default to 1-5
      if (options.length === 0) {
        const min = q[4][0][0] || "1"; // often in q[4][0][1] ? complex.
        // Simplification: just 1-5 for now if extraction fails
        options = ['1', '2', '3', '4', '5'].map(v => ({ value: v }));
      }
    }

    console.log(`Parsed Question: "${title}" [${type}] Options: ${options.length}`);

    questions.push({
      id: q[0].toString(),
      title,
      type,
      options,
      required: !!required
    });
  });

  return { title: formTitle, questions };
};