<script setup lang="ts">
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { useSoilSistersStore } from '@/stores/soilSisters'
import type { SoilSisters } from '@/stores/soilSisters'
import { watch, onMounted } from 'vue'

const store = useSoilSistersStore()
store.fetchSoilSisters()

const router = useRouter()

const d3Setup = (data: SoilSisters[]) => {
  const root = d3.hierarchy({ children: data })
  const width = window.innerWidth, height = window.innerHeight;
  const descendants = root.descendants()
  const svg = d3
    .select('#container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font', '16px sans-serif')

  const g = svg.append('g')

  const zoom = d3.zoom()
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    })
    .filter(event => {
      return event.type !== "wheel";
    });


  svg.call(zoom as any);

  const nodeGroups = g.selectAll('g.node').data(descendants).join('g').attr('class', 'node');
  nodeGroups
    .append('circle')
    .attr('r', 25)
    .attr('fill', (d) => (d.children ? '#fff' : '#fefefe'))

  d3.forceSimulation(descendants as any)
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30))
    .on('tick', () => {
      nodeGroups.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

  // hide the name of the node and show it on hover
  // can text be center top of the circle
  nodeGroups
    .append('text')
    .text((d) => d.data.name || d.data["Output Name"])
    .attr('text-anchor', 'middle')
    .attr('fill', (d) => (d.data["Output Name"] ? '#F4BF96' : '#A9B388'))
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .attr('alignment-baseline', 'middle')
    .attr('x', 0)

  nodeGroups
    .filter(d => d.data.name || d.data["Output Name"])
    .append('circle')
    .attr('r', 5)
    .attr('fill', (d) => (d.data["Output Name"] ? '#DE8F5F' : '#637E76'))
    .attr('cy', -15)
    .attr('cx', 0)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      const params = { name: d.data.name || d.data["Output Name"]}
      if (params.name === "" || !params.name) return;
      router.push({ name: 'node', params })
    })

    // .on('mouseover', function (event, d) {
    //   d3.select(this).attr('r', 10)
    //   d3.select(this.parentNode).select('text').attr('opacity', 1)
    // })
    // .on('mouseout', function (event, d) {
    //   d3.select(this).attr('r', 5)
    //   d3.select(this.parentNode).select('text').attr('opacity', 0)
    // })

  // watch for window resize and update the svg size
  window.addEventListener('resize', () => {
    svg.attr('width', window.innerWidth).attr('height', window.innerHeight)
  })

  const container = document.getElementById('container') as HTMLElement
  container.append(svg.node() as Node)
}

onMounted(() => {
  d3Setup(store.data)
})





watch(
  () => store.data,
  () => {
    d3Setup(store.data)
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