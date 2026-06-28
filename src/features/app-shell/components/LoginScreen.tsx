'use client'

import Image from 'next/image'
import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { login, TOKEN_STORAGE_KEY } from '@/app/_lib/api'
import type { User } from '@/app/_lib/types'
import { Alert, Button, Field, inputClass } from '@/app/_components/ui'

type LoginScreenProps = {
  onLogin: (token: string, user: User) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
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
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_440px]">
        <section className="flex min-h-[46vh] flex-col justify-between bg-slate-950 px-6 py-6 text-white sm:px-10 lg:min-h-screen lg:px-14">
          <div className="flex items-center gap-3">
            <Image src="/branding/honorline-logo.png" alt="HonorLine" width={64} height={64} priority className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10" />
            <div><p className="text-base font-semibold">HonorLine</p><p className="text-sm text-slate-400">إدارة العمليات</p></div>
          </div>
          <div className="max-w-2xl py-12">
            <p className="text-sm font-semibold text-blue-300">المخزون والمبيعات والأمانات والكابلات</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">مساحة عمل واضحة لإدارة قرارات المخزون اليومية.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">تابع المنتجات ورولات الكابل والجهات والأرصدة والدفعات من لوحة واحدة منظمة.</p>
          </div>
        </section>
        <section className="flex items-center bg-white px-6 py-10 sm:px-10">
          <form className="w-full space-y-5" onSubmit={submit}>
            <div><h2 className="text-2xl font-semibold text-slate-950">تسجيل الدخول</h2><p className="mt-1 text-sm text-slate-500">أدخل بيانات الحساب للمتابعة.</p></div>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Field label="اسم المستخدم"><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass()} /></Field>
            <Field label="كلمة المرور"><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass()} /></Field>
            <Button className="w-full" loading={loading} icon={Loader2}>دخول</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
