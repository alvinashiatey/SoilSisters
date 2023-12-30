<template>
  <div v-if="showDetails" class="site__description" ref="details">
    <h3>
      Soil Sisters investigates a new paradigm for connecting regional biomass supply chains to the
      building material life cycle, in which improving soil health underpins intersectoral material
      performance.
    </h3>
    <br />
    <h3>
      This open-source “Soil Sisters” Materials Library showcases a growing library of biobased
      construction materials and biobased colour.
    </h3>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const details = ref<HTMLElement | null>(null)
const showDetails = ref(true)

window.addEventListener('click', (e) => {
  if (details.value && !details.value.contains(e.target as Node)) {
    showDetails.value = false
  }
})
</script>

<style scoped lang="scss">
.site__description {
  background-color: color-mix(in srgb, var(--quaternary-clr), transparent 30%);
  padding: 1rem;
  border-radius: 1rem;
  margin: 1rem;
  color: var(--primary-clr);
  backdrop-filter: blur(5px);
  position: fixed;
  top: 2rem;
  z-index: 1000;
  width: 50vw;
  h3 {
    font-size: clamp(1rem, 2vw, 2.5rem);
    line-height: 120%;
  }
}
</style>
