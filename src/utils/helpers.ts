import type { Demand, Supply } from '@/stores/soilSisters'

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

function updateDetails(
  item: { [key: string]: string | number },
  detailsWrapper: HTMLElement,
  specificKeys: string[] = []
) {
  const ignoreKeys = ['image', 'Image', 'name', 'Name', 'Output Name']
  detailsWrapper.innerHTML = ''

  const keysToUse =
    specificKeys.length > 0
      ? specificKeys
      : Object.keys(item).filter((key) => !ignoreKeys.includes(key))

  keysToUse.forEach((key) => {
    const value = item[key]
    const p = document.createElement('p')

    if (typeof value === 'string' && isUrl(value)) {
      const linkElement = createLinkElement(value)
      p.innerHTML = `<span class="item__key">${key}:</span> `
      p.appendChild(linkElement)
    } else if (value !== undefined) {
      p.innerHTML = `<span class="item__key">${key}:</span><br><span class="detail_content">${value}</span>`
    }

    detailsWrapper.appendChild(p)
  })
}

export {
  convertDriveLinkToDirectLink,
  createLinkElement,
  updateImage,
  isUrl,
  updateTitle,
  updateDetails
}
