'use client'

import {
  BarChart,
  Code,
  Globe,
  Lock,
  QrCode,
  Search,
  Tag,
  Clock,
} from 'lucide-react'

const features = [
  {
    name: 'Real-Time Click Analytics',
    description:
      'Go beyond simple click counts. Our real-time analytics dashboard provides immediate, actionable data on traffic volume, trend lines over specific periods, and performance metrics for every link you generate. This allows for instant campaign optimization.',
    icon: BarChart,
  },
  {
    name: 'Device & Browser Breakdown',
    description:
      "Pinpoint your audience's technical environment. View precise reports detailing the percentage of traffic originating from mobile, tablet, and desktop devices, along with the most popular browsers used, helping you ensure optimal user experience across all platforms.",
    icon: Search,
  },
  {
    name: 'Geographic and Source Data',
    description:
      'Gain critical market insights by tracing the exact origin of your clicks. See a clear geographical breakdown by country and track which external domains (referrers like Google, Twitter, or partner sites) are driving your most valuable traffic.',
    icon: Globe,
  },
  {
    name: 'Expiration and Deletion Control',
    description:
      'Maintain security and clarity. You have full management control to instantly delete any unnecessary links or set predefined expiration dates for links containing time-sensitive content, ensuring they automatically deactivate when required.',
    icon: Clock,
  },
  {
    name: 'Custom Tags & Organization',
    description:
      'Streamline your dashboard management by applying custom tags to your links. Organize links by campaign, client, or project type, enabling powerful filtering and easy data retrieval for simplified reporting.',
    icon: Tag,
  },
  {
    name: 'Quick QR Code Generation',
    description:
      'Enhance physical marketing efforts. For every short URL created, a high-resolution, scannable QR code is instantly available for download, making it easy to bridge your offline materials with online tracking and engagement.',
    icon: QrCode,
  },
]

export function Features() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-gray-600">
            Everything You Need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Analytics and Control, Built In
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We offer more than just a short URL. Get the data-driven insights and management tools required to optimize your digital campaigns.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
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