'use client'
import { InventoryApp } from '@/app/_components/inventory-app'
import { useProducts } from '../hooks/useProducts'
import { ProductsView } from './ProductsView'
export default function ProductsPageContent() { const loadViewData = useProducts(); return <InventoryApp view="products" loadViewData={loadViewData} renderView={(props) => <ProductsView {...props} />} /> }
