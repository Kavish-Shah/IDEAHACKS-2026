"use client"

import { useState, useEffect } from "react"
import { Settings, X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type NotificationSettings = {
  email: string
}

const defaultSettings: NotificationSettings = {
  email: "",
}

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [testingType, setTestingType] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("drypod-notifications")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ email: parsed.email ?? "" })
      } catch {
        // Ignore parse errors
      }
    }
  }, [open])

  const handleSave = () => {
    if (!settings.email.trim()) {
      toast.error("Email is required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSaving(true)
    try {
      localStorage.setItem("drypod-notifications", JSON.stringify(settings))
      toast.success("Settings saved!")
      setOpen(false)
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async (type: string) => {
    if (!settings.email.trim()) {
      toast.error("Enter an email first")
      return
    }

    setTestingType(type)
    try {
      const res = await fetch("/api/notify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: settings.email, type }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Test email sent!")
      } else {
        toast.error("Email failed: " + data.error)
      }
    } catch {
      toast.error("Failed to send test notification")
    } finally {
      setTestingType(null)
    }
  }

  const emailValid = settings.email.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors" title="Settings">
          <Settings className="w-5 h-5 text-zinc-400 hover:text-zinc-300" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter your email to receive dryer notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-zinc-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={settings.email}
              onChange={(e) => setSettings({ email: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-zinc-300">Test Notifications</Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleTest("clothes")}
                disabled={!emailValid || testingType !== null}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-amber-400">Take Your Clothes Out</span>
                <span className="text-zinc-500 text-xs">
                  {testingType === "clothes" ? "Sending..." : "Test"}
                </span>
              </button>
              <button
                onClick={() => handleTest("finished")}
                disabled={!emailValid || testingType !== null}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-emerald-400">Your Cycle is Finished</span>
                <span className="text-zinc-500 text-xs">
                  {testingType === "finished" ? "Sending..." : "Test"}
                </span>
              </button>
              <button
                onClick={() => handleTest("tamper")}
                disabled={!emailValid || testingType !== null}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-red-400">Tampering Alert</span>
                <span className="text-zinc-500 text-xs">
                  {testingType === "tamper" ? "Sending..." : "Test"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !emailValid}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
