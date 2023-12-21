<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'
import GameOfLife from './components/GameOfLife.vue'
import Banner from './components/Banner.vue';
</script>

<template>
  <Banner/>
  <SideBar />
  <RouterView :key="$route.fullPath" />
  <GameOfLife />
</template>

<style scoped></style>
