"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Calendar, Download, FileText, RefreshCw, Share2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function QrCodeGeneration() {
  const [qrType, setQrType] = useState("check-in")
  const [validityDuration, setValidityDuration] = useState(15)
  const [attendanceType, setAttendanceType] = useState("mandatory")
  const [geoValidation, setGeoValidation] = useState(false)
  const [geoRadius, setGeoRadius] = useState(100)
  const [autoExpireOptions, setAutoExpireOptions] = useState({
    afterClass: true,
    afterLimit: false,
    afterDate: false,
  })

  // Calculate remaining time for the validity timer
  const [remainingTime, setRemainingTime] = useState(validityDuration * 60) // Start with full duration
  const [isExpired, setIsExpired] = useState(false)

  // Real countdown timer effect
  useEffect(() => {
    if (remainingTime <= 0) {
      setIsExpired(true)
      return
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime])

  // Reset timer when validity duration changes
  useEffect(() => {
    setRemainingTime(validityDuration * 60)
    setIsExpired(false)
  }, [validityDuration])

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (isExpired) return "text-red-500"
    const percentage = (remainingTime / (validityDuration * 60)) * 100
    if (percentage > 50) return "text-green-500"
    if (percentage > 20) return "text-amber-500"
    return "text-red-500"
  }

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  // Mock data for recently checked-in students
  const recentCheckins = [
    {
      id: 1,
      name: "Justin",
      timestamp: "10:02 AM",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 2,
      name: "Deepak",
      timestamp: "10:03 AM",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 3,
      name: "Thu",
      timestamp: "10:05 AM",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 4,
      name: "Tuan",
      timestamp: "10:06 AM",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 5,
      name: "Changu",
      timestamp: "10:08 AM",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                QR Code Generation
              </h1>
            </div>

            {/* QR Code Type Selector */}
            <Tabs value={qrType} onValueChange={setQrType} className="mt-6">
              {/* <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="check-in">Check-in QR</TabsTrigger>
                <TabsTrigger value="throughout">Throughout QR</TabsTrigger>
              </TabsList> */}
              <div className="mt-2 text-sm text-muted-foreground">
                {qrType === "check-in" ? (
                  <p>
                    Generate a QR code for initial attendance at the beginning
                    of class.
                  </p>
                ) : (
                  <p>
                    Generate QR codes for ongoing attendance checks throughout
                    the class session.
                  </p>
                )}
              </div>
            </Tabs>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* QR Code Display Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5 pb-0 border-b">
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      Introduction to Computer Science - CSIT883
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Monday, April 24, 2025 - 10:00 AM</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 pt-6">
                  <div className="relative mb-4 rounded-lg border bg-white p-2 shadow-sm">
                    <Image
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Rickrolling_QR_code.png"
                      width={256}
                      height={256}
                      alt="QR Code"
                      className={`h-64 w-64 ${isExpired ? "opacity-30 grayscale" : ""}`}
                    />
                    {isExpired && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">
                          EXPIRED
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-lg font-semibold ${getTimerColor()}`}
                  >
                    <span>
                      {isExpired
                        ? "QR Code Expired"
                        : `Valid for: ${formatTime(remainingTime)} remaining`}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-center gap-2 p-6 pt-0">
                  <Button
                    className="gap-1"
                    onClick={() => {
                      setRemainingTime(validityDuration * 60)
                      setIsExpired(false)
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isExpired ? "Generate New QR" : "Regenerate QR"}
                  </Button>
                  <Button variant="outline" className="gap-1">
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                  <Button variant="outline" className="gap-1">
                    <Share2 className="h-4 w-4" />
                    Share QR
                  </Button>
                </CardFooter>
              </Card>

              {/* Settings Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Validity Duration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="validity-duration">
                          Validity Duration
                        </Label>
                        <span className="text-sm font-medium">
                          {validityDuration} minutes
                        </span>
                      </div>
                      <Slider
                        id="validity-duration"
                        min={5}
                        max={120}
                        step={5}
                        value={[validityDuration]}
                        onValueChange={(value: number[]) =>
                          setValidityDuration(value[0])
                        }
                        className="py-2"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValidityDuration(5)}
                          className={
                            validityDuration === 5 ? "bg-primary/10" : ""
                          }
                        >
                          5 min
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValidityDuration(15)}
                          className={
                            validityDuration === 15 ? "bg-primary/10" : ""
                          }
                        >
                          15 min
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValidityDuration(30)}
                          className={
                            validityDuration === 30 ? "bg-primary/10" : ""
                          }
                        >
                          30 min
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValidityDuration(60)}
                          className={
                            validityDuration === 60 ? "bg-primary/10" : ""
                          }
                        >
                          1 hour
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValidityDuration(120)}
                          className={
                            validityDuration === 120 ? "bg-primary/10" : ""
                          }
                        >
                          2 hours
                        </Button>
                      </div>
                    </div>

                    {/* Attendance Type */}
                    <div className="space-y-2">
                      <Label>Attendance Type</Label>
                      <RadioGroup
                        value={attendanceType}
                        onValueChange={setAttendanceType}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mandatory" id="mandatory" />
                          <Label htmlFor="mandatory">Mandatory</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="optional" id="optional" />
                          <Label htmlFor="optional">Optional</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Geolocation Validation */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="geo-validation">
                          Geolocation Validation
                        </Label>
                        <Switch
                          id="geo-validation"
                          checked={geoValidation}
                          onCheckedChange={setGeoValidation}
                        />
                      </div>
                      {geoValidation && (
                        <div className="flex items-center gap-2">
                          <Input
                            id="geo-radius"
                            type="number"
                            value={geoRadius}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setGeoRadius(Number.parseInt(e.target.value))}
                            className="w-24"
                          />
                          <Label htmlFor="geo-radius">meters radius</Label>
                        </div>
                      )}
                    </div>

                    {/* Auto-expire Options */}
                    <div className="space-y-2">
                      <Label>Auto-expire Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="after-class"
                            checked={autoExpireOptions.afterClass}
                            onCheckedChange={(checked: boolean) =>
                              setAutoExpireOptions({
                                ...autoExpireOptions,
                                afterClass: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="after-class">
                            Expire after class end time
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="after-limit"
                            checked={autoExpireOptions.afterLimit}
                            onCheckedChange={(checked: boolean) =>
                              setAutoExpireOptions({
                                ...autoExpireOptions,
                                afterLimit: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="after-limit">
                            Expire after attendance limit reached
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="after-date"
                            checked={autoExpireOptions.afterDate}
                            onCheckedChange={(checked: boolean) =>
                              setAutoExpireOptions({
                                ...autoExpireOptions,
                                afterDate: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="after-date">
                            Expire after specific date/time
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Check-in Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Real-time Check-in Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        24/45 students checked in (53%)
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      >
                        Live
                      </Badge>
                    </div>
                    <Progress value={53} className="h-2 bg-muted" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Recent Check-ins</Label>
                        <span className="text-xs text-muted-foreground">
                          Last updated: {format(new Date(), "hh:mm:ss a")}
                        </span>
                      </div>
                      <ScrollArea className="h-[140px] rounded-md border p-2 bg-card">
                        <div className="space-y-2">
                          {recentCheckins.map(student => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={student.avatar || "/placeholder.svg"}
                                    alt={student.name}
                                  />
                                  <AvatarFallback>
                                    {student.name
                                      .split(" ")
                                      .map(n => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {student.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {student.timestamp}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button
                        variant="outline"
                        className="w-full gap-1 text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View All Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
