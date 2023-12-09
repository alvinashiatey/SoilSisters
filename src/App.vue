<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'
</script>

<template>
  <SideBar />
  <RouterView :key="$route.fullPath" />
</template>

<style scoped></style>
