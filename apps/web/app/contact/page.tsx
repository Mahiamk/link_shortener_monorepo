'use client'

import { useState } from 'react'
import {
  EnvelopeSimple,
  Phone,
  MapPin,
  PaperPlaneTilt,
  CircleNotch,
} from '@phosphor-icons/react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/header/page'

interface FormData {
  firstName: string
  lastName: string
  email: string
  message: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  })

  const [formStatus, setFormStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus('submitting')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/contact-submissions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Form submission failed')
      }

      setFormStatus('success')
      setTimeout(() => {
        setFormData({ firstName: '', lastName: '', email: '', message: '' })
        setFormStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Submission error:', error)
      setFormStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Header />
      <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We&apos;d love to hear from you. Please fill out the form below or use our contact details.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/40">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Direct Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Get in touch directly</h2>
              <p className="text-xs leading-relaxed text-slate-600">
                Our support and engineering teams are ready to help with any inquiries or feedback.
              </p>

              <div className="space-y-4 pt-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <MapPin weight="duotone" className="h-4 w-4" />
                  </div>
                  <span>Main Street, Kuala Lumpur, Malaysia</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <Phone weight="duotone" className="h-4 w-4" />
                  </div>
                  <a href="tel:+6013371337678" className="hover:text-indigo-600">
                    +60 (133) 7133-7678
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <EnvelopeSimple weight="duotone" className="h-4 w-4" />
                  </div>
                  <a href="mailto:shortylink@gmail.com" className="hover:text-indigo-600">
                    shortylink@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === 'submitting'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {formStatus === 'submitting' ? (
                  <>
                    <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                    <span>Sending message...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt weight="duotone" className="h-4 w-4" />
                    <span>{formStatus === 'success' ? 'Message Sent!' : 'Send message'}</span>
                  </>
                )}
              </button>

              {formStatus === 'success' && (
                <p className="text-center text-xs font-semibold text-emerald-600 mt-2">
                  Thank you! We&apos;ll be in touch soon.
                </p>
              )}
              {formStatus === 'error' && (
                <p className="text-center text-xs font-semibold text-rose-600 mt-2">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}