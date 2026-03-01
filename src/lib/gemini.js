import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
})

export async function generateViewingGuide(imageUrl, genre, title) {
  const base64 = await urlToBase64(imageUrl)
  const prompt = `あなたはアートの案内人です。この${genre}作品「${title}」を初めて見る人が自然に興味を持てる鑑賞ガイドを書いてください。

## 条件
- 専門用語なし、中学生でも分かる言葉
- どこを見れば良いかを具体的に
- 3つのポイント、各50〜80字
- 最初に作品の核心を一文で

## 画像データ
data:image/jpeg;base64,${base64}

## 出力（JSONのみ）
{"core":"核心一文（30字以内）","points":[{"num":"01","text":"ポイント1"},{"num":"02","text":"ポイント2"},{"num":"03","text":"ポイント3"}]}`

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    })
    return JSON.parse(response.text.replace(/```json|```/g, '').trim())
  } catch (error) {
    console.error("Gemini API error:", error)
    return null // エラー時に明示的にnullを返す
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
