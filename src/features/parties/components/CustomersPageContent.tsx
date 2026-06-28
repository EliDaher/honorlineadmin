'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useCustomers } from '../hooks/useParties'
import { CustomersView } from './CustomersView'
export default function CustomersPageContent() { const loadViewData = useCustomers(); return <InventoryApp view="customers" loadViewData={loadViewData} renderView={(props) => <CustomersView {...props} />} /> }
