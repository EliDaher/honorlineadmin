'use client'

import { InventoryApp } from '@/app/_components/inventory-app'
import { useHoldRequests } from '../hooks/useHoldRequests'
import { HoldRequestsView } from './HoldRequestsView'

export default function HoldRequestsPageContent() {
  const loadViewData = useHoldRequests()
  return <InventoryApp view="holdRequests" loadViewData={loadViewData} renderView={(props) => <HoldRequestsView {...props} />} />
}
