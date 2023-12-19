<script setup lang="ts">
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { useSoilSistersStore } from '@/stores/soilSisters'
import type { SoilSisters } from '@/stores/soilSisters'
import { watch, onMounted } from 'vue'

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
  const counts: Record<string, number> = {}
  allIngredients.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1
    return acc
  }, counts)
  const linksFiltered = links?.filter((d) => d)
  const linksFlat = linksFiltered?.flat()
  const combinedArray = [...(ingredientsArray ?? []), ...(outputArray ?? [])]
  const nodes = combinedArray.map((d) => ({
    name: d,
    amount: counts[d] ?? 0
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

  const nodeGroups = g.selectAll('g.node').data(nodes).join('g').attr('class', 'node')
  const linkGroups = g.append('g').attr('class', 'links')

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

  nodeGroups
    .append('text')
    .text((d) => d.name)
    .attr('text-anchor', 'middle')
    .attr('fill', '#bebebe')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .attr('alignment-baseline', 'middle')
    .attr('x', 0)
    .attr('y', 15)

  nodeGroups.append('circle').attr('r', 5).attr('fill', '#bebebe75').attr('cy', 0).attr('cx', 0)

  nodeGroups
    .append('circle')
    .attr('r', (d) => (d.amount ? d.amount : 0))
    .attr('fill', '#bebebe50')
    .attr('cy', 0)
    .attr('cx', 0)

  nodeGroups
    .attr('cursor', 'pointer')
    .on('mouseover', (event, d) => {
      linkGroups.selectAll('path').style('stroke', (l) => {
        return (l as Link)?.from === d.name || (l as Link)?.to === d.name
          ? '#bebebe75'
          : '#bebebe05'
      })
      linkForce.distance((link) => {
        return (link as Link)?.from === d.name || (link as Link)?.to === d.name ? 50 : 100
      })
      simulation.alpha(0).restart()
    })
    .on('click', (event, d) => {
      const params = { name: d.name }
      if (params.name === '' || !params.name) return
      router.push({ name: 'node', params })
    })

  const updateLink = () => {
    linkGroups
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('id', (d) => (d as Link).id)
      .attr('stroke', '#bebebe05')
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
