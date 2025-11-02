import { GalleryVerticalEnd } from "lucide-react"
import { SignupForm } from "@/components/register-form"
import Link from "next/link"
import Branding from '@/public/images/Branding.png'

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            LinkShorty
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      {/* --- Right Panel (Image/Branding) --- */}
      <div className="hidden lg:flex items-center justify-center bg-gray-100">
        <div className="h-full w-full rounded-lg bg-gray-200 overflow-hidden">
          <img
            src={Branding.src}
            alt="Branding Image"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>
    </div>
  )
}
