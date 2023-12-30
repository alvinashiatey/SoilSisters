<template>
  <div id="sidebar">
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
      <div class="loading" v-if="props.store.isFetching">
        <h4>Loading...</h4>
      </div>
      <ul id="list">
        <li v-for="d in props.store.data" :key="d.sheetName" class="list-group-item">
          <p class="list-group-title">{{ d.sheetName }}</p>
          <ul class="list-group">
            <li
              v-for="c in d.children"
              :key="c.id"
              class="list-sub-group-item"
              @click="handleClick(c)"
              @mouseover="handleMouseOver(c)"
              @mouseout="handleMouseOut()"
            >
              {{ c.name || c['Output Name'] }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createLinkElement, updateImage, isUrl, updateTitle } from '@/utils/helpers'
import { ref } from 'vue'

const props = defineProps({
  store: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:selectedItem'])

// const store = useSoilSistersStore()
// store.fetchSoilSisters()

const details = ref<HTMLElement | null>(null)
const showDetails = ref(false)
const itemClicked = ref(false)

const handleClosingDetails = () => {
  showDetails.value = false
  itemClicked.value = false
  emit('update:selectedItem', null)
}

const updateDetails = (item: { [key: string]: string | number }, detailsWrapper: HTMLElement) => {
  const ignoreKeys = ['image', 'Image', 'name', 'Name', 'Output Name']
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

const handleClick = (item: { [key: string]: string | number }) => {
  console.log(item)
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

const handleMouseOver = (item: { [key: string]: string | number }) => {
  if (!itemClicked.value)
  emit('update:selectedItem', item)
}

const handleMouseOut = () => {
  if (!itemClicked.value)
  emit('update:selectedItem', null)
}

</script>

<style lang="scss">
#sidebar {
  position: fixed;
  margin: 1rem;
  pointer-events: none;
  width: 90%;
  height: 100%;
  right: 0;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-block: 2rem;
  --bg-clr: #51834315;

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

      .list-group-item {
        .list-group-title {
          border-bottom: 1px solid #e5e5e5;
          color: #bebebe;
        }
        .list-group {
          .list-sub-group-item {
            cursor: pointer;
          }
        }
      }
    }
  }
}
</style>
