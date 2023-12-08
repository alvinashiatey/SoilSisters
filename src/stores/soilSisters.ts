import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'

export const useSoilSistersStore = defineStore('soilSisters', () => {
  const data = ref([]) as Ref<SoilSisters[]>
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
        data.value = res.store
        isFetching.value = false
      } else {
        isFetching.value = true
        const response = await fetch(
          'https://script.google.com/macros/s/AKfycbxxUr5xHxcCj9PEllUVSbGDfk8VmHGstoRPtho5f9VgMWWVOTok1900meuAkEenKjfKSg/exec'
        )
        const { data: d } = await response.json()
        data.value = d as SoilSisters[]

        localStorage.setItem('soilSistersData', JSON.stringify({ store: data.value }))
        localStorage.setItem('lastFetchTime', currentTime.toString())

        isFetching.value = false
      }
    } catch (error) {
      console.error(error)
    }
  }

  return { data, isFetching, fetchSoilSisters }
})

export interface SoilSisters {
  sheetName: string
  children: Array<{
    [key: string]: string | number
  }>
}
