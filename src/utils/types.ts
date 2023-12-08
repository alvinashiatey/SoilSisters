export interface Output {
  [key: string]: string | number
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
}

export interface NetworkData {
  nodes: Node[]
  links: Link[]
}
