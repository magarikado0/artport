import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
})

const PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini'

// ── Gemini実装 ──────────────────────────────────────
async function generateWithGemini(base64, prompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      parts: [
        { inline_data: { mime_type: 'image/jpeg', data: base64 } },
        { text: prompt }
      ]
    }],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 1000,
      thinkingConfig: { thinkingLevel: 'minimal' }
    }
  })
  return response.text
}

// ── Qwen実装 ────────────────────────────────────────
async function generateWithQwen(base64, prompt) {
  const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_QWEN_API_KEY}`
    },
    body: JSON.stringify({
      model: 'qwen3-vl-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: 'text', text: prompt }
        ]
      }],
      extra_body: {
        enable_thinking: false
      }
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices?.[0]?.message?.content || ''
}

// ── プロバイダー統合呼び出し ─────────────────────────
async function generate(base64, prompt) {
  console.log(`[AI] プロバイダー: ${PROVIDER}`)
  return PROVIDER === 'qwen'
    ? await generateWithQwen(base64, prompt)
    : await generateWithGemini(base64, prompt)
}

// ── 共通プロンプト ─────────────────────────────────
function buildGuidePrompt(genre, title) {
  return `あなたはアートの案内人です。この${genre}作品「${title}」を初めて見る人が自然に興味を持てる鑑賞ガイドを書いてください。

## 条件
- 専門用語なし、中学生でも分かる言葉
- どこを見れば良いかを具体的に
- 3つのポイント、各50〜80字
- 最初に作品の核心を一文で

## 出力（JSONのみ）
{"core":"核心一文（30字以内）","points":[{"num":"01","text":"ポイント1"},{"num":"02","text":"ポイント2"},{"num":"03","text":"ポイント3"}]}`
}

const CAMERA_PROMPT = `この作品画像を見て以下を返してください。

1. ジャンル（書道/写真/陶芸/絵画/彫刻/その他のいずれか）
2. 初めて見る人向けの鑑賞ガイド

## 出力形式
ジャンル: （ジャンル名）
核心: （一文でこの作品の核心）
01: （ポイント1・50〜80字）
02: （ポイント2・50〜80字）
03: （ポイント3・50〜80字）`

// ── エクスポート関数 ──────────────────────────────

// 作品詳細ページ用（imageUrl から生成）
export async function generateViewingGuide(imageUrl, genre, title) {
  const base64 = await urlToBase64(imageUrl)
  try {
    const text = await generate(base64, buildGuidePrompt(genre, title))
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (error) {
    console.error(`[AI] generateViewingGuide エラー:`, error)
    return null
  }
}

// カメラページ用（base64 を直接渡す）
export async function analyzeImageBase64(base64) {
  try {
    return await generate(base64, CAMERA_PROMPT)
  } catch (error) {
    console.error(`[AI] analyzeImageBase64 エラー:`, error)
    return null
  }
}

async function urlToBase64(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })
}
