'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useHolds } from '../hooks/useHolds'
import { HoldsView } from './HoldsView'
export default function HoldsPageContent() { const loadViewData = useHolds(); return <InventoryApp view="holds" loadViewData={loadViewData} renderView={(props) => <HoldsView {...props} />} /> }
