'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useAccounting } from '../hooks/useAccounting'
import { AccountingView } from './AccountingView'
export default function AccountingPageContent() { const loadViewData = useAccounting(); return <InventoryApp view="accounting" loadViewData={loadViewData} renderView={(props) => <AccountingView {...props} />} /> }
