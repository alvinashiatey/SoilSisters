<template>
  <main>
    <div class="wrapper">
      <div ref="container" id="container"></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import * as d3 from 'd3'
import { useRoute, useRouter } from 'vue-router'
import { useSoilSistersStore } from '@/stores/soilSisters'
import { onMounted, watch, ref } from 'vue'
import type { SoilSisters } from '@/stores/soilSisters'

interface DataItem {
  [key: string]: string | number
}

interface Node {
  id: string
  type: string
}

interface Link {
  source: string
  target: string
}

interface NetworkData {
  nodes: Node[]
  links: Link[]
}

const store = useSoilSistersStore()
store.fetchSoilSisters()

const route = useRoute()
const router = useRouter()
let name = route.params.name

const container = ref<HTMLElement | null>(null)

interface Output {
  [key: string]: string | number
}

const getOutputs = (data: SoilSisters[]): Output[] | undefined => {
  const outputs = data.find((d) => d.sheetName === 'Outputs')
  return outputs?.children?.filter((d) => {
    const keys = Object.keys(d)
    const regex = new RegExp(`Ingredient \\d+ Name`)
    return keys.some((k) => regex.test(k) && d[k] === name)
  })
}

const getModifiersFromOutputs = (data: Output[] | undefined) => {
  if (!data) return
  const modifiers = data.map((d) => {
    const keys = Object.keys(d)
    const regex = new RegExp(`Modifier Method \\d+`)
    return keys.filter((k) => regex.test(k)).map((k) => d[k])
  })
  return [...new Set(modifiers.flat())]
}

const getFabricationMethodsFromOutputs = (data: Output[] | undefined) => {
  if (!data) return
  const fabricationMethods = data.map((d) => d['Fabrication Method']).filter((d) => d)
  return [...new Set(fabricationMethods)]
}

const getOutNameFromOutputs = (data: Output[] | undefined) => {
  if (!data) return
  const outNames = data.map((d) => d['Output Name']).filter((d) => d)
  return [...new Set(outNames)]
}

const getOtherIngredientsFromOutputs = (data: Output[] | undefined) => {
  if (!data) return
  const otherIngredients = data.map((d) => {
    const keys = Object.keys(d)
    const regex = new RegExp(`Ingredient \\d+ Name`)
    return keys.filter((k) => regex.test(k)).map((k) => d[k])
  })
  return [...new Set(otherIngredients.flat())].filter((d) => d !== name)
}

const setUpData = (data: Output[] | undefined) => {
  if (!data) return
  const modifiers = getModifiersFromOutputs(data) || []
  const fabricationMethods = getFabricationMethodsFromOutputs(data) || []
  const outPutNames = getOutNameFromOutputs(data) || []
  const otherIngredients = getOtherIngredientsFromOutputs(data) || []

  const children = [
    otherIngredients.length > 0 && {
      field: 'Other Ingredients',
      children: otherIngredients.map((m) => ({ name: m }))
    },
    modifiers.length > 0 && { field: 'Modifiers', children: modifiers.map((m) => ({ name: m })) },
    fabricationMethods.length > 0 && {
      field: 'Fabrication Methods',
      children: fabricationMethods.map((m) => ({ name: m }))
    },
    outPutNames.length > 0 && {
      field: 'Output Names',
      children: outPutNames.map((m) => ({ name: m }))
    }
  ].filter(Boolean) //

  return {
    name: name, // Assuming 'name' is defined elsewhere in your code
    children: children
  }
}

function transformDataToNetwork(data: DataItem[]): NetworkData {
  let nodes: Node[] = [],
    links: Link[] = []

  data.forEach((item) => {
    const fabricationMethod = item['Fabrication Method ']
    const outputName = item['Output Name']

    for (let i = 1; i <= 4; i++) {
      const ingredientName = item[`Ingredient ${i} Name`]
      const modifierName = item[`Modifier Method ${i}`]

      if (ingredientName) {
        nodes.push({ id: ingredientName, type: 'ingredient' })

        if (modifierName) {
          links.push({ source: ingredientName, target: modifierName })
          nodes.push({ id: modifierName, type: 'modifier' })

          if (fabricationMethod) {
            links.push({ source: modifierName, target: fabricationMethod })
          }
        } else if (fabricationMethod) {
          links.push({ source: ingredientName, target: fabricationMethod })
        }
      }
    }

    // Handle fabrication method node
    if (fabricationMethod) {
      nodes.push({ id: fabricationMethod, type: 'fabrication' })
    }

    // Handle output node and its link
    if (outputName) {
      nodes.push({ id: outputName, type: 'output' })

      // Determine the source for the link to the output
      const sourceForOutput =
        fabricationMethod ||
        item['Modifier Method 4'] ||
        item['Modifier Method 3'] ||
        item['Modifier Method 2'] ||
        item['Modifier Method 1'] ||
        item['Ingredient 1 Name'] ||
        item['Ingredient 2 Name'] ||
        item['Ingredient 3 Name'] ||
        item['Ingredient 4 Name']
      if (sourceForOutput) {
        links.push({ source: sourceForOutput, target: outputName })
      }
    }
  })

  // Remove duplicate nodes
  nodes = Array.from(new Map(nodes.map((node) => [node.id, node])).values())

  return { nodes, links }
}

const d3Setup = (networkData: NetworkData) => {
  const width = window.innerWidth,
    height = window.innerHeight

  console.log(networkData)

  const svg = d3
    .select(container.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font', '16px sans-serif')

  const g = svg.append('g')

  const zoom = d3
    .zoom()
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
    .filter((event) => event.type !== 'wheel')

  svg.call(zoom as any)

  const simulation = d3
    .forceSimulation(networkData.nodes as any)
    .force(
      'link',
      d3.forceLink(networkData.links).id((d) => d.id)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(35))
    .on('tick', () => {
      // Update node positions
      nodeGroups.attr('transform', (d) => `translate(${d.x},${d.y})`)

      // Update link (path) positions
      link.attr('d', (d) => {
        const sx = d.source.x,
          sy = d.source.y,
          tx = d.target.x,
          ty = d.target.y
        const dx = tx - sx,
          dy = ty - sy,
          dr = Math.sqrt(dx * dx + dy * dy) // Radius for the curve
        return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`
      })
    })

  const link = g
    .selectAll('.link')
    .data(networkData.links)
    .join('path')
    .classed('link', true)
    .style('stroke', (d) => {
      if (d.source.type === 'output') {
        return '#DE8F5F'
      } else if (d.source.type === 'fabrication') {
        return '#FFC436'
      } else if (d.source.type === 'modifier') {
        return '#940B92'
      } else if (d.source.type === 'ingredient') {
        return '#AEC3AE'
      }
      return '#AEC3AE'
    })
    .style('stroke-width', 2)
    .style('fill', 'none')
    .attr('d', (d) => {
      const sx = d.source.x,
        sy = d.source.y,
        tx = d.target.x,
        ty = d.target.y
      const dx = tx - sx,
        dy = ty - sy,
        dr = Math.sqrt(dx * dx + dy * dy)
      return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`
    })

  // Add nodes
  const nodeGroups = g.selectAll('.node').data(networkData.nodes).join('g').classed('node', true)

  nodeGroups
    .append('circle')
    .attr('r', 5)
    .attr('fill', (d) => {
      if (d.type === 'output') {
        return '#DE8F5F'
      } else if (d.type === 'fabrication') {
        return '#FFC436'
      } else if (d.type === 'modifier') {
        return '#940B92'
      } else if (d.type === 'ingredient') {
        return '#AEC3AE'
      }
      return '#AEC3AE'
    }) // Orange for output nodes
    .attr('cy', 0)
    .attr('cx', 0)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      const params = { name: d.id }
      if (params.name === '' || !params.name) return
      router.push({ name: 'node', params })
    })

  nodeGroups
    .append('text')
    .text((d) => d.id)
    .attr('text-anchor', 'middle')
    .attr('fill', (d) => {
      if (d.type === 'output') {
        return '#DE8F5F'
      } else if (d.type === 'fabrication') {
        return '#FFC436'
      } else if (d.type === 'modifier') {
        return '#940B92'
      } else if (d.type === 'ingredient') {
        return '#AEC3AE'
      }
      return '#AEC3AE'
    })
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .attr('alignment-baseline', 'middle')
    .attr('x', 0)
    .attr('y', 15)
}

onMounted(() => {
  const r = setUpData(getOutputs(store.data))
  const n = transformDataToNetwork(getOutputs(store.data) as any)
  console.log(n)
  if (!r) return
  d3Setup(n)
})
</script>

<style scoped></style>