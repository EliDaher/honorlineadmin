'use client'

import { useState, type FormEvent } from 'react'
import { FolderTree, Save } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { Category } from '@/app/_lib/types'
import { Button, Field, Modal, Panel, RowActions, inputClass } from '@/app/_components/ui'
import { CategorySelect } from '@/features/shared/components/CategorySelect'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import { categoryLabel } from '@/features/shared/constants/labels'
import { createCategory, deleteCategory, updateCategory, type CreateCategoryInput } from '../services/categoriesApi'

const initialForm: CreateCategoryInput = { name: '', parentId: '', description: '' }

export function CategoriesView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')

  function openCreate() {
    setForm(initialForm)
    setEditingId('')
    setOpen(true)
  }

  function openEdit(category: Category) {
    setForm({ name: category.name, parentId: category.parentId, description: category.description })
    setEditingId(category.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingId ? `category-${editingId}` : 'category', async () => {
      if (editingId) await updateCategory(token, editingId, form)
      else await createCategory(token, form)
      setForm(initialForm)
      setEditingId('')
      setOpen(false)
    })
  }

  async function remove(category: Category) {
    if (!window.confirm(`حذف التصنيف "${category.name}"؟`)) return
    await mutate(`delete-category-${category.id}`, () => deleteCategory(token, category.id))
  }

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'تعديل تصنيف' : 'إنشاء تصنيف'} description="نظّم المنتجات ورولات الكابل حسب مجال العمل.">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="الاسم"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} /></Field>
          <Field label="التصنيف الأب"><CategorySelect categories={data.categories.filter((category) => category.id !== editingId)} value={form.parentId} onChange={(parentId) => setForm({ ...form, parentId })} /></Field>
          <Field label="الوصف"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingId ? `category-${editingId}` : 'category')} icon={Save}>{editingId ? 'حفظ التعديل' : 'إنشاء تصنيف'}</Button>
        </form>
      </Modal>

      <Panel title="شجرة التصنيفات" description="عدد المنتجات والرولات ضمن كل تصنيف." actions={<Button type="button" icon={FolderTree} onClick={openCreate}>إنشاء تصنيف</Button>}>
        <SimpleRows
          icon={FolderTree}
          rows={data.categories.map((category) => [categoryLabel(category, data.categories), `${category.productCount ?? 0} منتج`, `${category.cableRollCount ?? 0} رول`])}
          actions={data.categories.map((category) => (
            <RowActions key={category.id} onEdit={() => openEdit(category)} onDelete={() => remove(category)} editLoading={saving === `category-${category.id}`} deleteLoading={saving === `delete-category-${category.id}`} />
          ))}
          empty="لا توجد تصنيفات بعد."
        />
      </Panel>
    </section>
  )
}
