import * as d3 from 'd3'
import type { Router } from 'vue-router'
import type { NetworkData } from './types'

function networkTree(networkData: NetworkData, container: HTMLElement | null, router: Router) {
  const width = window.innerWidth
  const height = window.innerHeight

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font', '16px sans-serif')

  const g = svg.append('g')

  function forceCenterNode(node: any) {
    return function (alpha: number) {
      // Pull the node toward the center with a strength proportional to alpha
      node.x += (width / 2 - node.x) * alpha
      node.y += (height / 2 - node.y) * alpha
    }
  }

  const centerNode = networkData.nodes[0]
  const zoom = d3
    .zoom()
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
    .filter((event) => event.type !== 'wheel')

  svg.call(zoom as any)

  d3.forceSimulation(networkData.nodes as any)
    .force(
      'link',
      d3.forceLink(networkData.links).id((d) => d.id)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(35))
    .force('centerNode', forceCenterNode(centerNode))
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
        return '#DE8F5F33'
      } else if (d.source.type === 'fabrication') {
        return '#FFC43633'
      } else if (d.source.type === 'modifier') {
        return '#940B9233'
      } else if (d.source.type === 'ingredient') {
        return '#AEC3AE33'
      }
      return '#AEC3AE33'
    })
    .style('stroke-width', 2)
    .style('fill', 'none')
    // .attr('d', (d) => {
    //   const sx = d.source.x,
    //     sy = d.source.y,
    //     tx = d.target.x,
    //     ty = d.target.y
    //   const dx = tx - sx,
    //     dy = ty - sy,
    //     dr = Math.sqrt(dx * dx + dy * dy)
    //   return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`
    // })
    .attr(
      'd',
      d3
        .linkRadial()
        .angle((d) => d.x)
        .radius((d) => d.y)
    )

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

export default networkTree
