<template>
  <div class="sidebar" ref="sidebar">
    <div v-show="showDetails" ref="details" class="sidebar__details">
      <button @click="handleClosingDetails">
        <!-- svg close -->
        <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <line x1="3" y1="3" x2="21" y2="21" stroke="#bebebe" stroke-width="2" />
          <line x1="21" y1="3" x2="3" y2="21" stroke="#bebebe" stroke-width="2" />
        </svg>
      </button>
      <p class="title"></p>
      <div class="image__wrapper">
        <img class="item__image" src="" alt="" lazy="loading" />
      </div>
      <div class="details__wrapper"></div>
    </div>
    <div class="sidebar__list">
      <ul id="list">
        <p class="list-group-title">{{ sheetName }}</p>
        <li v-for="d in props.children" :key="d.id" class="list-group-item">
         <p class="list-sub-group-item" @click="handleClick(d)"
              @mouseover="handleMouseOver(d)"
              @mouseout="handleMouseOut()">
            {{ d['Entry Name'] }}
         </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createLinkElement, updateImage, isUrl, updateTitle } from '@/utils/helpers'
import type { Supply, Demand } from '@/stores/soilSisters';
import { ref, onMounted } from 'vue'

const props = defineProps({
  sheetName: {
    type: String,
    required: true,
  },
  children: {
    type: Array as () => Array<Supply | Demand>,
    required: true,
  },
  pos: {
    type: String,
    required: true,
  }
})



const emit = defineEmits(['update:selectedItem'])

const sidebar = ref<HTMLElement | null>(null)
const details = ref<HTMLElement | null>(null)
const showDetails = ref(false)
const itemClicked = ref(false)

const handleClosingDetails = () => {
  showDetails.value = false
  itemClicked.value = false
  emit('update:selectedItem', null)
}

const updateDetails = (item: (Supply | Demand), detailsWrapper: HTMLElement) => {
  const ignoreKeys = ['Image Link', 'Entry Name',]
  detailsWrapper.innerHTML = ''

  Object.entries(item).forEach(([key, value]) => {
    if (!ignoreKeys.includes(key)) {
      const p = document.createElement('p')
      if (typeof value === 'string' && isUrl(value)) {
        const linkElement = createLinkElement(value)
        p.innerHTML = `<span class="item__key">${key}:</span> `
        p.appendChild(linkElement)
      } else {
        p.innerHTML = `<span class="item__key">${key}:</span><span class="detail_content">${value}</span>`
      }
      detailsWrapper.appendChild(p)
    }
  })
}

const handleClick = (item: (Supply | Demand)) => {
  showDetails.value = true
  itemClicked.value = true
  const titleElement = details.value!.querySelector('p.title') as HTMLElement
  const imageElement = details.value!.querySelector('.item__image') as HTMLElement
  const detailsWrapper = details.value!.querySelector('.details__wrapper') as HTMLElement

  updateTitle(item, titleElement)
  updateImage(item, imageElement)
  updateDetails(item, detailsWrapper)
  emit('update:selectedItem', item)
}

const handleMouseOver = (item: (Supply | Demand)) => {
  if (!itemClicked.value)
  emit('update:selectedItem', item)
}

const handleMouseOut = () => {
  if (!itemClicked.value)
  emit('update:selectedItem', null)
}

onMounted(() => {
  props.pos === 'right' ? sidebar.value?.classList.add('right') : sidebar.value?.classList.add('left')
})

</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  margin: 1rem;
  margin-top: 4rem;
  pointer-events: none;
  width: 90%;
  height: 90%;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-block: 2rem;
  --bg-clr: #51834315;

  &.right {
    right: 0;
  }

  &.left {
    left: 0;
    flex-direction: row-reverse;
  }

  & > * {
    pointer-events: auto;
  }

  .sidebar__details {
    width: 30%;
    height: fit-content;
    max-height: 90%;
    overflow-y: scroll;
    background-color: var(--bg-clr);
    backdrop-filter: blur(5px);
    border-radius: 0.5rem;
    padding: 1em;

    &::-webkit-scrollbar {
      display: none;
    }

    p.title {
      color: #bebebe;
      border-bottom: 1px solid #e5e5e5;
    }

    button {
      position: absolute;
      top: 1em;
      right: 1em;
      background-color: transparent;
      border: none;
      cursor: pointer;
      outline: none;
      transition: transform 0.2s ease-in-out;

      svg {
        width: 1em;
        height: 1em;
      }

      &:hover {
        transform: scale(1.2);
      }
    }

    .item__key {
      color: #bebebe;
    }
  }
  .sidebar__list {
    width: 20%;
    height: 90%;
    background-color: var(--bg-clr);
    backdrop-filter: blur(5px);
    border-right: 1px solid #e5e5e5;
    border-radius: 0.5rem;

    #list {
      padding-block: 1em;
      padding-inline: 1em;
      /* hide scroll bar */
      &::-webkit-scrollbar {
        display: none;
      }
      .list-group-title {
        border-bottom: 1px solid #e5e5e5;
        color: #bebebe;
      }

      .list-group-item {
        text-transform: capitalize;
        cursor: pointer;

      }
    }
  }
}
</style>
