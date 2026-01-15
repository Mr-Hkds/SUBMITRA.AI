
interface Question {
    id: string;
    title: string;
    type?: string;
}

/**
 * Parses the AI-generated JSON response and maps it to question IDs.
 * Uses fuzzy matching to map question titles from JSON to actual question IDs.
 */
export const parseAIResponse = (jsonString: string, questions: Question[]): Record<string, string[]> => {
    try {
        // 1. Clean the input string to ensure it's valid JSON
        // Sometimes ChatGPT adds markdown code blocks, remove them
        let cleanJson = jsonString.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
        }

        // Remove any trailing commas that might break JSON.parse (simple regex for basic cases)
        cleanJson = cleanJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        const parsedData = JSON.parse(cleanJson);

        // 2. Normalize keys and map to IDs
        const mappedResponses: Record<string, string[]> = {};

        Object.keys(parsedData).forEach(key => {
            // Find matching question
            // Normalize: lowercase, remove non-alphanumeric, trim
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            const normalizedKey = normalize(key);

            // Fuzzy matching: check if normalized key is in normalized title or vice versa
            const match = questions.find(q => {
                const normTitle = normalize(q.title);
                return normTitle.includes(normalizedKey) || normalizedKey.includes(normTitle);
            });

            if (match) {
                let values = parsedData[key];
                if (!Array.isArray(values)) {
                    values = [String(values)];
                }
                mappedResponses[match.id] = values;
            }
        });

        return mappedResponses;

    } catch (e: any) {
        throw new Error("Invalid JSON format. Please ensure you copied the code block exactly from ChatGPT.");
    }
};

/**
 * Generates a prompt for ChatGPT based on the form questions and context.
 */
export const generateAIPrompt = (formTitle: string, formDescription: string, questions: Question[], count: number): string => {
    // Filter to includes ONLY text-based fields that need unique AI generation
    const textQuestions = questions.filter(q =>
        q.type === 'SHORT_ANSWER' || q.type === 'PARAGRAPH'
    );

    const questionList = textQuestions
        .map(q => `- ${q.title}`)
        .join('\n');

    if (textQuestions.length === 0) {
        return "No text-based questions found in this form. You don't need to generate custom text data.";
    }

    return `I need to generate synthetic data for a Google Form titled "${formTitle}".
${formDescription ? `CONTEXT: ${formDescription}\n` : ''}
Please generate EXACTLY ${count} diverse and realistic responses for the following fields:

${questionList}

CORE REQUIREMENTS:
1. Return ONLY a valid JSON object. No conversation or explanation.
2. The JSON keys MUST be the exact Question Titles listed above.
3. The values MUST be an ARRAY of ${count} strings (one for each response).
4. Focus on making the data look authentic. If it's a name, use a real full name. If it's a reason, make it a natural sentence.

JSON STRUCTURE:
{
  "Question Title 1": ["Response 1", "Response 2", ...],
  "Question Title 2": ["Response 1", "Response 2", ...]
}`;
};
