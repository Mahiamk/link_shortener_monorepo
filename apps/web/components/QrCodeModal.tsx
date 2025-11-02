'use client'

import { Fragment, useState } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { QrCodeIcon, DownloadIcon, Loader2 } from 'lucide-react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import type { Link as LinkType } from '@/lib/api' 

interface QrCodeModalProps {
  link: LinkType | null
  open: boolean
  onClose: () => void
}

export function QrCodeModal({ link, open, onClose }: QrCodeModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
  const fullShortUrl = link ? `${BASE_URL}/${link.short_code}` : '';
  const qrCodeUrl = link ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullShortUrl)}&qzone=1&margin=10` : '';

  const handleDownloadQr = async () => {
    if (!qrCodeUrl || !link) return;

    setIsDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code image');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `qr-code-${link.short_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-40" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        {/* Modal Panel */}
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            {/* Smaller modal width */}
            <DialogPanel className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-5 py-3.5">
                 <div className="flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    QR Code
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="-m-1 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {link ? (
                   <div className="flex flex-col items-center space-y-4">
                    
                     <img
                       src={qrCodeUrl}
                       alt={`QR Code for ${fullShortUrl}`}
                       width={200} 
                       height={200}
                       className="h-48 w-48 border border-gray-200 p-1 bg-white"
                     />
                     <p className="text-center text-sm text-gray-600 break-all">
                       {fullShortUrl}
                     </p>
                     <button
                       onClick={handleDownloadQr}
                       disabled={isDownloading}
                       className="w-full flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                       title="Download QR Code as PNG"
                     >
                       {isDownloading ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <DownloadIcon className="h-4 w-4" />
                       )}
                       {isDownloading ? 'Downloading...' : 'Download QR'}
                     </button>
                   </div>
                ) : (
                  <p className="text-center text-gray-500">No link data available.</p>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}