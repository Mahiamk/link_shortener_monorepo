"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login, loginOrRegisterWithGoogle } from "@/lib/api" 
import { cn } from "@/lib/utils" 
import { Button } from "./ui/button" 
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "./ui/field" 
import { Input } from "./ui/input" 

import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "@/lib/firebase";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      const result = await login(email, password);
      
      if (!result || !result.access_token) {
        setError("Invalid email or password");
        setIsLoading(false)
        return;
      }

      localStorage.setItem("token", result.access_token);
      localStorage.setItem("userEmail", email);

      router.push("/dashboard") 
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message); 
      } else {
        setError("An unexpected error occurred during login.");
      }
      console.error(err) 
    } finally {
       setIsLoading(false); 
    }
  }

  // Handler for Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(""); 
    
    const provider = new GoogleAuthProvider();
    
    try {
      // This opens the Google sign-in pop-up
      const result = await signInWithPopup(auth, provider);
      const firebaseToken = await result.user.getIdToken();
      const loginResult = await loginOrRegisterWithGoogle(firebaseToken);


      if (!loginResult || !loginResult.access_token) {
        setError("Failed to log in with Google.");
        setIsGoogleLoading(false);
        return;
      }

      localStorage.setItem("token", loginResult.access_token);
      localStorage.setItem("userEmail", result.user.email || "");

      
      router.push("/dashboard");

    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.code === 'auth/popup-closed-by-user') {
          setError("Sign-in cancelled.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred with Google sign-in.");
      }
      console.error(err);
      setIsGoogleLoading(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required
            value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" required
            value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
        </Field>
        <Field>
          <Button type="submit" disabled={isLoading || isGoogleLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Don’t have an account? <a href="/signup" className="underline">Sign up</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

