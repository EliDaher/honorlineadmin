'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useDashboard } from '../hooks/useDashboard'
import { DashboardView } from './DashboardView'
export default function DashboardPageContent() { const loadViewData = useDashboard(); return <InventoryApp view="dashboard" loadViewData={loadViewData} renderView={(props) => <DashboardView {...props} />} /> }
