/**
 * gtag.js（Google Analytics）にイベントを送信する
 * window.gtag が未定義の場合は何もしない（no-op）
 *
 * @param {string} eventName - イベント名
 * @param {Object} [params] - イベントパラメータ
 */
export function logEvent(eventName, params = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params)
    }
  } catch (e) {
    console.warn('[Analytics] イベント送信エラー:', eventName, e)
  }
}
