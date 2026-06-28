'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useWorkers } from '../hooks/useParties'
import { WorkersView } from './WorkersView'
export default function WorkersPageContent() { const loadViewData = useWorkers(); return <InventoryApp view="workers" loadViewData={loadViewData} renderView={(props) => <WorkersView {...props} />} /> }
