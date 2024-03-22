import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { generateUUID } from '@/utils/helpers'

export const useSoilSistersStore = defineStore('soilSisters', () => {
  const originalData = ref([]) as Ref<SoilSisters[]>
  const data = ref([]) as Ref<SoilSisters[]>
  const countries = ref([]) as Ref<string[]>
  const isFetching = ref(false)

  const fetchSoilSisters = async () => {
    try {
      const localStorageData = localStorage.getItem('soilSistersData')
      const lastFetchTime = localStorage.getItem('lastFetchTime')

      const currentTime = new Date().getTime()
      const fifteenMinutes = 15 * 60 * 1000 // 15 minutes in milliseconds

      if (
        localStorageData &&
        lastFetchTime &&
        currentTime - parseInt(lastFetchTime) < fifteenMinutes
      ) {
        isFetching.value = true
        const res = JSON.parse(localStorageData)
        originalData.value = res.store
        isFetching.value = false
      } else {
        isFetching.value = true
        const response = await fetch(
          'https://script.google.com/macros/s/AKfycbxgMz8-is_NUw3XiU-iHsmexZPaM9C-WucHPegjajSujbDsVUcimCZzMEaF0Ll_jQXGJw/exec'
        )
        const { data: d } = await response.json()
        originalData.value = d as SoilSisters[]

        localStorage.setItem('soilSistersData', JSON.stringify({ store: originalData.value }))
        localStorage.setItem('lastFetchTime', currentTime.toString())

        isFetching.value = false
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getCountries = () => {
    const c = new Set<string>()
    if (originalData.value.length === 0) return
    originalData.value.forEach((sheet) => {
      sheet.children.forEach((item) => {
        item.Country && c.add(item.Country)
      })
    })
    countries.value = Array.from(c)
    return countries.value
  }

  const filterDataByCountry = (country: string) => {
    data.value = originalData.value.map((sheet) => ({
      sheetName: sheet.sheetName,
      children: sheet.children.reduce((filtered: Array<Supply | Demand>, item) => {
        if (item.Country === country) {
          filtered.push({ ...item, id: generateUUID() })
        }
        return filtered
      }, [])
    }))
  }

  const initializeData = () => {
    if (originalData.value.length > 0) {
      getCountries()
      filterDataByCountry(countries.value[0])
    }
  }

  watch(originalData, () => {
    initializeData()
  })

  return {
    data,
    originalData,
    isFetching,
    countries,
    fetchSoilSisters,
    getCountries,
    filterDataByCountry
  }
})

export interface SoilSisters {
  sheetName: string
  children: Array<Supply | Demand>
}

export interface SoilSister {
  'Entry Name': string
  Site: string
  'Soil Sister Type'?: string
  ingredient: string
  Structure: string
  Skin: string
  Stuff: string
  Ingredients?: string
  Processes?: string
  Recipe?: string
  'Image Link'?: string
}

export interface Supply {
  id?: string
  'Entry Name': string
  Country: string
  FAO: string
  'Regenerative Farming Group': string
  'Image Link': string
  ingredient: string
  'Material Bank': string
  'Non-Toxic Circular': string
  'Carbon Sink ': string
  'Regenerative Farming': string
}

export interface Demand {
  id?: string
  'Entry Name': string
  Country: string
  'Material Bank': string
  'Non-Toxic Circular': string
  'Carbon Sink': string
  'Regenerative Farming': string
  'Image Link': string
  ingredient: string
  'Structure ': string
  Skin: string
  'Stuff ': string
  Ingredients?: string
  Processes?: string
  Recipe?: string
}

export const isSupply = (item: Supply | Demand): item is Supply => {
  return 'FAO' in item
}

export const isDemand = (item: Supply | Demand): item is Demand => {
  return 'Structure ' in item
}
