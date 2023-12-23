import * as d3 from 'd3'
import type { ZoomBehavior, ZoomedElementBaseType } from 'd3'
import type { NetworkData, Node } from './types'
import type { Router } from 'vue-router'

const ringTree = (
  networkData: NetworkData,
  container: HTMLElement | null,
  centerNodeName: string,
  router: Router
) => {
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
        if (node.id === centerNodeName) {
          node.x = width / 2
          node.y = height / 2
        } else {
          node.x = width / 2 + radius * Math.cos((currentAngle * Math.PI) / 180)
          node.y = height / 2 + radius * Math.sin((currentAngle * Math.PI) / 180)
          currentAngle -= angleIncrement
        }
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
        .style('stroke', '#bebebe50')
        .style('stroke-width', '1pt')
    })
  }

  networkData.links.forEach((link) => {
    link.source = networkData.nodes.find((node) => node.id === link.source) as Node
    link.target = networkData.nodes.find((node) => node.id === link.target) as Node
  })
  // Add links
  const links = g
    .selectAll('.link')
    .data(networkData.links)
    .join('path')
    .classed('link', true)
    .style('stroke', '#bebebe15')
    .style('stroke-width', 1)
    .style('fill', 'none')
    .attr('d', (d) => {
      const sx = (d.source as Node).x ?? 0,
        sy = (d.source as Node).y ?? 0,
        tx = (d.target as Node).x ?? 0,
        ty = (d.target as Node).y ?? 0
      const dx = tx - sx,
        dy = ty - sy,
        dr = Math.sqrt(dx * dx + dy * dy) * (Math.random() < 0.5 ? 3 : 1)
      return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`
    })

  drawGroupCircles()

  const nodeGroups = g
    .selectAll('.node')
    .data(networkData.nodes)
    .join('g')
    .classed('node', true)
    .attr('transform', (d) => `translate(${d.x!},${d.y!})`)

  nodeGroups
    .append('circle')
    .attr('r', 5)
    .attr('fill', '#bebebe75')
    .attr('cy', 0)
    .attr('cx', 0)
    .on('mouseover', (event, d) => {
      if (d.type === 'output') {
        links.style('stroke', (linkData) => {
          if (linkData.type === d.id) {
            return '#DE8F5F'
          }
          return '#bebebe15'
        })
      }
    })
    .on('mouseout', () => {
      links.style('stroke', '#bebebe15')
      nodeGroups.select('circle').style('stroke', '#bebebe75')
    })
  // .attr('cursor', 'pointer')
  // .on('click', (_, d) => {
  //   const params = { name: d.id }
  //   if (params.name === '' || !params.name) return
  //   router.push({ name: 'node', params })
  // })

  nodeGroups
    .append('text')
    .text((d) => d.id)
    .attr('text-anchor', 'middle')
    .attr('fill', '#bebebe75')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .attr('alignment-baseline', 'middle')
    .attr('x', 0)
    .attr('y', 15)
}

export default ringTree
