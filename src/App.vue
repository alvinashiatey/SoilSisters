<script setup lang="ts">
import { RouterView } from 'vue-router'
import GameOfLife from './components/GameOfLife.vue'
</script>

<template>
  <RouterView :key="$route.fullPath" v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <Component :is="Component" />
    </transition>
  </RouterView>
  <GameOfLife />
</template>

<style scoped></style>
