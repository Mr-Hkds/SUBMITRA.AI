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

const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

const truncateTitle = (title: string, maxLength: number = 60): string => {
  if (!title) return 'Untitled Form';
  const decoded = decodeHtmlEntities(title);
  if (decoded.length <= maxLength) return decoded;
  return decoded.substring(0, maxLength) + '...';
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

export const fetchAndParseForm = async (url: string): Promise<{ title: string; questions: FormQuestion[]; hiddenFields?: Record<string, string> }> => {
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
  const wizRegex = /window\.WIZ_global_data\s*=\s*(\{.+?\})\s*;/s; // Alternative source

  const match = html.match(scriptRegex);
  const wizMatch = html.match(wizRegex);

  let jsonData: any = null;

  if (match && match[1]) {
    try {
      jsonData = JSON.parse(match[1]);
    } catch (e) {
      console.warn('[FormParser] Failed to parse FB_PUBLIC_LOAD_DATA_, trying fallback...', e);
    }
  }

  // If FB data is missing or invalid, try WIZ_global_data (found in newer forms)
  if (!jsonData && wizMatch && wizMatch[1]) {
    try {
      const wizData = JSON.parse(wizMatch[1]);
      // Search for the array structure that resembles FB_PUBLIC_LOAD_DATA_ inside WIZ data
      // This is a heuristic based on known Google Form structures in WIZ data
      Object.keys(wizData).forEach(key => {
        const val = wizData[key];
        if (Array.isArray(val) && val.length > 1 && Array.isArray(val[1]) && val[1].length > 1) {
          jsonData = val;
        }
      });
    } catch (e) {
      console.error('[FormParser] Failed to parse WIZ_global_data', e);
    }
  }

  if (!jsonData) {
    throw new Error('Invalid form structure. Could not find data payload.');
  }

  try {
    // Extract fallback title from HTML
    const metaTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) || html.match(/<meta\s+name="title"\s+content="([^"]*)"/i);
    const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);

    let htmlTitle = metaTitleMatch ? metaTitleMatch[1] : (titleTagMatch ? titleTagMatch[1] : '');
    htmlTitle = htmlTitle.replace(/ - Google Forms$/, ''); // Clean suffix

    const json = jsonData;

    // Extract hidden inputs (like fbzx, pageHistory, etc.) from HTML
    // These are CRITICAL for avoiding "fake success" and getting rejected by Google
    const hiddenFields: Record<string, string> = {};
    const hiddenInputRegex = /<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"/g;
    let inputMatch;
    while ((inputMatch = hiddenInputRegex.exec(html)) !== null) {
      if (inputMatch[1] && inputMatch[2]) {
        hiddenFields[inputMatch[1]] = inputMatch[2];
      }
    }

    // Also look for fbzx in the JSON payload just in case (often in data[1][25] or similar)
    // but the HTML input is the most reliable source if present.

    const result = parseGoogleJson(json, decodeHtmlEntities(htmlTitle));
    return { ...result, hiddenFields };
  } catch (e) {
    console.error('[FormParser] JSON Error:', e);
    throw new Error('Failed to parse form data.');
  }
};

const parseGoogleJson = (data: any, fallbackTitle: string = ''): { title: string; questions: FormQuestion[] } => {
  // Try multiple locations for the title
  let rawTitle = data[1][8];

  // If undefined or generic, try data[3] (verified alt location)
  if (!rawTitle || rawTitle === 'Untitled Form') {
    if (data[3] && typeof data[3] === 'string') rawTitle = data[3];
  }

  // If still untitled, use HTML fallback
  if ((!rawTitle || rawTitle === 'Untitled Form') && fallbackTitle) {
    rawTitle = fallbackTitle;
  }

  const formTitle = truncateTitle(rawTitle || 'Untitled Form');
  const rawQuestions = data[1][1];

  const questions: FormQuestion[] = [];
  let currentPageIndex = 0;

  if (!Array.isArray(rawQuestions)) {
    return { title: formTitle, questions: [] };
  }

  rawQuestions.forEach((q: any) => {
    if (!q) return;

    const typeId = q[3];

    // Detect Page Break / Section Header (Type 8)
    if (typeId === 8) {
      currentPageIndex++;
      console.log(`[FormParser] Detected Page Break. Switching to Page ${currentPageIndex}`);
      return;
    }

    if (!q[1]) return; // Skip invalid entries (like images/videos without titles)

    let type = GOOGLE_TYPE_MAP[typeId] || QuestionType.UNKNOWN;

    // Fallback/Correction for specific types if map fails
    if (type === QuestionType.UNKNOWN) {
      if (typeId === 0 || typeId === 1) type = QuestionType.SHORT_ANSWER;
      else if (typeId === 2) type = QuestionType.MULTIPLE_CHOICE;
      else if (typeId === 3) type = QuestionType.DROPDOWN;
      else if (typeId === 4) type = QuestionType.CHECKBOXES;
      else if (typeId === 5) type = QuestionType.LINEAR_SCALE;
    }

    const title = q[1].trim();
    const required = q[4] && q[4][0] && q[4][0][2] === 1;

    let options: { value: string }[] = [];

    // Robust Options Extraction
    let rawOptions = [];

    if (Array.isArray(q[4]) && q[4].length > 0 && Array.isArray(q[4][0]) && typeof q[4][0][0] === 'string') {
      rawOptions = q[4];
    }
    else if (Array.isArray(q[4]) && q[4].length > 0 && Array.isArray(q[4][0]) && Array.isArray(q[4][0][0])) {
      rawOptions = q[4][0];
    }
    else if (Array.isArray(q[4]) && q[4].length > 0 && q[4][0] && Array.isArray(q[4][0][1])) {
      rawOptions = q[4][0][1];
    }

    if (rawOptions && Array.isArray(rawOptions)) {
      rawOptions.forEach((opt: any) => {
        if (opt && typeof opt[0] === 'string' && opt[0] !== "") {
          options.push({ value: opt[0] });
        }
      });
    }

    if (type === QuestionType.LINEAR_SCALE && q[4] && q[4].length > 0) {
      if (options.length === 0) {
        options = ['1', '2', '3', '4', '5'].map(v => ({ value: v }));
      }
    }

    // Robust Entry ID Extraction
    let entryId = "";
    try {
      if (q[4] && q[4][0] && q[4][0][0]) {
        entryId = q[4][0][0].toString();
      } else {
        entryId = q[0].toString();
      }
    } catch (e) {
      entryId = q[0].toString();
    }

    console.log(`Parsed Question: "${title}" [${type}] entryId: ${entryId} Options: ${options.length} Page: ${currentPageIndex}`);

    questions.push({
      id: q[0].toString(),
      entryId,
      title,
      type,
      options,
      required: !!required,
      pageIndex: currentPageIndex
    });
  });

  // --- AUTOMATIC EMAIL COLLECTION DETECTION ---
  const emailCollectionMode = data[1][10] || data[1][24];
  if (emailCollectionMode > 0 && !questions.some(q => q.entryId === 'emailAddress')) {
    questions.unshift({
      id: "email_collection_virtual",
      entryId: "emailAddress",
      title: "Email Address (Verified Collection Enabled)",
      type: QuestionType.SHORT_ANSWER,
      options: [],
      required: true,
      pageIndex: 0 // Email collection is always on page 1 (index 0)
    });
  }

  return { title: formTitle, questions };
};
