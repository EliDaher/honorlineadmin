import type { ReactNode } from 'react'
import type { InventoryData, ViewKey } from '@/app/_lib/types'

export type ViewDataLoader = (token: string) => Promise<Partial<InventoryData>>

export type InventoryAppViewProps = {
  data: InventoryData
  token: string
  mutate: (action: string, run: () => Promise<unknown>) => Promise<void>
  saving: string
}

export type InventoryAppProps = {
  view: ViewKey
  loadViewData: ViewDataLoader
  renderView: (props: InventoryAppViewProps) => ReactNode
}
