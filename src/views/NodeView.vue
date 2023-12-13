<template>
  <main>
    <div class="wrapper">
      <div ref="container" id="container"></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import createRadialTidyTree from '@/utils/createRadialTidyTree'
import networkTree from '@/utils/networkTree'
import ringTree from '@/utils/ringTree'
import type { NetworkData, Node, Link, Output } from '@/utils/types'
import { useRoute, useRouter } from 'vue-router'
import { useSoilSistersStore } from '@/stores/soilSisters'
import { onMounted, ref } from 'vue'
import type { SoilSisters } from '@/stores/soilSisters'

interface DataItem {
  [key: string]: string | number
}

const store = useSoilSistersStore()
store.fetchSoilSisters()

const route = useRoute()
const router = useRouter()
let name = route.params.name

const container = ref<HTMLElement | null>(null)

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
  const modifiers = getModifiersFromOutputs(data) ?? []
  const fabricationMethods = getFabricationMethodsFromOutputs(data) ?? []
  const outPutNames = getOutNameFromOutputs(data) ?? []
  const otherIngredients = getOtherIngredientsFromOutputs(data) ?? []

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
        nodes.push({ id: String(ingredientName), type: 'ingredient' })

        if (modifierName) {
          links.push({ source: String(ingredientName), target: String(modifierName) })
          nodes.push({ id: String(modifierName), type: 'modifier' })

          if (fabricationMethod) {
            links.push({ source: String(modifierName), target: String(fabricationMethod) })
          }
        } else if (fabricationMethod) {
          links.push({ source: String(ingredientName), target: String(fabricationMethod) })
        }
      }
    }

    if (fabricationMethod) {
      nodes.push({ id: String(fabricationMethod), type: 'fabrication' })
    }

    if (outputName) {
      nodes.push({ id: String(outputName), type: 'output' })

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
        links.push({ source: String(sourceForOutput), target: String(outputName) })
      }
    }
  })

  nodes = Array.from(new Map(nodes.map((node) => [node.id, node])).values())
  return { nodes, links }
}

onMounted(() => {
  const r = setUpData(getOutputs(store.data))
  const n = transformDataToNetwork(getOutputs(store.data) as any)
  if (!r) return
  // networkTree(n, container.value, router)
  // createRadialTidyTree(getOutputs(store.data), container.value)
  ringTree(n, container.value, router)
})
</script>

<style scoped></style>
