import { logEvent as firebaseLogEvent, getAnalytics, isSupported } from 'firebase/analytics'
import { app } from './firebase'

// Analytics インスタンスを非同期で解決する Promise
let analyticsPromise = null

function getAnalyticsInstance() {
  if (window.location.hostname.includes('web.app')) return Promise.resolve(null)
  if (!analyticsPromise) {
    const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    if (!measurementId) {
      analyticsPromise = Promise.resolve(null)
    } else {
      analyticsPromise = isSupported()
        .then(supported => (supported ? getAnalytics(app) : null))
        .catch(() => null)
    }
  }
  return analyticsPromise
}

/**
 * Firebase Analytics にイベントを送信する
 * measurementId 未設定・非対応環境では何もしない（no-op）
 *
 * @param {string} eventName - イベント名
 * @param {Object} [params] - イベントパラメータ
 */
export async function logEvent(eventName, params = {}) {
  try {
    const analyticsInstance = await getAnalyticsInstance()
    if (analyticsInstance) {
      firebaseLogEvent(analyticsInstance, eventName, params)
    }
  } catch (e) {
    console.warn('[Analytics] イベント送信エラー:', eventName, e)
  }
}
