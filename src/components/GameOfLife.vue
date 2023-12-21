<template>
  <div>
    <canvas id="canvas" ref="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'

export default {
  setup() {
    const canvas = ref<HTMLCanvasElement | null>(null)
    let intervalId: number | null = null

    onMounted(() => {
      if (!canvas.value) return
      const ctx = canvas.value.getContext('2d')
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.value.width = width
      canvas.value.height = height
      const cellSize = 10
      const rows = Math.floor(height / cellSize)
      const cols = Math.floor(width / cellSize)
      let grid = Array(rows)
        .fill([])
        .map(() => Array(cols).fill(false))

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          grid[i][j] = Math.random() > 0.5
        }
      }

      const drawGrid = () => {
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const cell = grid[i][j]
            if (!ctx) return
            ctx.fillStyle = cell ? '#00B1A1' : 'white'
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize)
          }
        }
      }

      const updateGrid = () => {
        const newGrid = grid.map((arr) => [...arr])

        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const cell = grid[i][j]
            let neighborCount = 0

            for (let ii = -1; ii < 2; ii++) {
              for (let jj = -1; jj < 2; jj++) {
                if (ii === 0 && jj === 0) continue
                const x = (i + ii + rows) % rows
                const y = (j + jj + cols) % cols
                neighborCount += grid[x][y] ? 1 : 0
              }
            }

            if (cell && (neighborCount < 2 || neighborCount > 3)) newGrid[i][j] = false
            else if (!cell && neighborCount === 3) newGrid[i][j] = true
          }
        }

        grid = newGrid
      }

      const tick = () => {
        drawGrid()
        updateGrid()
        requestAnimationFrame(tick)
      }

      tick()

      intervalId = setInterval(() => {
        const randomRow = Math.floor(Math.random() * rows)
        const randomCol = Math.floor(Math.random() * cols)
        grid[randomRow][randomCol] = true
        console.log('interval', grid[randomRow][randomCol])
      }, 1000)
    })

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    })

    return { canvas }
  }
}
</script>

<style scoped lang="scss">
#canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  filter: blur(5px);
  opacity: 0.08;
}
</style>
