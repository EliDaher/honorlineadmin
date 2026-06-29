import ServerDetailPageContent from '@/features/servers/components/ServerDetailPageContent'

export default async function ServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ServerDetailPageContent serverId={id} />
}
