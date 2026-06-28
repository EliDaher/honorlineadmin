'use client'

import Image from 'next/image'
import { ShieldCheck, UserRound } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { login, TOKEN_STORAGE_KEY } from '../../_lib/api'
import type { User } from '../../_lib/types'
import { Alert, Button, Field, inputClass } from '../ui'

export function LoginScreen({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login(username, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, result.data.token)
      onLogin(result.data.token, result.data.user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4f8] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_440px]">
        <section className="flex min-h-[46vh] flex-col justify-between bg-[#0b1f33] px-6 py-6 text-white sm:px-10 lg:min-h-screen lg:px-14">
          <div className="flex items-center gap-3">
            <Image src="/branding/honorline-logo.png" alt="HonorLine" width={64} height={64} priority className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10" />
            <div>
              <p className="text-base font-semibold">HonorLine</p>
              <p className="text-sm text-slate-400">إدارة العمليات</p>
            </div>
          </div>
          <div className="max-w-2xl py-12">
            <p className="text-sm font-semibold text-cyan-200">المخزون والمبيعات والأمانات والكابلات</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              مساحة عمل واضحة لإدارة قرارات المخزون اليومية.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              تابع المنتجات، رولات الكابل بالمتر، الجهات المسؤولة، أرصدة الزبائن، وسجل الدفعات من لوحة واحدة منظمة.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {[
              ['رولات الكابل', 'قص بالمتر'],
              ['دفاتر الحساب', 'أرصدة بالدولار والليرة'],
              ['الأمانات', 'مسؤولية العاملين']
            ].map(([title, detail]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-10">
          <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-cyan-50 p-2 text-cyan-700 ring-1 ring-cyan-100">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-semibold text-slate-950">تسجيل دخول الإدارة</p>
                <p className="text-sm text-slate-500">استخدم بيانات دخول لوحة التحكم.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Field label="اسم المستخدم">
                <input value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass()} autoComplete="username" />
              </Field>
              <Field label="كلمة المرور" hint="بيانات التطوير: admin / admin1234">
                <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} className={inputClass()} autoComplete="current-password" />
              </Field>
            </div>
            {error ? <div className="mt-4"><Alert tone="danger">{error}</Alert></div> : null}
            <Button loading={loading} className="mt-6 w-full" icon={ShieldCheck}>
              دخول
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
