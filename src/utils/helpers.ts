import type { Demand, Supply } from '@/stores/soilSisters'
import type { Node, CategoryKey } from '@/utils/types'

function convertDriveLinkToDirectLink(driveLink: string) {
  if (driveLink.includes('drive.google.com')) {
    const fileId = driveLink.match(/[-\w]{25,}/)
    return fileId ? `https://drive.google.com/uc?export=view&id=${fileId[0]}` : driveLink
  } else {
    return driveLink
  }
}

const createLinkElement = (url: string) => {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.innerText = 'Link'
  a.setAttribute('target', '_blank') // opens the link in a new tab
  return a
}

const updateTitle = (item: Supply | Demand, titleElement: HTMLElement) => {
  titleElement.innerText = String(item['Entry Name'])
}

const updateImage = (item: Supply | Demand, imageElement: HTMLElement) => {
  const imageUrl = item['Image Link']
  if (imageUrl) {
    imageElement.setAttribute('src', convertDriveLinkToDirectLink(String(imageUrl)))
    imageElement.setAttribute('alt', String(item['Entry Name']))
    imageElement.onload = () => {
      // getDominantColor(imageElement as HTMLImageElement)
    }
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

const updateDetails = (item: Supply | Demand) => {
  const ignoreKeys = [
    'Image Link',
    'Entry Name',
    'id',
    'ingredient',
    'Material Bank',
    'Non-Toxic Circular',
    'Carbon Sink',
    'Regenerative Farming',
    'Regenerative Farming Group'
  ]
  const detailsWrapper = document.createElement('div')
  detailsWrapper.className = 'overlay-details'

  Object.entries(item).forEach(([key, value]) => {
    if (!ignoreKeys.includes(key)) {
      const p = document.createElement('p')
      const keyText = key === 'FAO' ? 'FAO Crop Yield (2022), (g/ha)' : key
      if (typeof value === 'string' && isUrl(value)) {
        const linkElement = createLinkElement(value)
        // if key is === 'FAO' then replace the text with 'FAO Link'
        p.innerHTML = `<span class="item__key">${keyText}:</span> `
        p.appendChild(linkElement)
      } else {
        p.innerHTML = `<span class="item__key">${keyText}:</span>&nbsp<span class="detail_content">${value}</span>`
      }
      detailsWrapper.appendChild(p)
    }
  })
  return detailsWrapper
}

const generateImage = (node: Node) => {
  const img = document.createElement('img')
  img.src = node.data?.['Image Link'] ?? ''
  img.alt = String(node.name) ?? ''
  img.className = 'overlay-image'
  return img
}

const generateProductCategory = (node: Node) => {
  const catDiv = document.createElement('div')
  catDiv.className = 'product-category'
  const categories: CategoryKey[] = [
    'Non-Toxic Circular',
    'Carbon Sink',
    'Regenerative Farming',
    'Material Bank'
  ]
  categories.forEach((cat) => {
    if (node.data && (node.data as Record<CategoryKey, string>)[cat] === 'TRUE') {
      const pDiv = document.createElement('div')
      pDiv.classList.add('category', sluggify(cat))
      console.log('cat', sluggify(cat))
      const p = document.createElement('p')
      p.innerText = cat.split(' ')[0].toUpperCase()[0] + cat.split(' ')[1].toUpperCase()[0]
      pDiv.appendChild(p)
      catDiv.appendChild(pDiv)
    }
  })
  return catDiv
}

const sluggify = (str: string) => {
  return str.toLowerCase().replace(/ /g, '-')
}

function generateOverlayContent(event: MouseEvent, node: Node) {
  const fragment = document.createDocumentFragment()
  const div = document.createElement('div')
  fragment.appendChild(div)

  const imgContainer = document.createElement('div')
  imgContainer.className = 'overlay-image-container'
  const img = generateImage(node)
  imgContainer.appendChild(img)
  div.appendChild(imgContainer)

  const secSectionDiv = document.createElement('div')
  secSectionDiv.className = 'overlay-section'
  const detailsDiv = updateDetails(node.data as Supply | Demand)
  secSectionDiv.appendChild(detailsDiv)

  const categoryDiv = generateProductCategory(node)
  secSectionDiv.appendChild(categoryDiv)

  div.appendChild(secSectionDiv)

  div.className = 'overlay-content'
  div.style.cssText = 'visibility: hidden; position: absolute;'

  document.body.appendChild(fragment)

  const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

  const transformX = event.clientX - div.offsetWidth / 2
  const transformY = event.clientY - div.offsetHeight - baseFontSize * 2
  div.style.transform = `translate(${transformX}px, ${transformY}px)`
  div.style.visibility = 'visible'

  return div
}

const mapRange = (value: number, x1: number, y1: number, x2: number, y2: number) => {
  return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2
}

const randomString = () => {
  const r = Math.random().toString(36).substring(2, 15) + new Date().getTime().toString(36)
  return r.replace(/\d/g, '')
}

export {
  convertDriveLinkToDirectLink,
  createLinkElement,
  updateImage,
  isUrl,
  updateTitle,
  updateDetails,
  generateOverlayContent,
  mapRange,
  randomString
}
