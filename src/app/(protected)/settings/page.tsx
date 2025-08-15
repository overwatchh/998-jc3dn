"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { authClient } from "@/lib/auth/auth-client"
import {
  ChevronDown,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Navigation,
  Palette,
  Shield,
  Wifi,
} from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function SettingsScreen() {
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()

  const { data: session } = authClient.useSession()

  const [privacyExpanded, setPrivacyExpanded] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) {
    return null // or a loading state
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar key={session?.user.image} className="h-16 w-16">
              {session?.user.image ? (
                <Image src={session.user.image} alt={session.user.name} fill />
              ) : (
                <AvatarFallback className="text-lg">
                  {session?.user.name.charAt(0) ?? "A"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {session?.user.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session?.user.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Computer Science Major
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={privacyExpanded} onOpenChange={setPrivacyExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-sm font-medium">
                  Location & Privacy Policy
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform ${privacyExpanded ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <div className="flex items-center mb-2">
                    <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                    <p className="font-medium text-blue-900">
                      High-Accuracy Location Verification
                    </p>
                  </div>
                  <p>
                    We use GPS, Wi-Fi, and cellular triangulation to achieve
                    98%+ accuracy in verifying your physical presence within
                    classroom boundaries. This ensures attendance integrity
                    while protecting your privacy.
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <KeyRound className="h-4 w-4 mr-2 text-blue-600" />
                    <p className="font-medium text-blue-900">
                      Two-Step Verification Process
                    </p>
                  </div>
                  <p>
                    Our enhanced security system requires both QR code scanning
                    and confirmation code entry to prevent fraudulent attendance
                    marking and ensure continuous class presence.
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <Wifi className="h-4 w-4 mr-2 text-blue-600" />
                    <p className="font-medium text-blue-900">
                      State Persistence & Privacy
                    </p>
                  </div>
                  <p>
                    Your scanning progress is temporarily stored on your device
                    to allow seamless navigation. This data is automatically
                    cleared after successful attendance confirmation or app
                    restart.
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    <p className="font-medium text-blue-900">Data Protection</p>
                  </div>
                  <p>
                    All location data is encrypted end-to-end and never shared
                    with third parties. We comply with FERPA and GDPR privacy
                    regulations to protect your personal information.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Security Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <KeyRound className="h-4 w-4 mr-2 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Two-Step Auth
                  </p>
                  <p className="text-xs text-green-700">Active</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Navigation className="h-4 w-4 mr-2 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    High-Accuracy GPS
                  </p>
                  <p className="text-xs text-green-700">Enabled</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            App Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Switch to dark theme
              </p>
            </div>
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={checked => setTheme(checked ? "dark" : "light")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-primary/60">App display language</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            onClick={() => authClient.signOut().then(() => router.push("/"))}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
