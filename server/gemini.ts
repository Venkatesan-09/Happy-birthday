import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIGenerateParams {
  type: 'LETTER' | 'WISH' | 'JOKE' | 'STORY' | 'FINAL_MESSAGE' | 'FUTURE_WISH' | 'SECRET_MESSAGE';
  relationship: string;
  recipientName: string;
  tone: string;
  context?: string;
  memories?: string;
  length?: 'short' | 'medium' | 'deep';
}

export interface TranslateParams {
  text: string;
  targetLanguage: 'english' | 'tamil' | 'telugu' | string;
  sourceLanguage?: string;
}

// In-memory translation cache to avoid repeated network calls
const translationCache = new Map<string, string>();

/**
 * Fallback to MyMemory translation API (high quality, supports Tamil & Telugu)
 */
async function translateWithMyMemory(text: string, targetLang: string): Promise<string | null> {
  try {
    const langCodeMap: Record<string, string> = {
      english: 'en',
      tamil: 'ta',
      telugu: 'te',
    };
    const targetCode = langCodeMap[targetLang.toLowerCase()] || targetLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetCode}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === 'string' && !translated.startsWith('MYMEMORY WARNING')) {
        return translated.trim();
      }
    }
  } catch (err: any) {
    console.warn('[Translate Fallback 1] MyMemory error:', err.message);
  }
  return null;
}

/**
 * Fallback to Google Translate public endpoint
 */
async function translateWithGooglePublic(text: string, targetLang: string): Promise<string | null> {
  try {
    const langCodeMap: Record<string, string> = {
      english: 'en',
      tamil: 'ta',
      telugu: 'te',
    };
    const targetCode = langCodeMap[targetLang.toLowerCase()] || targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslation = data[0].map((item: any) => item[0]).join('');
        if (fullTranslation.trim()) return fullTranslation.trim();
      }
    }
  } catch (err: any) {
    console.warn('[Translate Fallback 2] Google Translate public error:', err.message);
  }
  return null;
}

export async function translateText(params: TranslateParams): Promise<{ result: string; language: string }> {
  const { text, targetLanguage, sourceLanguage } = params;
  if (!text || !text.trim()) {
    return { result: text, language: targetLanguage };
  }

  const cacheKey = `${targetLanguage}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return { result: translationCache.get(cacheKey)!, language: targetLanguage };
  }

  const languageMap: Record<string, string> = {
    english: 'English',
    tamil: 'Tamil (தமிழ்)',
    telugu: 'Telugu (తెలుగు)',
  };

  const targetLangLabel = languageMap[targetLanguage] || targetLanguage;
  const client = getGenAIClient();

  // 1. Try Gemini API first if available with a timeout
  if (client) {
    const prompt = `You are a precise translation assistant for DearYou, a birthday experience app.

Translate the following text to ${targetLangLabel}.
${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}

Rules:
- Preserve the emotional tone, warmth, and meaning of the original text exactly.
- Do NOT add any explanations, notes, or commentary.
- Return ONLY the translated text, nothing else.
- Maintain any line breaks or paragraphs in the original text.
- If the text is already in the target language, return it as-is.

Text to translate:
${text}`;

    try {
      const response = await Promise.race([
        client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout')), 3000))
      ]);
      const translated = response.text?.trim();
      if (translated) {
        translationCache.set(cacheKey, translated);
        return { result: translated, language: targetLanguage };
      }
    } catch (err: any) {
      console.warn('[Translate] Gemini API translation notice (falling back):', err.message);
    }
  }

  // 2. Fast Fallback to Google Translate public endpoint
  const googleResult = await translateWithGooglePublic(text, targetLanguage);
  if (googleResult) {
    translationCache.set(cacheKey, googleResult);
    return { result: googleResult, language: targetLanguage };
  }

  // 3. Fallback to MyMemory translation engine
  const myMemoryResult = await translateWithMyMemory(text, targetLanguage);
  if (myMemoryResult) {
    translationCache.set(cacheKey, myMemoryResult);
    return { result: myMemoryResult, language: targetLanguage };
  }

  // 4. Return original if all providers unavailable
  return { result: text, language: targetLanguage };
}

export async function generateAICentent(params: AIGenerateParams): Promise<{ result: string; provider: string; model: string }> {
  const { type, relationship, recipientName, tone, context, memories, length } = params;
  const client = getGenAIClient();

  if (!client) {
    console.warn('GEMINI_API_KEY not configured, using crafted fallback message generation');
    return {
      result: getCraftedFallback(params),
      provider: 'crafted_template',
      model: 'dearyou-warmth-v1',
    };
  }

  const prompt = `You are the DearYou AI Message Crafting Assistant. DearYou helps creators build personalized, emotionally resonant birthday experiences for loved ones.

Task: Generate a ${tone} ${type.toLowerCase()} for ${recipientName}.
Relationship: ${relationship}
Tone: ${tone} (e.g. heartfelt, playful, nostalgic, poetic, funny, uplifting)
Additional personal context: ${context || 'None provided'}
Shared memories: ${memories || 'None provided'}
Desired length: ${length || 'medium'}

CRITICAL GUIDELINES:
- Do NOT use generic birthday platitudes like "Wishing you a year filled with love and laughter!" or "May all your dreams come true!"
- Ground the emotion in human authenticity, warmth, and specific sensory details.
- If relationship is NOT romantic, maintain appropriate platonic, familial, or mentorship boundaries.
- Return ONLY the drafted text ready to be placed directly in the DearYou card/module. Do not add conversational AI intro or outro (e.g., "Here is your letter:").`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || getCraftedFallback(params);
    return {
      result: text,
      provider: 'gemini',
      model: 'gemini-3.6-flash',
    };
  } catch (err: any) {
    console.error('Error generating AI content via Gemini API:', err);
    return {
      result: getCraftedFallback(params),
      provider: 'gemini_fallback',
      model: 'dearyou-warmth-v1',
    };
  }
}

function getCraftedFallback(params: AIGenerateParams): string {
  const { type, recipientName, relationship, tone } = params;

  switch (type) {
    case 'LETTER':
      return `My dearest ${recipientName},\n\nEvery now and then, life gives us someone whose presence quietly changes the temperature of every room they walk into. For me, that has always been you.\n\nFrom our easiest laughs to the days where we just sat quietly together, your friendship has been a steady, unconditional anchor. As another year begins for you today, I hope you see yourself through the eyes of the people who love you: courageous, deeply kind, and utterly irreplaceable.\n\nHappy Birthday, with all my love and gratitude.`;
    case 'WISH':
      return `To my wonderful ${relationship.toLowerCase()} ${recipientName}: May this year surprise you with peaceful mornings, loud unexpected laughter, and the courage to pursue the dreams you only whisper in the dark. You are so cherished.`;
    case 'JOKE':
      return `Setup: "Hey ${recipientName}, remember when we swore we would be mature adults by this year?"\nPunchline: Cut to us celebrating your birthday by eating dessert for breakfast and laughing at memes for two hours straight!`;
    case 'STORY':
      return `Chapter 1: The Beginning — When we first crossed paths, neither of us knew we were meeting someone who would define so many good chapters.\n\nChapter 2: The Inside World — Built on thousands of shared glances, frantic text threads, and memories nobody else will ever decode.\n\nChapter 3: Right Now — Celebrating you today, more proud of who you are than ever.`;
    case 'FUTURE_WISH':
      return `A promise for the road ahead: That we take that trip we keep talking about, drink warm tea under autumn trees, and keep celebrating every single birthday milestone like we did today.`;
    case 'SECRET_MESSAGE':
      return `A secret truth for ${recipientName}: You carry a quiet strength that inspires me even when you feel tired. Never forget how much you matter to the people who know your real heart.`;
    case 'FINAL_MESSAGE':
    default:
      return `To ${recipientName}: You have explored the memories, but the greatest adventure is still ahead. Blow out the candles and know you are unconditionally loved today and always. Happy Birthday! 🎂✨`;
  }
}

export const generateAIContent = generateAICentent;
