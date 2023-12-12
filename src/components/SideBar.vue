<template>
  <div id="sidebar">
    <div v-show="showDetails" ref="details" class="sidebar__details">
      <p class="title"></p>
      <div class="image__wrapper">
        <img class="item__image" src="" alt="" />
      </div>
      <div class="details__wrapper"></div>
    </div>
    <div class="sidebar__list">
      <div class="loading" v-if="store.isFetching">
        <h4>Loading...</h4>
      </div>
      <ul id="list">
        <li v-for="d in store.data" :key="d.sheetName" class="list-group-item">
          <p class="list-group-title">{{ d.sheetName }}</p>
          <ul class="list-group">
            <li
              v-for="c in d.children"
              :key="c.id"
              class="list-sub-group-item"
              @click="handleClick(c)"
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
import { useSoilSistersStore } from '@/stores/soilSisters'
import { ref } from 'vue'

const store = useSoilSistersStore()
store.fetchSoilSisters()

const details = ref<HTMLElement | null>(null)
const showDetails = ref(false)

function convertDriveLinkToDirectLink(driveLink: string) {
  const fileId = driveLink.match(/[-\w]{25,}/)
  return fileId ? `https://drive.google.com/uc?export=view&id=${fileId[0]}` : ''
}

const updateTitle = (item: { [key: string]: string | number }, titleElement: HTMLElement) => {
  titleElement.innerText = String(item.name || item['Output Name'])
}

const updateImage = (item: { [key: string]: string | number }, imageElement: HTMLElement) => {
  const imageUrl = item['image'] || item['Image']
  if (imageUrl) {
    imageElement.setAttribute('src', convertDriveLinkToDirectLink(String(imageUrl)))
  } else {
    imageElement.setAttribute('src', '')
  }
}

const isUrl = (value: string) => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const createLinkElement = (url: string) => {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.innerText = 'Link'
  a.setAttribute('target', '_blank') // opens the link in a new tab
  return a
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
        p.innerHTML = `<span class="item__key">${key}:</span> ${value}`
      }

      detailsWrapper.appendChild(p)
    }
  })
}

const handleClick = (item: { [key: string]: string | number }) => {
  showDetails.value = true
  const titleElement = details.value!.querySelector('p.title') as HTMLElement
  const imageElement = details.value!.querySelector('.item__image') as HTMLElement
  const detailsWrapper = details.value!.querySelector('.details__wrapper') as HTMLElement

  updateTitle(item, titleElement)
  updateImage(item, imageElement)
  updateDetails(item, detailsWrapper)
}
</script>

<style lang="scss">
#sidebar {
  position: fixed;
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
    width: 40%;
    height: fit-content;
    background-color: var(--bg-clr);
    backdrop-filter: blur(5px);
    border-radius: 0.5rem;
    padding: 1em;
    p.title {
      color: #bebebe;
      border-bottom: 1px solid #e5e5e5;
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
