<script setup lang="ts">
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { useSoilSistersStore } from '@/stores/soilSisters'
import type { SoilSisters } from '@/stores/soilSisters'
import { watch, onMounted, ref } from 'vue'
import type { Selection, BaseType } from 'd3'
import plantIcon from '@/assets/icons/Plants-02.svg'
import outputIcon from '@/assets/icons/Fungi-02.svg'
import SideBar from '@/components/SideBar.vue'

const PrimaryColor = '#181818'
const SecondaryColor = '#E6E6E6'
const TertiaryColor = '#00B1A1'
const QuaternaryColor = '#73D3CB'

const nodeGroupsRef = ref<any | null>(null)
const linkGroupsRef = ref<any | null>(null)
const linksRef = ref<Link[] | null>(null)

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

const handleMouseOver = (
  event: MouseEvent,
  d: Node,
  links: Link[],
  nodeGroups: Selection<SVGGElement | BaseType, Node, SVGGElement, unknown>,
  linkGroups: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  svgElement: SVGGElement | null = null
) => {
  const el = svgElement ?? event.currentTarget
  updateLinkStyles(d.name.toString(), QuaternaryColor, linkGroups)
  updateConnectedNodeStyles(d, TertiaryColor, QuaternaryColor, 1, links, nodeGroups)
  updateNodeStyles(el, QuaternaryColor, TertiaryColor, 1)
}

const handleMouseOut = (
  event: MouseEvent,
  d: Node,
  links: Link[],
  nodeGroups: Selection<SVGGElement | BaseType, Node, SVGGElement, unknown>,
  linkGroups: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  svgElement: SVGGElement | null = null
) => {
  const el = svgElement ?? event.currentTarget
  updateLinkStyles(null, 'none', linkGroups)
  updateConnectedNodeStyles(d, PrimaryColor, SecondaryColor, 0, links, nodeGroups)
  updateNodeStyles(el, SecondaryColor, PrimaryColor, 0)
}

const getConnectedNodes = (
  d: Node,
  links: Link[],
  nodeGroups: Selection<SVGGElement | BaseType, Node, SVGGElement, unknown>
) => {
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

const updateLinkStyles = (
  nodeName: string | null,
  stroke: string,
  linkGroups: d3.Selection<SVGGElement, unknown, HTMLElement, any>
) => {
  linkGroups.selectAll('path').style('stroke', (l) => {
    return (l as Link).from === nodeName || (l as Link).to === nodeName ? stroke : 'none'
  })
}

const updateConnectedNodeStyles = (
  d: Node,
  centerFill: string,
  circleFill: string,
  textOpacity: number,
  links: Link[],
  nodeGroups: Selection<SVGGElement | BaseType, Node, SVGGElement, unknown>
) => {
  const connectedNodes = getConnectedNodes(d, links, nodeGroups)
  connectedNodes.select('.node__center').attr('fill', centerFill)
  connectedNodes.select('.node__circle').attr('fill', circleFill)
  connectedNodes.select('text').attr('opacity', textOpacity)
}

const restartSimulation = (simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) => {
  simulation.alpha(0).restart()
}

const updateNodeStyles = (
  target: any,
  circleFill: string,
  centerFill: string,
  textOpacity: number
) => {
  d3.select(target).select('.node__circle').attr('fill', circleFill)
  d3.select(target).select('.node__center').attr('fill', centerFill)
  d3.select(target).select('text').attr('opacity', textOpacity)
}

const d3SetupWithLinks = (links: Link[] | undefined, nodes: Node[]) => {
  if (!links) return
  linksRef.value = links
  const width = window.innerWidth,
    height = window.innerHeight
  const svg = d3
    .select('#container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font', '16px sans-serif')

  const g = svg.append('g')

  const zoom = d3.zoom().on('zoom', (event) => {
    g.attr('transform', event.transform)
  })
  // .filter((event) => {
  //   return event.type !== 'wheel'
  // })

  svg.call(zoom as any)

  const linkGroups = g.append('g').attr('class', 'links')
  const ng = g.append('g').attr('class', 'nodes')
  const nodeGroups = ng
    .selectAll('g.node')
    .data(nodes)
    .join('g')
    .attr('class', 'node')
    .attr('data-name', (d) => d.name?.toString())
  nodeGroupsRef.value = nodeGroups
  linkGroupsRef.value = linkGroups

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

  nodeGroups
    .attr('cursor', 'pointer')
    .on('mouseover', (event, d) => handleMouseOver(event, d, links, nodeGroups, linkGroups))
    .on('mouseout', (event, d) => handleMouseOut(event, d, links, nodeGroups, linkGroups))
    .on('click', (event, d) => {
      router.push({
        name: 'node',
        params: {
          name: d.name.toString(),
          type: d.type
        }
      })
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
      d3.select(this)
        .append('foreignObject')
        .attr('width', 10)
        .attr('height', 10)
        .attr('y', -5)
        .attr('x', -5)
        .html(`<img src="${plantIcon}" alt="plant svg"/>`)
        .attr('class', 'node__center')
    } else {
      d3.select(this)
        .append('foreignObject')
        .attr('width', 10)
        .attr('height', 10)
        .attr('y', -5)
        .attr('x', -5)
        .html(`<img src="${outputIcon}" alt="output svg"/>`)
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
    .attr('y', 30)
    .attr('opacity', 0)
}

onMounted(() => {
  if (!store.data) return
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

const handleSideBarEmitted = (item: any) => {
  if (item !== null) {
    const node = nodeGroupsRef.value?.filter((d: Node) => d.name === item.name)
    const event = new MouseEvent('mouseover')
    node?.node()?.dispatchEvent(event)
  } else {
    const nodes = nodeGroupsRef.value?.nodes()
    nodes?.forEach((n: any) => {
      const event = new MouseEvent('mouseout')
      n.dispatchEvent(event)
    })
  }


}
</script>

<template>
  <main>
    <SideBar :store="store" @update:selectedItem="handleSideBarEmitted" />
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
