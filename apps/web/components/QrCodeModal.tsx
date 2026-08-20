'use client'

import { Fragment, useState } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { QrCode, DownloadSimple, CircleNotch, X } from '@phosphor-icons/react'
import type { Link as LinkType } from '@/lib/api'

interface QrCodeModalProps {
  link: LinkType | null
  open: boolean
  onClose: () => void
}

export function QrCodeModal({ link, open, onClose }: QrCodeModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  const fullShortUrl = link ? `${BASE_URL}/${link.short_code}` : ''
  const qrCodeUrl = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        fullShortUrl
      )}&qzone=1&margin=10&color=0f172a`
    : ''

  const handleDownloadQr = async () => {
    if (!qrCodeUrl || !link) return
    setIsDownloading(true)
    try {
      const response = await fetch(qrCodeUrl)
      if (!response.ok) throw new Error('Failed to fetch QR code image')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `qr-code-${link.short_code}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <QrCode weight="duotone" className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">QR Code</h3>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X weight="bold" className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {link ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt={`QR Code for ${fullShortUrl}`}
                        className="h-44 w-44 object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-indigo-600">/{link.short_code}</p>
                      <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-400">
                        {link.long_url}
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadQr}
                      disabled={isDownloading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isDownloading ? (
                        <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                      ) : (
                        <DownloadSimple weight="bold" className="h-4 w-4" />
                      )}
                      <span>{isDownloading ? 'Downloading...' : 'Download QR Image'}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-500 py-6">No link data available.</p>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}