import * as d3 from 'd3'
import type { Output } from './types'

function restructureDataForRadialTree(dataArray: Output[] | undefined) {
  if (!dataArray) return
  const root = {
    name: 'Process',
    children: []
  }

  // Initialize categories
  const categories = {
    ingredients: { name: 'Ingredients', children: [] },
    modifiers: { name: 'Modifiers', children: [] },
    fabrication: { name: 'Fabrication', children: [] },
    output: { name: 'Output', children: [] }
  }

  // Process each object in the array
  dataArray.forEach((data) => {
    // Add ingredients
    for (let i = 1; data[`Ingredient ${i} Name`]; i++) {
      categories.ingredients.children.push({
        name: `Ingredient - ${data[`Ingredient ${i} Name`]}`,
        id: data[`Ingredient ${i} #`]
      })
    }

    // Add modifiers
    for (let i = 1; data[`Modifier Method ${i}`]; i++) {
      categories.modifiers.children.push({
        name: `Modifier - ${data[`Modifier Method ${i}`]}`,
        id: data[`Modifier Method ID ${i}#`]
      })
    }

    // Add fabrication method
    if (data['Fabrication Method ']) {
      categories.fabrication.children.push({
        name: `Fabrication - ${data['Fabrication Method ']}`,
        id: data['Fabrication Method ID#']
      })
    }

    // Add output
    if (data['Output Name']) {
      categories.output.children.push({
        name: `Output - ${data['Output Name']}`,
        id: data['Output #']
      })
    }
  })

  // Add non-empty categories to the root
  Object.values(categories).forEach((category) => {
    if (category.children.length > 0) {
      root.children.push(category)
    }
  })

  return root
}

// radial tree
function createRadialTidyTree(
  networkData: Output[] | undefined,
  container: HTMLElement | null = null
) {
  if (!networkData) return
  const width = window.innerWidth
  const height = window.innerHeight
  const cx = width * 0.01 // adjust as needed to fit
  const cy = height * 0.01 // adjust as needed to fit
  const radius = Math.min(width, height) / 2 - 150

  // Create a radial tree layout
  const tree = d3
    .tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)

  const root = tree(d3.hierarchy(restructureDataForRadialTree(networkData)) as any)

  // Create SVG container
  const svg = d3
    .select(container ?? document.body)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-cx, -cy, width, height])
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  // Draw links
  svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll()
    .data(root.links())
    .join('path')
    .attr(
      'd',
      d3
        .linkRadial()
        .angle((d) => d.x)
        .radius((d) => d.y)
    )

  // Draw nodes
  svg
    .append('g')
    .selectAll()
    .data(root.descendants())
    .join('circle')
    .attr('transform', (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`)
    .attr('fill', (d) => (d.children ? '#555' : '#999'))
    .attr('r', 2.5)

  svg
    .append('g')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .selectAll()
    .data(root.descendants())
    .join('text')
    .attr(
      'transform',
      (d) =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    .attr('dy', '0.31em')
    .attr('x', (d) => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr('text-anchor', (d) => (d.x < Math.PI === !d.children ? 'start' : 'end'))
    .attr('paint-order', 'stroke')
    .attr('stroke', 'white')
    .attr('fill', 'currentColor')
    .text((d) => (d.data as { name: string }).name)
}

export default createRadialTidyTree
