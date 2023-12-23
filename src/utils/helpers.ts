function convertDriveLinkToDirectLink(driveLink: string) {
  const fileId = driveLink.match(/[-\w]{25,}/)
  return fileId ? `https://drive.google.com/uc?export=view&id=${fileId[0]}` : ''
}

const createLinkElement = (url: string) => {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.innerText = 'Link'
  a.setAttribute('target', '_blank') // opens the link in a new tab
  return a
}

const updateTitle = (item: { [key: string]: string | number }, titleElement: HTMLElement) => {
  titleElement.innerText = String(item.name || item['Output Name'])
}

const updateImage = (item: { [key: string]: string | number }, imageElement: HTMLElement) => {
  const imageUrl = item['image'] || item['Image']
  if (imageUrl) {
    imageElement.setAttribute('src', convertDriveLinkToDirectLink(String(imageUrl)))
    imageElement.setAttribute('alt', String(item.name || item['Output Name']))
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

export { convertDriveLinkToDirectLink, createLinkElement, updateImage, isUrl, updateTitle }
