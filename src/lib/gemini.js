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
      // model: 'qwen3-vl-flash',
      model: 'qwen3.5-flash',
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
- 3つのポイント、各50〜60字
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
01: （ポイント1・50〜60字）
02: （ポイント2・50〜60字）
03: （ポイント3・50〜60字）`

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

// ── 質問生成プロンプト ───────────────────────────────
const QUESTION_PROMPT = `あなたはアートの案内人です。この作品画像を初めて見た人が「自分の感性で向き合える」よう、以下の3問の構成で選択式の質問を作ってください。

## 重要な方針
- 具体的な事実（文字の意味・技法名・作者情報など）には一切触れない
- 知識がゼロでも直感だけで答えられる問いにする
- 選択肢は感情・雰囲気・感覚を表す言葉（例：「きれい」「かっこいい」「迫力がある」「やさしい」「不思議」「静か」）を使う
- 専門用語なし、中学生でも直感的に答えられる
- 各問に選択肢3つを用意する
- 解説は「なぜそう感じるのか」の背景を温かく伝える（40字以内）
- ジャンルも特定してください（書道/写真/陶芸/絵画/彫刻/その他）

## 3問の構成（必ずこの順番・テーマで作ること）
- Q1「全体の印象」: 作品全体を一瞬見たときの第一印象・雰囲気に関する問い（例：「この作品を見て最初に感じたのは？」）
- Q2「目を引く部分」: 作品の中で特に存在感がある・目立つと感じる場所に関する問い（例：「この作品の中で一番存在感があると思うのはどこ？」）
- Q3「芸術的要素の感触」: 具体的な場所ではなく、作品の「流れ」「余白」「空気」「勢い」など感覚的・芸術的な要素について問う（例：書道なら「この作品から感じる勢いや流れはどれに近い？」、絵画なら「この作品の空気感はどれに近い？」）、選択肢は感覚的なイメージの言葉（例：「静かに流れる川」「激しい嵐」「ゆっくり広がる霧」）

## 出力（JSONのみ）
{"genre":"ジャンル名","guide":"簡潔な鑑賞ガイド（2〜3文）","note":"この質問に正解はありません。あなたの直感で答えてください。","questions":[{"num":"01","text":"質問文","choices":["選択肢A","選択肢B","選択肢C"],"explanation":"解説（40字以内）"},{"num":"02","text":"質問文","choices":["選択肢A","選択肢B","選択肢C"],"explanation":"解説（40字以内）"},{"num":"03","text":"質問文","choices":["選択肢A","選択肢B","選択肢C"],"explanation":"解説（40字以内）"}]}`

// カメラページ用：質問を生成する
export async function generateQuestionsBase64(base64) {
  try {
    const text = await generate(base64, QUESTION_PROMPT)
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (error) {
    console.error('[AI] generateQuestionsBase64 エラー:', error)
    return null
  }
}

// ── まとめ生成プロンプト ─────────────────────────────
function buildSummaryPrompt(qas, genre) {
  const pairs = qas.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')
  return `あなたはアートの案内人です。この作品を見た鑑賞者が以下の質問に答えました。

${pairs}

以下の2つを生成してください。

## 1. まとめメッセージ
- 鑑賞者が感じ取ったことを肇定的に言語化して伝える（例：「あなたは～と感じたのですんですね」）
- 専門用語なし、温かみのある文体
- 箇条書きで、全体の字数は100字程度

## 2. AI鑑賞ガイド
- 作品を初めて見る人が自然に興味を持てる鑑賞ガイド
- 専門用語なし、中学生でも分かる言葉
- 作品の核心を一文（30字以内）、鑑賞ポイント3つ（各40〜60字）

## 出力（JSONのみ）
{"keyword":"あなたの感性を表わす10字以内の一言（例：「気づくと引き寄せられる感じ」「静けさの中に強さを感じる人」）","message":"まとめメッセージ","guide":{"core":"核心一文（30字以内）","points":[{"num":"01","text":"ポイント1"},{"num":"02","text":"ポイント2"},{"num":"03","text":"ポイント3"}]}}`
} 

// カメラページ用：Q&Aからまとめを生成する
export async function generateSummaryFromAnswers(base64, qas, genre) {
  try {
    const text = await generate(base64, buildSummaryPrompt(qas, genre))
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (error) {
    console.error('[AI] generateSummaryFromAnswers エラー:', error)
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
