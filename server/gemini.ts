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
 * Helper to split long text into sentence chunks under 300 characters
 */
function splitIntoChunks(text: string, maxLen = 300): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLen) {
      currentChunk += sentence;
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      if (sentence.length > maxLen) {
        // Break long sentence by words
        const words = sentence.split(' ');
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).length <= maxLen) {
            wordChunk = wordChunk ? `${wordChunk} ${w}` : w;
          } else {
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
            wordChunk = w;
          }
        }
        if (wordChunk.trim()) currentChunk = wordChunk;
        else currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

/**
 * Fallback to MyMemory translation API (high quality, supports Tamil & Telugu, chunked for long paragraphs)
 */
async function translateWithMyMemory(text: string, targetLang: string, sourceLang?: string): Promise<string | null> {
  try {
    const langCodeMap: Record<string, string> = {
      english: 'en',
      tamil: 'ta',
      telugu: 'te',
    };
    const targetCode = langCodeMap[targetLang.toLowerCase()] || targetLang;
    const sourceCode = sourceLang && langCodeMap[sourceLang.toLowerCase()] ? langCodeMap[sourceLang.toLowerCase()] : (targetCode === 'en' ? 'ta' : 'en');
    const chunks = splitIntoChunks(text, 350);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      // Try specific langpair first (e.g. en|ta or ta|en), then fallback to autodetect
      let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceCode}|${targetCode}`;
      let controller = new AbortController();
      let timeoutId = setTimeout(() => controller.abort(), 7000);
      
      let res = await fetch(url, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);
      
      let chunkTranslated: string | null = null;

      if (res && res.ok) {
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (translated && typeof translated === 'string' && !translated.startsWith('MYMEMORY WARNING') && translated.trim() !== chunk.trim()) {
          chunkTranslated = translated.trim();
        }
      }

      // If specific langpair didn't translate, try autodetect
      if (!chunkTranslated) {
        url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=autodetect|${targetCode}`;
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 7000);
        res = await fetch(url, { signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);

        if (res && res.ok) {
          const data = await res.json();
          const translated = data?.responseData?.translatedText;
          if (translated && typeof translated === 'string' && !translated.startsWith('MYMEMORY WARNING') && translated.trim() !== chunk.trim()) {
            chunkTranslated = translated.trim();
          }
        }
      }

      translatedChunks.push(chunkTranslated || chunk);
    }

    const combined = translatedChunks.join(' ').trim();
    if (combined && combined !== text.trim()) {
      return combined;
    }
  } catch (err: any) {
    console.warn('[Translate Fallback] MyMemory error:', err.message);
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

  // 1. Try Gemini API first (gemini-3.6-flash supports long text without length limits)
  if (client) {
    const prompt = `You are an expert, fluent multilingual translator for DearYou (a birthday experience creator).

Translate the following text into ${targetLangLabel}.
${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}

CRITICAL RULES:
- Translate the ENTIRE text completely without shortening, cutting off, or omitting any part.
- Preserve the emotional tone, warmth, line breaks, punctuation, and formatting.
- Do NOT add any notes, commentary, prefixes (like "Translation:"), or explanations.
- Return ONLY the pure translated text.

Text to translate:
${text}`;

    try {
      const response = await Promise.race([
        client.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout')), 10000))
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

  // 2. High-Quality Chunked MyMemory Fallback (handles long sentences without word limits)
  const myMemoryResult = await translateWithMyMemory(text, targetLanguage, sourceLanguage);
  if (myMemoryResult) {
    translationCache.set(cacheKey, myMemoryResult);
    return { result: myMemoryResult, language: targetLanguage };
  }

  // 3. Return original if all providers unavailable
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
