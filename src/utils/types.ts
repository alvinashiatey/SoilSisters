import type { Demand, Supply } from '@/stores/soilSisters'

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

export interface Link {
  id: string
  source: number
  target: number | undefined
  from: string | number
  to: string | number
}

export type CategoryKey = keyof Supply | keyof Demand

export interface Node {
  id: string
  name: string | number
  amount?: number
  fao?: number
  x?: number
  y?: number
  type: string
  data?: Supply | Demand | undefined
}

export interface SoilSisters {
  sheetName: string
  children: Array<{
    [key: string]: string | number
  }>
}

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
            outputType: string | number
            bioBased: string | number
          }
        }[]
      }
  )[]
}
