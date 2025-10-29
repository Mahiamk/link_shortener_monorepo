import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"
// ✅ FIXED: Changed alias path to relative path
import { LoginForm } from "../../../components/login-form" // Make sure this path is correct

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* --- Left Panel (Form) --- */}
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
            <LoginForm />
          </div>
        </div>
      </div>
      
      {/* --- Right Panel (Image/Branding) --- */}
      <div className="hidden lg:block bg-gray-100 p-10">
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-200">
           <p className="text-gray-500">Branding / Image Area</p>
        </div>
      </div>
      {/* --- Closing div was missing --- */}
      
    </div>
  )
}

