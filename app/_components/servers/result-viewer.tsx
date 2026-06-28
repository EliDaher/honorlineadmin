import { TableShell, tableClass, tdClass, thClass } from '../ui'

function resultScalar(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function ResultViewer({ data }: { data: unknown }) {
  if (Array.isArray(data) && data.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
    const keys = Array.from(new Set(data.flatMap((item) => Object.keys(item as Record<string, unknown>)))).slice(0, 8)
    return (
      <TableShell>
        <table className={tableClass()}>
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key} className={thClass()}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const row = item as Record<string, unknown>
              return (
                <tr key={index}>
                  {keys.map((key) => (
                    <td key={key} className={tdClass('text-left')} dir="ltr">{resultScalar(row[key])}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableShell>
    )
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return (
      <TableShell>
        <table className={tableClass()}>
          <thead>
            <tr>
              <th className={thClass()}>المفتاح</th>
              <th className={thClass()}>القيمة</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
              <tr key={key}>
                <td className={tdClass('font-semibold text-slate-950')} dir="ltr">{key}</td>
                <td className={tdClass('text-left')} dir="ltr">{resultScalar(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    )
  }

  return (
    <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-left text-xs leading-6 text-slate-100" dir="ltr">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
