'use client'

import { InventoryApp } from '@/app/_components/inventory-app'
import { useWorkerPortal } from '../hooks/useWorkerPortal'
import { WorkerPortalView } from './WorkerPortalView'

export default function WorkerPortalPageContent() {
  const loadViewData = useWorkerPortal()
  return <InventoryApp view="myCustody" loadViewData={loadViewData} renderView={(props) => <WorkerPortalView {...props} />} />
}
