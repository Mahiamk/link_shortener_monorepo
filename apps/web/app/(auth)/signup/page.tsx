import Link from 'next/link'
import { SignupForm } from '@/components/register-form'
import { LinkSimple } from '@phosphor-icons/react/dist/ssr'
import Branding from '@/public/images/Branding.png'

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-[#f8fafc]">
      {/* Left Panel (Form) */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-xs">
              <LinkSimple weight="duotone" className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              LinkShorty
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
            <SignupForm />
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} LinkShorty. Free link management & analytics.
        </div>
      </div>

      {/* Right Panel (Branding) */}
      <div className="hidden lg:flex items-center justify-center bg-slate-100 p-8">
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={Branding.src}
            alt="LinkShorty Branding"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}
