<script setup lang="ts">
import { watch, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import type { Selection, BaseType } from 'd3'
import { useSoilSistersStore } from '@/stores/soilSisters'
import type { SoilSisters, SoilSister, Supply, Demand } from '@/stores/soilSisters'
import type { Link, Node } from '@/utils/types'
import {generateOverlayContent, mapRange, randomString} from '@/utils/helpers'
import plantIcon from '@/assets/icons/Plants-02.svg'
import outputIcon from '@/assets/icons/Fungi-02.svg'
import SideBar from '@/components/SideBar.vue'

const PrimaryColor = '#181818'
const SecondaryColor = '#E6E6E6'
const TertiaryColor = '#00B1A1'
const QuaternaryColor = '#73D3CB'

const nodeGroupsRef = ref<any | null>(null)
const svgRef = ref<any | null>(null)
const zoomRef = ref<any | null>(null)
// const linkGroupsRef = ref<any | null>(null)
// const linksRef = ref<Link[] | null>(null)

const store = useSoilSistersStore()
store.fetchSoilSisters()

const router = useRouter()

const getIngredients = (data: SoilSisters[]): {links: Link[]|undefined, nodes: Node[]|undefined}=> {
  const outputs = data.find((d) => d.sheetName === 'Demand')
  const ingredients = data.find((d) => d.sheetName === 'Supply')
  const ingredientsArray = ingredients?.children?.map((d) => d['Entry Name']) ?? []
  const outputArray = outputs?.children?.map((d) => d['Entry Name'])
  const allIngredients =  ingredients?.children?.map((d)=> (d as Supply)['Regenerative Farming Group']?.split(';').map((i) => i.trim())).flat() ?? []
  console.log(allIngredients.filter(Boolean))

  const links = outputs?.children?.map((d) => {
    const ingredientNames = allIngredients.filter(Boolean);
    const ingredientIndices = ingredientNames.map((d) => ingredientsArray?.indexOf(d ?? ''))
    .filter((index) => index !== -1);
    const outputIndex = outputArray?.indexOf(d['Entry Name'])
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
      if (curr)
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
    fao: parseInt(ingredientsArray.includes(d) ? (ingredients?.children?.find((i) => (i as Supply)['Entry Name'] === d) as Supply)?.FAO : (outputs?.children?.find((i) => i['Entry Name'] === d) as Supply)?.FAO),
    type: ingredientsArray.includes(d) ? 'ingredient' : 'output',
    data: ingredientsArray.includes(d) ? ingredients?.children?.find((i) => (i as Supply)['Entry Name'] === d) : outputs?.children?.find((i) => i['Entry Name'] === d)
  }))
  return { links: linksFlat, nodes }
}

const isIngredients = (data: SoilSisters[]): Supply[] => {
  return data.filter((d) => d.sheetName === 'Supply').flatMap((d) => d.children).sort((a, b) => a['Entry Name']?.localeCompare(b['Entry Name'])) as Supply[]
}

const isOutputs = (data: SoilSisters[]): Demand[] => {
  return data.filter((d) => d.sheetName === 'Demand').flatMap((d) => d.children).sort((a, b) => a['Entry Name']?.localeCompare(b['Entry Name'])) as Demand[]
}

let overlayDiv: HTMLDivElement | null = null

const handleMouseOver = (
  event: MouseEvent,
  d: Node,
  links: Link[],
  nodeGroups: Selection<SVGGElement | BaseType, Node, SVGGElement, unknown>,
  linkGroups: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  svgElement: SVGGElement | null = null
) => {
  const el = svgElement ?? event.currentTarget
  updateLinkStyles(d.name?.toString(), QuaternaryColor, linkGroups)
  updateConnectedNodeStyles(d, TertiaryColor, QuaternaryColor, 1, links, nodeGroups)
  updateNodeStyles(el, QuaternaryColor, TertiaryColor, 1)
  overlayDiv = generateOverlayContent(event, d)
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
  if (overlayDiv) overlayDiv.remove()
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

const d3SetupWithLinks = (links: Link[] | undefined, nodes: Node[] | undefined) => {
  if (!links || !nodes) return
  // linksRef.value = links
  const width = window.innerWidth,
    height = window.innerHeight
  // if svg already exists, remove it
  d3
    .select('#container')
    .selectAll('svg')
    .remove()
  
   let svg = d3
   .select('#container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font', '16px sans-serif')

  svgRef.value = svg
  const g = svg.append('g')

  const zoom = d3.zoom().on('zoom', (event) => {
    g.attr('transform', event.transform)
  })
  // .filter((event) => {
  //   return event.type !== 'wheel'
  // })

  zoomRef.value = zoom;
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
  // linkGroupsRef.value = linkGroups

  const linkForce = d3
    .forceLink()
    .links(links as any)
    .distance(0.5)
    .strength(0.0001)

  const simulation = d3
    .forceSimulation(nodes as any)
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width/2, height/2))
    // .force('link', linkForce)
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

    const maxFao = d3.max(nodes, (d) => d.fao) ?? 500000

  nodeGroups
    .append('circle')
    .attr('r', (d) => (d.fao ? mapRange(d.fao, 0, maxFao, 10, 40) : 0))
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

const handleSideBarEmitted = (item: any) => {
  const zoomToNode = (node: SVGGElement) => {
    // @ts-ignore
    const { x, y } = d3.select(node).datum();
    const centerX = svgRef.value?.attr('width') / 2;
    const centerY = svgRef.value?.attr('height') / 2;
    const scale = 1;
    const transform = d3.zoomIdentity.translate(centerX - x, centerY - y).scale(scale);
    svgRef.value?.transition().duration(500).call(zoomRef.value.transform, transform);
  };

  const resetZoom = () => {
    svgRef.value?.transition().duration(500).call(zoomRef.value.transform, d3.zoomIdentity);
  };

  const dispatchEventToNodes = (eventType: string) => {
    const event = new MouseEvent(eventType);
    if (item !== null) {
      const node = nodeGroupsRef.value?.filter((d: Node) => d.name === item.name).node();
      node?.dispatchEvent(event);
      if (node) zoomToNode(node);
    } else {
      nodeGroupsRef.value?.nodes().forEach((n: Element) => n.dispatchEvent(event));
      resetZoom();
    }
  };

  dispatchEventToNodes(item !== null ? 'mouseover' : 'mouseout');
};

const handleCountrySelect = (event: Event) => {
  const target = event.target as HTMLSelectElement
  store.filterDataByCountry(target.value)
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



</script>
<template>
  <main>
    <div class="select-dropdown">
      <select @change="handleCountrySelect">
        <option v-for="country in store.countries" :key="country" :value="country">{{ country }}</option>
      </select>
    </div>
    <SideBar pos="left" :sheetName="store.originalData[0].sheetName"  :children=isIngredients(store.data) @update:selectedItem="handleSideBarEmitted" />
    <SideBar pos="right" :sheetName="store.originalData[1].sheetName" :children=isOutputs(store.data) @update:selectedItem="handleSideBarEmitted" />
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

  .select-dropdown,
.select-dropdown * {
	
	padding: 0;
	position: relative;
	box-sizing: border-box;
  width: 15rem;
}
.select-dropdown {
  margin: 1rem;
  margin-top: 3rem;
	position: absolute;
	background-color: #51834315;
	border-radius: 4px;
}
.select-dropdown select {
	font-size: 1rem;
	font-weight: normal;
	max-width: 100%;
	padding: 8px 24px 8px 10px;
	border: none;
	background-color: transparent;
		-webkit-appearance: none;
		-moz-appearance: none;
	appearance: none;
}
.select-dropdown select:active, .select-dropdown select:focus {
	outline: none;
	box-shadow: none;
}
.select-dropdown:after {
	content: "";
	position: absolute;
	top: 50%;
	right: 8px;
	width: 0;
	height: 0;
	margin-top: -2px;
	border-top: 5px solid #aaa;
	border-right: 5px solid transparent;
	border-left: 5px solid transparent;
}
}
</style>
