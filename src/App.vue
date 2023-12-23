<script setup lang="ts">
import { RouterView } from 'vue-router'
// import SideBar from './components/SideBar.vue'
import GameOfLife from './components/GameOfLife.vue'
import BannerComponent from './components/BannerComponent.vue'
// import { ref } from 'vue'

// const selectedItem = ref({})
// const handleSelectItemFromSideBar = (item: { [key: string]: string | number }) => {
//   selectedItem.value = item
// }
</script>

<template>
  <BannerComponent />
  <!-- <SideBar @update:selectedItem="handleSelectItemFromSideBar" /> -->
  <RouterView :key="$route.fullPath" v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <Component :is="Component" :selectItem="selectedItem" />
    </transition>
  </RouterView>
  <GameOfLife />
</template>

<style scoped></style>
