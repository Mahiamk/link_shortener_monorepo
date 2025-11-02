'use client'

import { useState } from 'react'
import { createLink, Link as LinkType } from '@/lib/api'
import {
  LinkIcon,
  Plus,
  Loader2,
  AlertTriangle,
  ClipboardIcon,
  Share2Icon,
  QrCodeIcon,
  CopyCheck,
  DownloadIcon
} from 'lucide-react'
import ArrowUturnLeftIcon from "@heroicons/react/24/solid/esm/ArrowUturnLeftIcon"

//  Props for the component
interface UrlShortenerProps {
  onLinkCreated: (newLink: LinkType) => void;
}

export function UrlShortener({ onLinkCreated }: UrlShortenerProps) {
  const [longUrl, setLongUrl] = useState('')
  const [tag, setTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdLink, setCreatedLink] = useState<LinkType | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const fullShortUrl = createdLink ? `${BASE_URL}/${createdLink.short_code}` : '';
  // QR Code URL - Higher quality and margin
  const qrCodeUrl = createdLink ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullShortUrl)}&qzone=1&margin=10` : '';


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl) {
      setError('Please enter a URL.')
      return
    }
    const token = localStorage.getItem('token')
    if (!token) {
      setError('You are not logged in. Please log in to create a link.')
      return
    }
    setIsLoading(true); setError(''); setShowQrCode(false); setIsCopied(false); setIsDownloading(false);
    try {
      const newLink = await createLink(longUrl, token, tag || undefined)
      setCreatedLink(newLink)
      onLinkCreated(newLink)
    } catch (err: unknown) {
      console.error('Error shortening URL:', err)
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.'
      setError(`Failed to shorten URL. ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (fullShortUrl) {
      navigator.clipboard.writeText(fullShortUrl).then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }).catch(err => {
        console.error("Copy failed:", err)
        alert("Failed to copy link.")
      });
    }
  }

  const handleShare = async () => {
     if (fullShortUrl && navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this short link!',
          text: `Link for: ${createdLink?.original_url || ''}`,
          url: fullShortUrl,
        })
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          alert('Could not share the link.')
        }
      }
    } else if (fullShortUrl) {
      handleCopy();
      alert('Link copied! Share feature not available on this browser.');
    }
  }

  const handleShortenAnother = () => {
    setCreatedLink(null); setLongUrl(''); setTag(''); setShowQrCode(false); setIsCopied(false); setError(''); setIsDownloading(false);
  }

  const handleDownloadQr = async () => {
    if (!qrCodeUrl || !createdLink) return;

    setIsDownloading(true);
    try {
      // Fetch the image data as a blob
      const response = await fetch(qrCodeUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch QR code image');
      }
      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `qr-code-${createdLink.short_code}.png`;
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
    <div className="rounded-xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200">
      {!createdLink ? (
        // --- FORM VIEW ---
        <form onSubmit={handleSubmit}>
           {/* Long URL Input */}
          <div className="mb-5">
            <label htmlFor="longUrl" className="mb-2 block text-sm font-medium text-gray-700">
              Enter your long URL
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="url" id="longUrl" placeholder="https://example.com/a-very-long-url-to-shorten"
                value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {/* Tag & Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="tag" className="mb-2 block text-sm font-medium text-gray-700">
                Tag (Optional)
              </label>
              <input
                type="text" id="tag" placeholder="e.g., 'Marketing Campaign'"
                value={tag} onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit" disabled={isLoading || !longUrl}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isLoading ? (<Loader2 className="h-5 w-5 animate-spin" />) : (<Plus className="h-5 w-5" />)}
              {isLoading ? 'Shortening...' : 'Shorten'}
            </button>
          </div>
        
          {error && (<p className="mt-2 text-sm text-red-600">{error}</p>)}
        </form>

      ) : (

        // --- RESULTS VIEW ---
        <div className="space-y-6">
          {/* Original URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500"> Original URL </label>
            <p className="w-full truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {createdLink.original_url}
            </p>
          </div>
          {/* Short URL & Copy */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500"> Your Short Link </label>
            <div className="flex gap-2">
              <input type="text" value={fullShortUrl} readOnly className="flex-1 rounded-lg border border-gray-300 bg-gray-50 py-3 px-4 text-sm text-indigo-700 focus:outline-none" />
              <button onClick={handleCopy} >
                {isCopied ? <CopyCheck className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5 cursor-pointer" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Action Buttons: QR, Share, Shorten Another */}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
             <button onClick={() => setShowQrCode(!showQrCode)} className='cursor-pointer' >
                <QrCodeIcon className="h-5 w-5" /> QR Code
              </button>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                 <button onClick={handleShare} className='cursor-pointer' >
                    <Share2Icon className="h-5 w-5" /> Share
                  </button>
              )}
             <div className="flex-grow"></div> 
             <button onClick={handleShortenAnother} className='cursor-pointer' >
                <ArrowUturnLeftIcon className="h-5 w-5"/> Shorten Another
              </button>
          </div>

          {/* QR Code Display & Download Button */}
          {showQrCode && (
            <div className="mt-4 flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
               
              <img
                src={qrCodeUrl}
                alt={`QR Code for ${fullShortUrl}`}
                width={150}
                height={150}
                className="h-36 w-36"
              />
              <p className="text-xs text-gray-500">Scan this code to visit the link</p>
              <button
                onClick={handleDownloadQr}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 rounded-md bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}

        </div>
      )}
    </div>
  )
}