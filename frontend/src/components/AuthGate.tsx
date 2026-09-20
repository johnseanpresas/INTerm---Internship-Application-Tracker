import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AUTH_API = "http://localhost:3000/api/auth"

type User = {
    id: number
    name: string
    email: string
}

export default function AuthGate({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [checking, setChecking] = useState(true)
    const [checkError, setCheckError] = useState("")
    const [mode, setMode] = useState<"login" | "register">("login")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        function handleSessionExpired() {
            setUser(null)
            setPassword("")
            setMode("login")
            setError("Your session ended. Please log in again.")
        }

        window.addEventListener(
            "interm:session-expired",
            handleSessionExpired
        )

        return () => {
            window.removeEventListener(
                "interm:session-expired",
                handleSessionExpired
            )
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()

        async function checkSession() {
            try {
                const response = await fetch(`${AUTH_API}/me`, {
                    credentials: "include",
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    setUser(null)
                    return
                }

                if (!response.ok) {
                    throw new Error("Could not check your session.")
                }

                const data: { user: User } = await response.json()

                if (!controller.signal.aborted) {
                    setUser(data.user)
                }
            } catch {
                if (!controller.signal.aborted) {
                    setCheckError(
                        "Could not connect. Check that the backend is running."
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setChecking(false)
                }
            }
        }

        void checkSession()
        return () => controller.abort()
    }, [])

    async function submitAccount() {
        if (busy) return

        setBusy(true)
        setError("")

        try {
            const response = await fetch(`${AUTH_API}/${mode}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to complete this request."
                )
            }

            setUser(data.user)
            setPassword("")
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not connect. Please try again."
            )
        } finally {
            setBusy(false)
        }
    }

    async function logout() {
        if (busy) return

        setBusy(true)
        setError("")

        try {
            const response = await fetch(`${AUTH_API}/logout`, {
                method: "POST",
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error("Could not log out. Please try again.")
            }

            setUser(null)
            setName("")
            setEmail("")
            setPassword("")
            setMode("login")
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not log out."
            )
        } finally {
            setBusy(false)
        }
    }

    if (checking) {
        return (
            <p role="status" className="p-8">
                Checking your session...
            </p>
        )
    }

    if (checkError) {
        return (
            <div className="p-8">
                <p role="alert" className="mb-4 text-destructive">
                    {checkError}
                </p>
                <Button onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    if (user) {
        return (
            <div key={user.id}>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
                    <p className="text-sm">
                        Signed in as <strong>{user.name}</strong>
                    </p>
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void logout()}
                    >
                        {busy ? "Logging out..." : "Log out"}
                    </Button>
                </header>

                {error && (
                    <p role="alert" className="px-6 py-3 text-destructive">
                        {error}
                    </p>
                )}

                {children}
            </div>
        )
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border p-6">
                <h1 className="text-2xl font-bold">INTerm</h1>
                <p className="mb-6 mt-2 text-muted-foreground">
                    {mode === "register"
                        ? "Create your tracker account."
                        : "Log in to your tracker."}
                </p>

                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        void submitAccount()
                    }}
                >
                    <fieldset disabled={busy} className="grid gap-4">
                        {mode === "register" && (
                            <div className="grid gap-2">
                                <Label htmlFor="account-name">Name</Label>
                                <Input
                                    id="account-name"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    maxLength={100}
                                    required
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="account-email">Email</Label>
                            <Input
                                id="account-email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                maxLength={254}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account-password">Password</Label>
                            <Input
                                id="account-password"
                                type="password"
                                autoComplete={
                                    mode === "register"
                                        ? "new-password"
                                        : "current-password"
                                }
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                minLength={mode === "register" ? 15 : 1}
                                maxLength={128}
                                required
                            />
                            {mode === "register" && (
                                <p className="text-sm text-muted-foreground">
                                    Use 15–128 characters. A long passphrase works well.
                                </p>
                            )}
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        <Button type="submit">
                            {busy
                                ? "Please wait..."
                                : mode === "register"
                                    ? "Create account"
                                    : "Log in"}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setMode(
                                    mode === "login" ? "register" : "login"
                                )
                                setPassword("")
                                setError("")
                            }}
                        >
                            {mode === "login"
                                ? "Need an account? Register"
                                : "Already registered? Log in"}
                        </Button>
                    </fieldset>
                </form>
            </div>
        </main>
    )
}