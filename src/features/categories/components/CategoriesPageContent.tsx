'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useCategories } from '../hooks/useCategories'
import { CategoriesView } from './CategoriesView'
export default function CategoriesPageContent() { const loadViewData = useCategories(); return <InventoryApp view="categories" loadViewData={loadViewData} renderView={(props) => <CategoriesView {...props} />} /> }
