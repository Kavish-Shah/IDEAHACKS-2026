"use client"

import { useState, useEffect } from "react"
import { Settings, X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type NotificationSettings = {
  phoneNumber: string
  email: string
  enableSms: boolean
  enableEmail: boolean
}

const defaultSettings: NotificationSettings = {
  phoneNumber: "",
  email: "",
  enableSms: false,
  enableEmail: false,
}

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("drypod-notifications")
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        // Ignore parse errors
      }
    }
  }, [open])

  const handleSave = async () => {
    // Validate inputs
    if (settings.enableSms && !settings.phoneNumber.trim()) {
      toast.error("Phone number is required for SMS notifications")
      return
    }

    if (settings.enableEmail && !settings.email.trim()) {
      toast.error("Email is required for email notifications")
      return
    }

    if (
      settings.enableEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
    ) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSaving(true)
    try {
      localStorage.setItem("drypod-notifications", JSON.stringify(settings))
      toast.success("Settings saved successfully!")
      setOpen(false)
    } catch (error) {
      toast.error("Failed to save settings")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    // Validate inputs
    if (!settings.phoneNumber && !settings.email) {
      toast.error("Enter at least one contact method to test")
      return
    }

    if (
      settings.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
    ) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsTesting(true)
    try {
      const res = await fetch("/api/notify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: settings.phoneNumber || null,
          email: settings.email || null,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        toast.error("Test notifications failed: " + data.error)
        return
      }

      // Show results
      const results = data.results
      if (results.sms?.success) {
        toast.success("📱 Test SMS sent successfully!")
      }
      if (results.sms && !results.sms.success) {
        toast.error("SMS failed: " + results.sms.message)
      }

      if (results.email?.success) {
        toast.success("📧 Test email sent successfully!")
      }
      if (results.email && !results.email.success) {
        toast.error("Email failed: " + results.email.message)
      }
    } catch (error) {
      toast.error("Failed to test notifications")
      console.error(error)
    } finally {
      setIsTesting(false)
    }
  }

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
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* SMS Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableSms"
                checked={settings.enableSms}
                onChange={(e) =>
                  setSettings({ ...settings, enableSms: e.target.checked })
                }
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
              />
              <Label htmlFor="enableSms" className="text-white font-medium cursor-pointer">
                Text Message (SMS)
              </Label>
            </div>
            {settings.enableSms && (
              <div className="ml-7">
                <Label htmlFor="phone" className="text-sm text-zinc-400">
                  Phone Number (with country code, e.g., +1234567890)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={settings.phoneNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, phoneNumber: e.target.value })
                  }
                  className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            )}
          </div>

          {/* Email Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableEmail"
                checked={settings.enableEmail}
                onChange={(e) =>
                  setSettings({ ...settings, enableEmail: e.target.checked })
                }
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
              />
              <Label htmlFor="enableEmail" className="text-white font-medium cursor-pointer">
                Email
              </Label>
            </div>
            {settings.enableEmail && (
              <div className="ml-7">
                <Label htmlFor="email" className="text-sm text-zinc-400">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
            <p className="text-sm text-zinc-300">
              <span className="font-medium">💡 Tip:</span> Notifications will be sent when your
              cycle completes. Make sure to save your preferred contact information.
            </p>
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
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || (!settings.phoneNumber && !settings.email)}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            {isTesting ? "Testing..." : "🧪 Test"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
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
