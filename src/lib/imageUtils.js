/**
 * Canvas APIを使って画像をリサイズし、Blobを返す
 * @param {File} file - 元の画像ファイル
 * @param {number} maxWidth - 最大幅（px）デフォルト1200
 * @param {number} maxHeight - 最大高さ（px）デフォルト1200
 * @param {number} quality - JPEG品質 0〜1 デフォルト0.85
 * @returns {Promise<Blob>} リサイズ後のBlob
 */
export function resizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // アスペクト比を維持しながらリサイズ
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // JPEG変換（PNGはJPEGより大きくなる場合があるため）
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(
              `[imageUtils] リサイズ成功: ${img.naturalWidth}×${img.naturalHeight}px → ${width}×${height}px | サイズ: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}%削減)`
            )
            resolve(blob)
          } else {
            reject(new Error('画像のリサイズに失敗しました'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('画像の読み込みに失敗しました'))
    }

    img.src = objectUrl
  })
}
