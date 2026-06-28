import type { Category } from '@/app/_lib/types'
import { inputClass } from '@/app/_components/ui'
import { categoryLabel } from '../constants/labels'

type CategorySelectProps = {
  categories: Category[]
  value: string
  onChange: (value: string) => void
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()}>
      <option value="">بدون تصنيف</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {categoryLabel(category, categories)}
        </option>
      ))}
    </select>
  )
}
