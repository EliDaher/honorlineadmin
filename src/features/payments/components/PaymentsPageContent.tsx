'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { usePayments } from '../hooks/usePayments'
import { PaymentsView } from './PaymentsView'
export default function PaymentsPageContent() { const loadViewData = usePayments(); return <InventoryApp view="payments" loadViewData={loadViewData} renderView={(props) => <PaymentsView {...props} />} /> }
