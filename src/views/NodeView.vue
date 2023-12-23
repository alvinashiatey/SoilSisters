<template>
  <main>
    <div class="wrapper">
      <div ref="container" id="container"></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { NetworkData, Node, Link, Output, Params, DataStructure } from '@/utils/types'
import { useRoute, useRouter } from 'vue-router'
import { useSoilSistersStore } from '@/stores/soilSisters'
import { onMounted, ref } from 'vue'
import type { SoilSisters } from '@/stores/soilSisters'
import collapsableTree from '@/utils/collapsableTree'

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
  const fabricationMethods = data.map((d) => d['Fabrication Method ']).filter((d) => d)
  return [...new Set(fabricationMethods)]
}

const getOutNameFromOutputs = (data: Output[] | undefined) => {
  if (!data) return []
  return data.map((d) => {
    const ingredients = Array.from({ length: 4 }, (_, i) => d[`Ingredient ${i + 1} Name`]).filter(
      Boolean
    )
    const modifiers = Array.from({ length: 4 }, (_, i) => d[`Modifier Method ${i + 1}`]).filter(
      Boolean
    )

    const outputType = d['Output Type']
    return {
      outputName: d['Output Name'],
      ingredients,
      modifiers,
      outputType
    }
  })
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

const setUpData = (data: Output[] | undefined): DataStructure | undefined => {
  if (!data) return
  const modifiers = getModifiersFromOutputs(data) ?? []
  const fabricationMethods = getFabricationMethodsFromOutputs(data) ?? []
  const outPutNames = getOutNameFromOutputs(data) ?? []
  const otherIngredients = getOtherIngredientsFromOutputs(data) ?? []

  const children = [
    otherIngredients.length > 0 && {
      name: 'Ingredients',
      children: otherIngredients.map((m) => ({ name: m }))
    },
    modifiers.length > 0 && { name: 'Modifiers', children: modifiers.map((m) => ({ name: m })) },
    fabricationMethods.length > 0 && {
      name: 'Fabrication Methods',
      children: fabricationMethods.map((m) => ({ name: m }))
    },
    outPutNames.length > 0 && {
      name: 'Outputs',
      children: outPutNames.map((m) => ({ name: m }))
    }
  ].filter(Boolean) //

  return {
    name: name, // Assuming 'name' is defined elsewhere in your code
    children: children
  }
}

function addNode(nodes: Node[], id: string, type: string) {
  nodes.push({ id, type })
}

function addLink(links: Link[], source: string, target: string, type?: string) {
  links.push({ source, target, type })
}

function findSourceForOutput(item: DataItem): string | number | undefined {
  return (
    (item['Fabrication Method '] ||
      item['Modifier Method 4'] ||
      item['Modifier Method 3'] ||
      item['Modifier Method 2'] ||
      item['Modifier Method 1'] ||
      item['Ingredient 1 Name'] ||
      item['Ingredient 2 Name'] ||
      item['Ingredient 3 Name'] ||
      item['Ingredient 4 Name']) ??
    undefined
  )
}

function transformDataToNetwork(data: DataItem[]): NetworkData {
  let nodes: Node[] = [],
    links: Link[] = []

  data.forEach((item) => {
    const fabricationMethod = item['Fabrication Method ']
    const outputName = item['Output Name']
    let lastModifier: string | null = null

    for (let i = 1; i <= 4; i++) {
      const ingredientName = item[`Ingredient ${i} Name`]
      const modifierName = item[`Modifier Method ${i}`]
      if (ingredientName) {
        addNode(nodes, String(ingredientName), 'ingredient')
        if (modifierName) {
          addNode(nodes, String(modifierName), 'modifier')
          addLink(links, String(ingredientName), String(modifierName), String(outputName))
          lastModifier && modifierName
            ? addLink(links, String(lastModifier), String(modifierName), String(outputName))
            : null
          lastModifier = modifierName.toString()
        } else {
          if (lastModifier) {
            addLink(links, String(lastModifier), String(ingredientName), String(outputName))
          }
          // lastModifier = modifierName.toString();
        }
      } else if (modifierName) {
        addNode(nodes, String(modifierName), 'modifier')
        if (lastModifier) {
          addLink(links, String(lastModifier), String(modifierName), String(outputName))
        }
        lastModifier = modifierName.toString()
      }
    }

    if (fabricationMethod) {
      addNode(nodes, String(fabricationMethod), 'fabrication')
      if (lastModifier) {
        addLink(links, String(lastModifier), String(fabricationMethod), String(outputName))
      }
    }

    if (outputName) {
      addNode(nodes, String(outputName), 'output')
      const sourceForOutput = findSourceForOutput(item)
      if (sourceForOutput) {
        addLink(links, String(sourceForOutput), String(outputName), String(outputName))
      }
    }
  })

  nodes = Array.from(new Map(nodes.map((node) => [node.id, node])).values())
  return { nodes, links }
}

onMounted(() => {
  const r = setUpData(getOutputs(store.data))
  if (!r) return
  if (Array.isArray(name)) name = name[0]
  const params = route.params as unknown as Params
  collapsableTree(r, container.value, params)
})
</script>

<style scoped></style>
