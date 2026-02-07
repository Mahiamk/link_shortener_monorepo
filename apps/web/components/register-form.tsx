"use client"

import { useState } from "react"
import { register } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await register(email, password);

      setSuccess("Registration successful! Please check your email (check spam folder) to verify your account.");

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes("Email already registered")) {
          setError("This email is already registered. Please use a different one.");
        } else {
          setError("Failed to register. Please try again.");
        }
      } else {
         setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email and password to register
          </p>
          {error && <p className="text-gray-500 text-sm mt-1">{error}</p>}
          {success && <p className="text-gray-600 text-sm mt-1">{success}</p>}
        </div>
        
        {/* If registration is successful, hide the form */}
        {success ? (
          <div className="text-center">
             <a href="/login" className="underline">Go to Login</a>
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required
                value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" name="password" type="password" required
                value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
            </Field>
            <Field>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Already have an account? <a href="/login" className="underline">Login</a>
            </FieldDescription>
          </>
        )}
      </FieldGroup>
    </form>
  )
}