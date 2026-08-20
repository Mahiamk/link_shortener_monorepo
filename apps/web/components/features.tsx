'use client'

import {
  ChartBar,
  DeviceMobile,
  GlobeHemisphereWest,
  Clock,
  Tag,
  QrCode,
} from '@phosphor-icons/react'

const features = [
  {
    name: 'Real-Time Click Analytics',
    description:
      'Go beyond simple click counts. Our real-time analytics dashboard provides immediate, actionable data on traffic volume, trend lines over specific periods, and performance metrics for every link you generate.',
    icon: ChartBar,
  },
  {
    name: 'Device & Browser Breakdown',
    description:
      "Pinpoint your audience's technical environment. View precise reports detailing the percentage of traffic originating from mobile, tablet, and desktop devices, along with the most popular browsers used.",
    icon: DeviceMobile,
  },
  {
    name: 'Geographic and Source Data',
    description:
      'Gain critical market insights by tracing the exact origin of your clicks. See a clear geographical breakdown by country and track which external domains are driving your most valuable traffic.',
    icon: GlobeHemisphereWest,
  },
  {
    name: 'Expiration and Deletion Control',
    description:
      'Maintain security and clarity. You have full management control to instantly delete any unnecessary links or set predefined expiration dates for links containing time-sensitive content.',
    icon: Clock,
  },
  {
    name: 'Custom Tags & Organization',
    description:
      'Streamline your dashboard management by applying custom tags to your links. Organize links by campaign, client, or project type, enabling powerful filtering and easy data retrieval.',
    icon: Tag,
  },
  {
    name: 'Quick QR Code Generation',
    description:
      'Enhance physical marketing efforts. For every short URL created, a high-resolution, scannable QR code is instantly available with customizable colors and styling for print and digital assets.',
    icon: QrCode,
  },
]

export function Features() {
  return (
    <div className="bg-white py-24 sm:py-32 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Everything You Need
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Analytics and Control, Built In
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We offer more than just a short URL. Get the data-driven insights and management tools required to optimize your digital campaigns.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <feature.icon weight="duotone" className="h-6 w-6" aria-hidden="true" />
                </div>
                <dt className="text-lg font-semibold leading-7 text-slate-900">
                  {feature.name}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}