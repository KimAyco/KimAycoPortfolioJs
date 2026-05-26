/** Cyber console palette */
export const CYBER_PALETTE = {
  bg: [0, 56, 56] as const,
  grid: [42, 138, 122] as const,
  glow: [204, 255, 0] as const,
  accent: [255, 0, 0] as const,
  black: [0, 0, 0] as const,
  mid: [10, 74, 68] as const,
}

/** 4x4 Bayer matrix for ordered dithering */
export const BAYER_4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`
}

/** Find nearest palette color */
export function quantizeToPalette(
  r: number,
  g: number,
  b: number,
  palette: readonly (readonly [number, number, number])[] = Object.values(CYBER_PALETTE)
): [number, number, number] {
  let bestR = palette[0][0]
  let bestG = palette[0][1]
  let bestB = palette[0][2]
  let bestDist = Infinity
  for (const [pr, pg, pb] of palette) {
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (d < bestDist) {
      bestDist = d
      bestR = pr
      bestG = pg
      bestB = pb
    }
  }
  return [bestR, bestG, bestB]
}

/** Apply Bayer dithering to ImageData */
export function ditherImageData(
  data: ImageData,
  cellSize = 4,
  palette: readonly (readonly [number, number, number])[] = Object.values(CYBER_PALETTE),
  /** Shift Bayer matrix — animating this makes idle frames shimmer */
  phase: { x: number; y: number } = { x: 0, y: 0 }
): void {
  const { width, height, data: px } = data
  const phaseX = ((phase.x % 4) + 4) % 4
  const phaseY = ((phase.y % 4) + 4) % 4
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      let r = 0
      let g = 0
      let b = 0
      let count = 0
      for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
        for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4
          r += px[i]
          g += px[i + 1]
          b += px[i + 2]
          count++
        }
      }
      r /= count
      g /= count
      b /= count

      const bx = (Math.floor(x / cellSize) + phaseX) % 4
      const by = (Math.floor(y / cellSize) + phaseY) % 4
      const threshold = (BAYER_4[by][bx] / 16) * 64 - 32
      const [qr, qg, qb] = quantizeToPalette(
        Math.min(255, Math.max(0, r + threshold)),
        Math.min(255, Math.max(0, g + threshold)),
        Math.min(255, Math.max(0, b + threshold)),
        palette
      )

      for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
        for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4
          px[i] = qr
          px[i + 1] = qg
          px[i + 2] = qb
        }
      }
    }
  }
}
