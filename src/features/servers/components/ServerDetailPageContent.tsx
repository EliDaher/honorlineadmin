'use client'

import { Server } from 'lucide-react'
import { EmptyState } from '@/app/_components/ui'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useServers } from '../hooks/useServers'
import { ServerDetailView } from './ServerDetailView'

export default function ServerDetailPageContent({ serverId }: { serverId: string }) {
  const loadViewData = useServers()

  return (
    <InventoryApp
      view="servers"
      loadViewData={loadViewData}
      renderView={(props) => {
        const server = props.data.servers.find((item) => item.id === serverId)
        if (!server) {
          return <EmptyState title="السيرفر غير موجود." description="ارجع إلى قائمة السيرفرات واختر سيرفر محفوظ." icon={Server} />
        }

        return <ServerDetailView server={server} token={props.token} />
      }}
    />
  )
}
