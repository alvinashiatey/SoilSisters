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
          'https://script.googleusercontent.com/macros/echo?user_content_key=F_pY2IsunljaSFUFbwZdRQ1k_7K795mISBMHxjMzz-gK0d5z0gMh2HSSwmyVQ3PQS--LNgFS6LfQ3PMev_scTtgftZOjxKefm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnEYiVI3wasC6PBAMM6OO-y0CJU6yNUIMF_ReNwrgxrNvwoqjCRIuHp-tswTScVzQ9x1XItD12_1aHpeqXBpXN6GkkDeQTo-trdz9Jw9Md8uu&lib=M7rz4ZDqVlqynInh1ZuHX-Yxw7cvAI0XW'
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
  children: Array<SoilSister>
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
