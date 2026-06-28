import CustomerDetailPageContent from '@/features/parties/components/CustomerDetailPageContent'

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerDetailPageContent customerId={id} />
}
