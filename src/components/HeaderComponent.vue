<template>
  <header>
    <router-link to="/"><h1>Soil Sisters</h1></router-link>
  </header>
</template>

<script setup lang="ts">
// No JavaScript code is needed for this task
</script>

<style scoped>
header {
  margin-inline-start: 1rem;
  position: fixed;
  h1 {
    &:hover {
      color: var(--tertiary-clr);
      text-decoration: underline;
    }
  }
}
</style>
