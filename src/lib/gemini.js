const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`

export async function generateViewingGuide(imageUrl, genre, title) {
  const prompt = `あなたはアートの案内人です。この${genre}作品「${title}」を初めて見る人が自然に興味を持てる鑑賞ガイドを書いてください。

## 条件
- 専門用語なし、中学生でも分かる言葉
- どこを見れば良いかを具体的に
- 3つのポイント、各50〜80字
- 最初に作品の核心を一文で

## 出力（JSONのみ）
{"core":"核心一文（30字以内）","points":[{"num":"01","text":"ポイント1"},{"num":"02","text":"ポイント2"},{"num":"03","text":"ポイント3"}]}`

  const base64 = await urlToBase64(imageUrl)
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64 } }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
  })
  if (!res.ok) throw new Error('Gemini API error')
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return {
      core: 'この作品には、じっくり見ると発見がある。',
      points: [
        { num: '01', text: 'まず全体をゆっくり眺めてみてください。' },
        { num: '02', text: '細部に目を移すと、また違う表情が見えてきます。' },
        { num: '03', text: '一歩引いて、作品全体のバランスを感じてみてください。' },
      ],
    }
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
