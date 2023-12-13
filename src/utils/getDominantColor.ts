export function getDominantColor(imageElement: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to get canvas context')
  }

  canvas.width = imageElement.width
  canvas.height = imageElement.height

  context.drawImage(imageElement, 0, 0)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const colorCount: { [color: string]: number } = {}

  for (let i = 0; i < data.length; i += 4) {
    const color = `${data[i]}-${data[i + 1]}-${data[i + 2]}`
    colorCount[color] = (colorCount[color] || 0) + 1
  }

  let dominantColor = ''
  let maxCount = 0
  for (const color in colorCount) {
    if (colorCount[color] > maxCount) {
      maxCount = colorCount[color]
      dominantColor = color
    }
  }

  const rgbColor = `rgb(${dominantColor.split('-').join(', ')})`
  document.documentElement.style.setProperty('--dominant-image-color', rgbColor)

  return rgbColor
}
