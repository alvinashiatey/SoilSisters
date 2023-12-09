<template>
  <div id="sidebar">
    <div class="loading" v-if="store.isFetching">
      <h4>Loading...</h4>
    </div>
    <ul id="list" ref="list"></ul>
  </div>
</template>

<script setup lang="ts">
import { useSoilSistersStore } from '@/stores/soilSisters'
import { onMounted, ref } from 'vue'
import type { SoilSisters } from '@/stores/soilSisters'

const store = useSoilSistersStore()
store.fetchSoilSisters()
const list = ref<HTMLElement | null>(null)

onMounted(() => {
  const data = store.data
  data.forEach((d: SoilSisters) => {
    const li = document.createElement('li')
    const p = document.createElement('p')
    p.innerHTML = d.sheetName
    p.classList.add('list-group-title')
li.appendChild(p)
    li.classList.add('list-group-item')
    list.value?.appendChild(li)
    const subList = document.createElement('ul')
    subList.classList.add('list-group')
    li.appendChild(subList)
    d.children.forEach((c: { [key: string]: string | number }) => {
      const subLi = document.createElement('li')
      subLi.innerHTML = c.name?.toString() || c['Output Name']?.toString()
      subLi.classList.add('list-sub-group-item')
      subList.appendChild(subLi)
    })
  })
})
</script>

<style lang="scss">
#sidebar {
  width: 20%;
  height: 90%;
  background-color: #51834315;
        backdrop-filter: blur(5px);
  border-right: 1px solid #e5e5e5;
  position: fixed;
  right: 0;
  bottom: 2rem;
  border-radius: 0.5rem;

  #list {
        padding-block: 1em 0;
        padding-inline: 1em;
        /* hide scroll bar */
        &::-webkit-scrollbar {
          display: none;
        }

        .list-group-title{
                border-bottom: 1px solid #e5e5e5;
                color: #bebebe85;
                cursor: pointer;
        }
  }
  
}
</style>
