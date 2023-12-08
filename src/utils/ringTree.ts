import * as d3 from 'd3'
import type { ZoomBehavior, ZoomedElementBaseType } from 'd3'
import type { NetworkData, Node } from './types'
import type { Router } from 'vue-router'

const ringTree = (networkData: NetworkData, container: HTMLElement | null, router: Router) => {
  if (!container) return
  const width = window.innerWidth,
    height = window.innerHeight
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font', '16px sans-serif')
  const g = svg.append('g')
  const zoom: ZoomBehavior<ZoomedElementBaseType, unknown> = d3
    .zoom()
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
    .filter((event) => event.type !== 'wheel')
  svg.call(zoom as any)
  const innerRadius = 150 / 1.5
  const ringSpacing = 100

  const positionNodes = () => {
    const positionNodesInCircle = (
      nodes: Node[],
      radius: number,
      startAngle: number = 0,
      radialAngle: number = 360
    ) => {
      const totalAngle = radialAngle
      const angleIncrement = totalAngle / nodes.length

      let currentAngle = startAngle
      nodes.forEach((node) => {
        node.x = width / 2 + radius * Math.cos((currentAngle * Math.PI) / 180)
        node.y = height / 2 + radius * Math.sin((currentAngle * Math.PI) / 180)
        currentAngle -= angleIncrement
      })
    }

    const groups = {
      ingredient: networkData.nodes.filter((node) => node.type === 'ingredient'),
      modifiers: networkData.nodes.filter((node) => node.type === 'modifier'),
      fabrication: networkData.nodes.filter((node) => node.type === 'fabrication'),
      output: networkData.nodes.filter((node) => node.type === 'output')
    }

    positionNodesInCircle(groups['ingredient'], innerRadius, 0)
    positionNodesInCircle(groups['modifiers'], innerRadius + ringSpacing, -25)
    positionNodesInCircle(groups['fabrication'], innerRadius + 2 * ringSpacing, 0, 180)
    positionNodesInCircle(groups['output'], innerRadius + 3 * ringSpacing, 0)
  }

  positionNodes()

  const drawGroupCircles = () => {
    const groupRadii = [
      innerRadius,
      innerRadius + ringSpacing,
      innerRadius + 2 * ringSpacing,
      innerRadius + 3 * ringSpacing
    ]
    groupRadii.forEach((radius) => {
      g.append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', radius)
        .style('fill', 'none')
        .style('stroke', '#bebebe20')
        .style('stroke-width', '0.5pt')
    })
  }

  drawGroupCircles()

  networkData.links.forEach((link) => {
    link.source = networkData.nodes.find((node) => node.id === link.source) as Node
    link.target = networkData.nodes.find((node) => node.id === link.target) as Node
  })
  // Add links
  g.selectAll('.link')
    .data(networkData.links)
    .join('path')
    .classed('link', true)
    .style('stroke', (d) => {
      if (d.source.type === 'output') {
        return '#FFF4DA'
      } else if (d.source.type === 'fabrication') {
        return '#FFF4DA'
      } else if (d.source.type === 'modifier') {
        return '#FCF9FC'
      } else if (d.source.type === 'ingredient') {
        return '#EFF3EF'
      }
      return '#AEC3AE33'
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

  // g.selectAll('.link')
  //   .data(networkData.links)
  //   .join('line') // Changed from 'path' to 'line'
  //   .classed('link', true)
  //   .style('stroke', (d) => {
  //     if ((d.source as Node).type === 'output') {
  //       return '#DE8F5F33'
  //     } else if ((d.source as Node).type === 'fabrication') {
  //       return '#FFC43633'
  //     } else if ((d.source as Node).type === 'modifier') {
  //       return '#940B9233'
  //     } else if ((d.source as Node).type === 'ingredient') {
  //       return '#AEC3AE33'
  //     }
  //     return '#AEC3AE33'
  //   })
  //   .style('stroke-width', 2)
  //   .style('fill', 'none')
  //   .attr('x1', (d) => d.source.x)
  //   .attr('y1', (d) => d.source.y)
  //   .attr('x2', (d) => d.target.x)
  //   .attr('y2', (d) => d.target.y)

  const nodeGroups = g
    .selectAll('.node')
    .data(networkData.nodes)
    .join('g')
    .classed('node', true)
    .attr('transform', (d) => `translate(${d.x!},${d.y!})`)
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
    })
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

export default ringTree
