import { InventoryApp } from '../../_components/inventory-app'

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InventoryApp view="customers" customerId={id} />
}
