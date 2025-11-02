// In: app/contact/page.tsx

'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/header/page'


// Interface for our form's state
interface FormData {
  firstName: string
  lastName: string
  email: string
  message: string
}

// A reusable input component (no changes here)
const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  required?: boolean
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-900"
    >
      {label}
    </label>
    <div className="mt-1">
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={4}
          value={value}
          onChange={onChange}
          required={required}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
          placeholder={`Your ${label.toLowerCase()}`}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
          placeholder={
            name === 'email' ? 'you@example.com' : `Your ${label.toLowerCase()}`
          }
        />
      )}
    </div>
  </div>
)

// The main Contact Page component
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    // ... (no changes here)
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // --- 
  // --- THIS FUNCTION IS NOW UPDATED ---
  // ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus('submitting')

    try {
      // Send the data to your FastAPI backend
      const response = await fetch('http://localhost:8000/api/contact-submissions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send the form state
      })

      if (!response.ok) {
        // Handle server errors
        throw new Error('Form submission failed')
      }

      // Show success message
      setFormStatus('success')
      
      // Reset form after a 3-second delay
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
    <div className="bg-white mt-25">
      <Header />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Page Header (no changes) */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            We'd love to hear from you. Please fill out the form below or use
            our contact details to get in touch.
          </p>
        </div>

        {/* Main Content: Grid for Info + Form */}
        <div className="mx-auto mt-16 max-w-lg lg:mt-20 lg:max-w-none">
          <div className="mb-18 grid grid-cols-1 gap-x-16 gap-y-20 lg:grid-cols-2">
            
            {/* Left Column: Contact Details (Updated with your info) */}
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Get in touch directly
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Our team is here to help. You can reach us by email, phone, or
                at our office during business hours.
              </p>
              <dl className="mt-10 space-y-6 text-base leading-7 text-gray-600">
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <span className="sr-only">Address</span>
                    <MapPin
                      className="h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                  </dt>
                  <dd>
                     Main Street
                    <br />
                    Kuala Lumpur, Malaysia
                  </dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <span className="sr-only">Telephone</span>
                    <Phone
                      className="h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                  </dt>
                  <dd>
                    <a
                      className="hover:text-gray-900"
                      href="tel:+6013371337678"
                    >
                      +60 (133) 7133-7678
                    </a>
                  </dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <span className="sr-only">Email</span>
                    <Mail
                      className="h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                  </dt>
                  <dd>
                    <a
                      className="hover:text-gray-900"
                      href="mailto:shortylink@gmail.com"
                    >
                      shortylink@gmail.com
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right Column: Contact Form (no changes to structure) */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-gray-50 p-8 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <FormInput
                  label="First name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Last name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                <div className="sm:col-span-2">
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <FormInput
                    label="Message"
                    name="message"
                    type="textarea"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="mt-10">
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="block w-full rounded-md bg-gray-900 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50"
                >
                  {formStatus === 'submitting' && 'Sending...'}
                  {formStatus === 'success' && 'Message Sent!'}
                  {formStatus === 'idle' && 'Send message'}
                  {formStatus === 'error' && 'Error. Try again.'}
                </button>
              </div>
              {formStatus === 'success' && (
                <p className="mt-4 text-center text-sm text-gray-600">
                  Thanks for reaching out! We'll get back to you soon.
                </p>
              )}
               {formStatus === 'error' && (
                <p className="mt-4 text-center text-sm text-red-600">
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