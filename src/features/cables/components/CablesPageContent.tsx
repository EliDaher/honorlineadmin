'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useCables } from '../hooks/useCables'
import { CablesView } from './CablesView'
export default function CablesPageContent() { const loadViewData = useCables(); return <InventoryApp view="cables" loadViewData={loadViewData} renderView={(props) => <CablesView {...props} />} /> }
