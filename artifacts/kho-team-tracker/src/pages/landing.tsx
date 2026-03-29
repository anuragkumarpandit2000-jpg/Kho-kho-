import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const BASE = import.meta.env.BASE_URL;

async function apiPost(path: string, body: object) {
  const res = await fetch(`${BASE}api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

function PasswordInput({ id, placeholder, ...props }: React.ComponentProps<"input"> & { id: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} placeholder={placeholder} className="pr-10" {...props} />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function LandingPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [, navigate] = useLocation();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  async function handleLogin(data: LoginForm) {
    setLoginError("");
    try {
      await apiPost("auth/login", data);
      window.location.href = `${BASE}app`;
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    }
  }

  async function handleSignup(data: SignupForm) {
    setSignupError("");
    try {
      await apiPost("auth/signup", { name: data.name, email: data.email, password: data.password });
      window.location.href = `${BASE}app`;
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="flex items-center justify-between p-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl text-primary-foreground shadow-lg shadow-primary/25">
            <Activity className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">KHO-KHO</span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">Team Tracker</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-extrabold tracking-tight">
                {tab === "login" ? "Welcome back!" : "Join the squad"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {tab === "login"
                  ? "Sign in to track your performance"
                  : "Create your account and start training"}
              </p>
            </div>

            <div className="flex rounded-xl bg-muted p-1 mb-6">
              {(["login", "signup"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "login" ? (
                <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <Card className="border-border/50 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Sign In</CardTitle>
                      <CardDescription>Enter your email and password</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        {loginError && (
                          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {loginError}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label htmlFor="login-email">Email</Label>
                          <Input id="login-email" type="email" placeholder="you@example.com" {...loginForm.register("email")} />
                          {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="login-password">Password</Label>
                          <PasswordInput id="login-password" placeholder="Your password" {...loginForm.register("password")} />
                          {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                        </div>
                        <Button type="submit" className="w-full font-bold" disabled={loginForm.formState.isSubmitting}>
                          {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground pt-2">
                          Don't have an account?{" "}
                          <button type="button" onClick={() => setTab("signup")} className="text-primary font-semibold hover:underline">
                            Sign Up
                          </button>
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <Card className="border-border/50 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Create Account</CardTitle>
                      <CardDescription>Fill in your details to get started</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                        {signupError && (
                          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {signupError}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input id="signup-name" placeholder="Arjun Kumar" {...signupForm.register("name")} />
                          {signupForm.formState.errors.name && <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input id="signup-email" type="email" placeholder="you@example.com" {...signupForm.register("email")} />
                          {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-password">Password</Label>
                          <PasswordInput id="signup-password" placeholder="Min 6 characters" {...signupForm.register("password")} />
                          {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-confirm">Confirm Password</Label>
                          <PasswordInput id="signup-confirm" placeholder="Repeat password" {...signupForm.register("confirmPassword")} />
                          {signupForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" className="w-full font-bold" disabled={signupForm.formState.isSubmitting}>
                          {signupForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground pt-2">
                          Already have an account?{" "}
                          <button type="button" onClick={() => setTab("login")} className="text-primary font-semibold hover:underline">
                            Sign In
                          </button>
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
