export interface Output {
  [key: string]: string | number
}

export interface Params {
  name: string
  type: 'ingredient' | 'output'
}

export interface NetworkData {
  nodes: Node[]
  links: Link[]
}

export interface Node {
  id: string
  type: string
  x?: number
  y?: number
}

export interface Link {
  source: Node | string
  target: Node | string
  type?: string
}

export interface NetworkData {
  nodes: Node[]
  links: Link[]
}

export interface SoilSisters {
  sheetName: string
  children: Array<{
    [key: string]: string | number
  }>
}

//

export interface DataStructure {
  name: string | string[]
  children: (
    | false
    | { name: string; children: { name: string | number }[] }
    | {
        name: string
        children: {
          name: {
            outputName: string | number
            ingredients: (string | number)[]
            modifiers: (string | number)[]
          }
        }[]
      }
  )[]
}
