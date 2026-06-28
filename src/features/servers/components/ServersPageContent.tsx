'use client'

import { InventoryApp } from '@/app/_components/inventory-app'
import { ServersView } from '@/app/_components/servers/servers-view'
import { useServers } from '../hooks/useServers'

export default function ServersPageContent() {
  const loadViewData = useServers()
  return <InventoryApp view="servers" loadViewData={loadViewData} renderView={(props) => <ServersView {...props} />} />
}
