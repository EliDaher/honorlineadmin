'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useContacts } from '../hooks/useContacts'
import { ContactsView } from './ContactsView'
export default function ContactsPageContent() { const loadViewData = useContacts(); return <InventoryApp view="contacts" loadViewData={loadViewData} renderView={(props) => <ContactsView {...props} />} /> }
