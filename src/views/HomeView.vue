<script setup lang="ts">
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { useSoilSistersStore } from '@/stores/soilSisters'
import type { SoilSisters } from '@/stores/soilSisters'
import { watch, onMounted } from 'vue'

const PrimaryColor = '#181818'
const SecondaryColor = '#E6E6E6'
const TertiaryColor = '#00B1A1'
const QuaternaryColor = '#73D3CB'

const store = useSoilSistersStore()
store.fetchSoilSisters()

const router = useRouter()

const getIngredients = (data: SoilSisters[]) => {
  const outputs = data.find((d) => d.sheetName === 'Outputs')
  const ingredients = data.filter((d) => d.sheetName !== 'Outputs')
  const ingredientsArray = [
    ...new Set(ingredients.map((d) => d.children?.map((d) => d['name'])).flat())
  ]
  const outputArray = outputs?.children?.map((d) => d['Output Name'])
  const allIngredients: string[] = []
  const links = outputs?.children?.map((d) => {
    const keys = Object.keys(d)
    const regex = /Ingredient \d+ Name/
    const ingredientKeys = keys.filter((k) => regex.test(k))
    const ingredientValues: string[] = ingredientKeys.map((k) => d[k].toString())
    allIngredients.push(...ingredientValues)
    const ingredientNames = ingredientValues.filter((d) => d)
    const ingredientIndices = ingredientNames.map((d) => ingredientsArray?.indexOf(d))
    const outputIndex = outputArray?.indexOf(d['Output Name'])
    const ingredientIndicesFiltered = ingredientIndices?.filter((d) => d !== -1)
    const links = ingredientIndicesFiltered?.map((d) => {
      return {
        id: randomString(),
        source: d,
        target: outputIndex,
        from: ingredientsArray[d],
        to: outputIndex !== undefined ? outputArray?.[outputIndex] ?? '' : ''
      }
    })
    return links
  })
  // find out how many times each ingredient is present in the allIngredients array
  const counts = allIngredients.reduce(
    (acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const linksFiltered = links?.filter((d) => d)
  const linksFlat = linksFiltered?.flat()
  const combinedArray = [...(ingredientsArray ?? []), ...(outputArray ?? [])]
  const nodes = combinedArray.map((d) => ({
    name: d,
    amount: counts[d] ?? 0,
    type: ingredientsArray.includes(d) ? 'ingredient' : 'output'
  }))
  return { links: linksFlat, nodes }
}

const randomString = () => {
  const r = Math.random().toString(36).substring(2, 15) + new Date().getTime().toString(36)
  return r.replace(/\d/g, '')
}

interface Link {
  id: string
  source: number
  target: number | undefined
  from: string | number
  to: string | number
}

interface Node {
  name: string | number
  amount?: number
  x?: number
  y?: number
  type: string
}

const d3SetupWithLinks = (links: Link[] | undefined, nodes: Node[]) => {
  if (!links) return
  const width = window.innerWidth,
    height = window.innerHeight
  const svg = d3
    .select('#container')
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
    .filter((event) => {
      return event.type !== 'wheel'
    })

  svg.call(zoom as any)

  const linkGroups = g.append('g').attr('class', 'links')
  const ng = g.append('g').attr('class', 'nodes')
  const nodeGroups = ng.selectAll('g.node').data(nodes).join('g').attr('class', 'node')

  const linkForce = d3
    .forceLink()
    .links(links as any)
    .distance(100)
    .strength(0.001)

  const simulation = d3
    .forceSimulation(nodes as any)
    .force('charge', d3.forceManyBody().strength(-30))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('link', linkForce)
    .force('collision', d3.forceCollide().radius(30))
    .on('tick', () => {
      nodeGroups.attr('transform', (d) => `translate(${d.x},${d.y})`)
      updateLink()
    })

  const updateLink = () => {
    linkGroups
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('id', (d) => (d as Link).id)
      .attr('stroke', 'none')
      .attr('fill', 'none')
      .attr('d', (d) => {
        const source = nodes.find((n) => n.name === d.from)
        const target = nodes.find((n) => n.name === d.to)
        if (!source || !target) return ''
        const dx = (target.x ?? 0) - (source.x ?? 0)
        const dy = (target.y ?? 0) - (source.y ?? 0)
        const dr = Math.sqrt(dx * dx + dy * dy)

        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`
      })
  }

 

  // Function to handle mouseover event
  const handleMouseOver = (event: MouseEvent, d: Node) => {
    updateLinkStyles(d.name.toString(), QuaternaryColor)
    updateConnectedNodeStyles(d, TertiaryColor, QuaternaryColor, 1)
    restartSimulation()
    updateNodeStyles(event.currentTarget, QuaternaryColor, TertiaryColor, 1)
  }

  // Function to handle mouseout event
  const handleMouseOut = (event: MouseEvent, d: Node) => {
    updateLinkStyles(null, 'none')
    restartSimulation()
    updateConnectedNodeStyles(d, PrimaryColor, SecondaryColor, 0)
    updateNodeStyles(event.currentTarget, SecondaryColor, PrimaryColor, 0)
  }

  // Function to get connected nodes
  const getConnectedNodes = (d: Node) => {
    const connectedNodes = links.filter((l) => {
      return l.from === d.name || l.to === d.name
    })

    const connectedNodeNames = connectedNodes.map((l) => {
      return l.from === d.name ? l.to : l.from
    })

    return nodeGroups.filter((n) => {
      return connectedNodeNames.includes(n.name)
    })
  }

  // Function to update link styles
  const updateLinkStyles = (nodeName: string | null, stroke: string) => {
    linkGroups
      .selectAll('path')
      .style('stroke', (l) => {
        return (l as Link).from === nodeName || (l as Link).to === nodeName ? stroke : 'none'
      })
  }

  // Function to update connected node styles
  const updateConnectedNodeStyles = (d: Node, centerFill: string, circleFill: string, textOpacity: number) => {
    const connectedNodes = getConnectedNodes(d)
    connectedNodes.select('.node__center').attr('fill', centerFill)
    connectedNodes.select('.node__circle').attr('fill', circleFill)
    connectedNodes.select('text').attr('opacity', textOpacity)
  }

  // Function to restart simulation
  const restartSimulation = () => {
    simulation.alpha(0).restart()
  }

  // Function to update node styles
  const updateNodeStyles = (target: any, circleFill: string, centerFill: string, textOpacity: number) => {
    d3.select(target).select('.node__circle').attr('fill', circleFill)
    d3.select(target).select('.node__center').attr('fill', centerFill)
    d3.select(target).select('text').attr('opacity', textOpacity)
  }

  nodeGroups
    .attr('cursor', 'pointer')
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('click', (event, d) => {
      // updateLinkStyles(d.name.toString(), QuaternaryColor)
    })


  nodeGroups
    .append('circle')
    .attr('r', (d) => (d.amount ? d.amount : 0))
    .attr('fill', SecondaryColor)
    .attr('cy', 0)
    .attr('cx', 0)
    .attr('class', 'node__circle')

  nodeGroups.each(function (d) {
    if (d.type === 'ingredient') {
      d3.select(this).append('circle')
      .attr('r', 5)
      .attr('fill', PrimaryColor)
      .attr('cy', 0)
      .attr('cx', 0)
      .attr('class', 'node__center')
    } else {
      d3.select(this).append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', PrimaryColor)
      .attr('y', -5)
      .attr('x', -5)
      .attr('class', 'node__center')
    }
  })

  nodeGroups
    .append('text')
    .text((d) => d.name)
    .attr('text-anchor', 'middle')
    .attr('fill', TertiaryColor)
    .attr('font-size', 12)
    .attr('pointer-events', 'none')
    .attr('alignment-baseline', 'middle')
    .attr('x', 0)
    .attr('y', 25)
    .attr('opacity', 0)
}

onMounted(() => {
  const { links, nodes } = getIngredients(store.data)
  d3SetupWithLinks(links, nodes)
})

watch(
  () => store.data,
  () => {
    const { links, nodes } = getIngredients(store.data)
    d3SetupWithLinks(links, nodes)
  }
)
</script>

<template>
  <main>
    <div class="wrapper">
      <div class="loading" v-if="store.isFetching">
        <h4>Loading...</h4>
      </div>
      <div id="container"></div>
    </div>
  </main>
</template>

<style scoped lang="scss">
main {
  height: 100dvh;
  overflow: hidden;
}
</style>
