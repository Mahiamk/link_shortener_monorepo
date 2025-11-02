'use client'

import { DatabaseZap, Zap, Lock, Users, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header/page'
import { Footer } from '@/components/Footer'
import app from '@/public/images/app.png' 


const values = [
  {
    name: 'Simplicity & Speed',
    description:
      'We believe powerful tools should be fast and easy to use. Our interface is designed to be minimal, intuitive, and incredibly quick, getting you from a long URL to a short link in seconds.',
    icon: Zap,
  },
  {
    name: 'Data-Driven Insights',
    description:
      'A short link is just the beginning. We empower you with the analytics to understand your audience—who they are, where they come from, and what they click—all in a clear, simple dashboard.',
    icon: DatabaseZap,
  },
  {
    name: 'Privacy & Security',
    description:
      'Trust is paramount. We are committed to protecting your data and the privacy of your visitors. We provide secure links and give you full control over your data and link activity.',
    icon: Lock,
  },
  {
    name: 'Open & Accessible',
    description:
      'Our goal is to provide a world-class tool that is accessible to everyone. We started with a powerful free tier and are committed to building a platform that scales with you, from a personal project to a global enterprise.',
    icon: Users,
  },
]

export default function AboutPage() {

  return (
    <div className="bg-white">
      <Header />
      <main className="isolate pt-10">
        {/* Hero Section */}
        <div className="relative isolate -z-10">
          {/* Background Gradient */}
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Mission</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                In a digital world cluttered with long, complex, and untrackable links, our mission is to provide a simple, powerful, and insightful tool for everyone. We believe that shortening a URL should be more than just a convenience it should be an opportunity to gain valuable data and build better connections with your audience.
              </p>
            </div>
          </div>
        </div>

        {/* Content Section (Our Story) */}
        <div className="mx-auto -mt-12 max-w-7xl px-6 sm:mt-0 lg:px-8 pb-24 sm:pb-32">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">From Idea to Impact</h2>
            <div className="mt-6 flex flex-col gap-x-8 gap-y-20 lg:flex-row">
              <div className="lg:w-full lg:max-w-2xl lg:flex-auto">
                <p className="text-lg leading-8 text-gray-600">
                  LinkShorty started as a simple idea: "Why is it still so hard to share links that are not only short, but also meaningful?" We were tired of clunky, generic shorteners that offered no data and no control. We wanted a tool that was fast, reliable, and packed with the analytics that marketers, creators, and businesses need to make smart decisions.
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  What began as a personal project quickly grew into a robust platform focused on a single goal: turning every shared link into an asset. We're dedicated to building a service that is both powerful for professionals and accessible for everyone.
                </p>
              </div>
              <div className="lg:flex lg:flex-auto lg:justify-center">
                <div className="w-140 h-90 flex-none rounded-2xl object-cover">
                  <div className="flex items-center justify-left h-100 w-140 rounded-lg bg-gray-200">
                    <Image src={app} alt="App Preview" className="object-cover rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Our Values</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                The Principles That Guide Us
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {values.map((value) => (
                  <div key={value.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                      <value.icon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {value.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{value.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-10 lg:px-8">
            <div className="relative isolate overflow-hidden bg-gray-600 px-6 py-20 text-center shadow-2xl sm:rounded-3xl sm:px-16">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to shorten your first link?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
                Get started for free today. No credit card required, just simple, powerful link management.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Get Started Free
                </Link>
              </div>
              {/* Background Glow */}
              <svg
                viewBox="0 0 124 1024"
                className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
                aria-hidden="true"
              >
                <circle cx={512} cy={512} r={512} fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fillOpacity="0.7" />
                <defs>
                  <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
                    <stop stopColor="#7775D6" />
                    <stop offset={1} stopColor="#E935C1" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  )
}