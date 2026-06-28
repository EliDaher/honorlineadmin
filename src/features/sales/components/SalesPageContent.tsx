'use client'

import { InventoryApp } from '@/app/_components/inventory-app'
import { useSales } from '../hooks/useSales'
import { SalesView } from './SalesView'

export default function SalesPageContent() {
  const loadSalesData = useSales()

  return <InventoryApp view="sales" loadViewData={loadSalesData} renderView={(props) => <SalesView {...props} />} />
}
