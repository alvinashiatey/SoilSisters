import * as d3 from 'd3'
import type { DataStructure, Params, Node, Link } from './types'
import type { Ref } from 'vue'

export interface Output {
  name: string
  children: {
    name: {
      outputName: string | number
      ingredients: (string | number)[]
      modifiers: (string | number)[]
      outputType: string | number
    }
  }[]
}

const PrimaryColor = '#181818'
const SecondaryColor = '#F2F4F2'
const TertiaryColor = '#00B1A1'
const QuaternaryColor = '#73D3CB'

const modifiers = [
  'cutting',
  'shredding',
  'milling',
  'soaking',
  'boiling',
  'sterilization',
  'mixing',
  'soaking',
  'straining',
  'growing',
  'joining',
  'weaving',
  'pressing',
  'drying',
  'heating',
  'heating + pressing'
]

const outputType = [
  'Textile',
  'Textile Fiberboard',
  'Textile Furniture',
  'earth block',
  'earth wall',
  'earth render',
  'plant dyes',
  'textile plant dyes'
]

const collapsableTree = (
  data: DataStructure | undefined,
  container: HTMLElement | null,
  clicked: Ref<Node | null>
) => {
  if (!container) return
  const width = window.innerWidth,
    height = window.innerHeight

  const nodes = setupNodes(reStructureData(data))
  const links = setUpLinks(reStructureData(data))

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;')

  // on resize, re-render
  window.addEventListener('resize', () => {
    svg.remove()
    collapsableTree(data, container, clicked)
  })

  function positionNodes(nodes: Node[]) {
    const positionNodesInColumn = (nodes: Node[], startX: number, gap: number) => {
      const nodeHeight = 20 // Adjust as needed
      let startY = (height - (nodes.length * nodeHeight + (nodes.length - 1) * gap)) / 2
      nodes.forEach((node) => {
        node.x = startX
        node.y = startY
        startY += nodeHeight + gap
      })
    }

    const groups = {
      ingredient: nodes.filter((node) => node.type === 'ingredient'),
      modifiers: nodes.filter((node) => node.type === 'modifier'),
      output: nodes.filter((node) => node.type === 'output'),
      outputType: nodes.filter((node) => node.type === 'outputType')
    }
    const gap = 16 // Gap between nodes
    const numberOfColumns = Object.keys(groups).length
    const columnWidth = width / numberOfColumns
    let startX = columnWidth / 2

    positionNodesInColumn(groups['outputType'], startX, gap)
    startX += columnWidth
    positionNodesInColumn(groups['output'], startX, gap)
    startX += columnWidth
    positionNodesInColumn(groups['modifiers'], startX, gap)
    startX += columnWidth
    positionNodesInColumn(groups['ingredient'], startX, gap)
  }

  positionNodes(nodes)
  links.forEach((link) => {
    const sourceNode = nodes.find((node) => node.id === link.source)
    const targetNode = nodes.find((node) => node.id === link.target)
    if (sourceNode && targetNode) {
      link.source = sourceNode
      link.target = targetNode
    }
  })

  const linkGroup = svg.append('g').attr('class', 'links')
  const nodeGroup = svg.append('g').attr('class', 'nodes')

  const textElements = nodeGroup
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    // @ts-ignore
    .attr('x', (d) => d.x + 10)
    // @ts-ignore
    .attr('y', (d) => d.y + 3)
    .text((d) => d.id)
    .attr('font-size', '12px')
    .attr('fill', '#000000')

  const textWidths = textElements.nodes()?.map((node) => node.getComputedTextLength())

  nodeGroup
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', 3)
    // @ts-ignore
    .attr('cx', function (d, i) {
      // @ts-ignore
      if (d.type === 'ingredient') {
        return d.x
      } else {
        // @ts-ignore
        const dx = d.x + textWidths[i] + 20
        d.x = dx
        return dx
      }
    })
    // @ts-ignore
    .attr('cy', (d) => d.y)
    .attr('fill', '#000000')
    .attr('stroke', 'none')
    .attr('stroke-width', 1)

  nodeGroup
    .selectAll('text')
    .data(nodes)
    .attr('cursor', 'pointer')
    .on('mouseover', function (event, d) {
      if (d.type === 'output') {
        linkGroup
          .selectAll('path')
          .attr('stroke-opacity', (link) => ((link as Link).type === d.id ? 1 : 0)) // Hide non-matching links
          .filter((link) => (link as Link).type === d.id)
          .attr('stroke', QuaternaryColor)
          .attr('stroke-width', 2)
        clicked.value = d
      }
    })
    .on('mouseout', function (event, d) {
      // if output highlight all links
      if (d.type === 'output') {
        linkGroup
          .selectAll('path')
          .attr('stroke-opacity', 1) // Reset opacity for all links
          .filter((link) => (link as Link).type === d.id)
          .attr('stroke', SecondaryColor)
          .attr('stroke-width', 1)
        clicked.value = null
      }
    })

  linkGroup
    .selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr(
      'd',
      // @ts-ignore
      d3
        .linkHorizontal()
        // @ts-ignore
        .x((d) => d.x)
        // @ts-ignore
        .y((d) => d.y)
    )
    .attr('stroke', SecondaryColor)
    .attr('stroke-width', 1)
    .attr('fill', 'none')
}

const setupNodes = (data: DataStructure | undefined): Node[] => {
  const nodes: Node[] = []
  if (!data) return nodes

  const addNodes = (node: Node) => {
    nodes.push(node)
  }

  const nodesFromName = ['Ingredients', 'Outputs']
  data.children?.forEach((child) => {
    if (child && child.name && nodesFromName.includes(child.name)) {
      child.children?.forEach((item) => {
        if (item && 'name' in item) {
          addNodes({
            id:
              typeof item.name === 'string'
                ? item.name.toString()
                : typeof item.name === 'object'
                  ? item.name.outputName.toString()
                  : '',
            type: child.name === 'Ingredients' ? 'ingredient' : 'output'
          })
        }
      })
    }
  })

  nodes.push({
    id: data.name.toString(),
    type: 'ingredient'
  })

  modifiers.forEach((modifier) => {
    nodes.push({
      id: modifier,
      type: 'modifier'
    })
  })

  outputType.forEach((output) => {
    nodes.push({
      id: output,
      type: 'outputType'
    })
  })

  return nodes
}

const setUpLinks = (data: DataStructure | undefined): Link[] => {
  const links: Link[] = []
  if (!data) return links

  const addLink = (source: string, target: string, type: string) => {
    links.push({
      source,
      target,
      type
    })
  }
  // create link from output to modifiers then to ingredients
  const outputs = data.children?.find((child): child is Output => child && child.name === 'Outputs')
    ?.children

  outputs?.forEach((output) => {
    if (output && typeof output.name === 'object') {
      const outputName = output.name.outputName

      addLink(output.name.outputType.toString(), outputName.toString(), outputName.toString())

      output.name.modifiers.forEach((modifier) => {
        addLink(outputName.toString(), modifier.toString(), outputName.toString())
      })

      output.name.ingredients.forEach((ingredient, index) => {
        addLink(
          output.name.modifiers[index].toString(),
          ingredient.toString(),
          outputName.toString()
        )
      })
    }
  })

  return links
}

const collapseModifiersAndFabricationMethods = (data: DataStructure | undefined) => {
  const modifiers = data?.children?.find(
    (child): child is { name: string; children: { name: string | number }[] } =>
      child && child.name === 'Modifiers'
  )?.children

  const fabricationMethods = data?.children?.find(
    (child): child is { name: string; children: { name: string | number }[] } =>
      child && child.name === 'Fabrication Methods'
  )?.children

  const modifiersAndFabricationMethods = [...(modifiers ?? []), ...(fabricationMethods ?? [])].map(
    (child) => ({
      ...child,
      name: 'Modifiers'
    })
  )

  return modifiersAndFabricationMethods
}

const reStructureData = (data: DataStructure | undefined) => {
  const modifiers = collapseModifiersAndFabricationMethods(data)
  if (data?.children) {
    data.children = data.children.reduce(
      (acc, child) => {
        if (child && child.name !== 'Fabrication Methods') {
          if (child.name === 'Modifiers') {
            acc.push({
              ...child,
              children: modifiers
            })
          } else {
            acc.push(child)
          }
        }
        return acc
      },
      [] as DataStructure['children']
    )

    data.children.sort((a, b) => {
      const order = ['Output', 'Modifiers', 'Ingredients']
      if (a && a.name && b && b.name) {
        return order.indexOf(a.name) - order.indexOf(b.name)
      }
      return 0
    })
  }
  return data
}

export default collapsableTree
