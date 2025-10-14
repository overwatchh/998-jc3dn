"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useAuth";
import { Roles } from "@/types";
import {
  AlertCircle,
  BookOpen,
  HelpCircle,
  Mail,
  Users,
  QrCode,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SupportFormData {
  subject: string;
  message: string;
  category: string;
}

export default function SupportPage() {
  const { data: session } = useCurrentUser();
  const [formData, setFormData] = useState<SupportFormData>({
    subject: "",
    message: "",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isStudent = session?.user?.role === Roles.STUDENT;
  const isLecturer = session?.user?.role === Roles.LECTURER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ subject: "", message: "", category: "" });
  };

  const handleInputChange = (field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-20 md:pt-10">
      <header className="mb-10 space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-balance md:text-4xl">
          Support Center
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg">
          Get help with Attendease - your comprehensive QR code attendance
          system
        </p>
      </header>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="troubleshooting">Help</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                About Attendease
              </CardTitle>
              <CardDescription>
                Your comprehensive attendance tracking solution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Attendease is a modern QR code-based attendance system designed
                to streamline the attendance process for educational
                institutions. The system uses a two-phase verification process
                to ensure accurate attendance recording.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <QrCode className="h-4 w-4" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-muted-foreground space-y-2 text-sm">
                      <li>1. Lecturers generate QR codes for sessions</li>
                      <li>2. Students scan QR codes to check in</li>
                      <li>3. Two-phase verification ensures accuracy</li>
                      <li>4. Real-time tracking and reporting</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-4 w-4" />
                      User Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>
                        <strong>Students:</strong> Scan QR codes, view records
                      </li>
                      <li>
                        <strong>Lecturers:</strong> Generate QR codes, track
                        attendance
                      </li>
                      <li>
                        <strong>Admins:</strong> System management, user
                        oversight
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help getting started?</strong>{" "}
                  {isStudent && (
                    <Link
                      href="/tutorial"
                      className="underline hover:no-underline"
                    >
                      View our step-by-step tutorial
                    </Link>
                  )}
                  {isLecturer && (
                    <span>
                      Check the guides section for lecturer-specific
                      instructions.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {isStudent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Student Guide
                  </CardTitle>
                  <CardDescription>
                    Learn how to use the attendance system as a student
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Quick Start:</h4>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Enable camera permissions in your browser</li>
                      <li>• Navigate to the Scan page during class</li>
                      <li>• Scan the QR code shown by your lecturer</li>
                      <li>• Complete both check-in phases for full credit</li>
                    </ul>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/tutorial">View Detailed Tutorial</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {isLecturer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Lecturer Guide
                  </CardTitle>
                  <CardDescription>
                    Manage attendance sessions and track student participation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Key Features:</h4>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Generate unique QR codes for each session</li>
                      <li>• Monitor real-time attendance</li>
                      <li>• View detailed attendance reports</li>
                      <li>• Manage course and student data</li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">
                      Manual Check-in for Students
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      For students who cannot use the QR scanning system due to
                      technical issues or lack of access to a camera/phone:
                    </p>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>
                        • Students should approach you at the end of class
                      </li>
                      <li>
                        • Navigate to Attendance Tracking from your dashboard
                      </li>
                      <li>
                        • Select the current session to view the student list
                      </li>
                      <li>• Find the student in the attendance table/list</li>
                      <li>• Click "Check In" to record their attendance</li>
                      <li>
                        • This ensures all students can be properly recorded
                        even with technical limitations
                      </li>
                    </ul>
                  </div>

                  <Button asChild className="w-full">
                    <Link href="/qr-generation">Generate QR Code</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Features
                </CardTitle>
                <CardDescription>
                  Overview of available functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Available Features:</h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Real-time attendance tracking</li>
                    <li>• QR code generation and scanning</li>
                    <li>• Two-phase verification system</li>
                    <li>• Comprehensive reporting dashboard</li>
                    <li>• Multi-role user management</li>
                    <li>• Mobile-responsive interface</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Common Issues & Solutions
              </CardTitle>
              <CardDescription>
                Frequently asked questions and troubleshooting tips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 font-medium">Camera Issues</h4>
                  <p className="text-muted-foreground mb-2 text-sm">
                    If you're having trouble with camera access:
                  </p>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>
                      • Ensure camera permissions are enabled in your browser
                    </li>
                    <li>
                      • Try refreshing the page and granting permissions again
                    </li>
                    <li>• Check if another application is using the camera</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-medium">QR Code Scanning</h4>
                  <p className="text-muted-foreground mb-2 text-sm">
                    If QR codes aren't scanning properly:
                  </p>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>
                      • Ensure good lighting and steady camera positioning
                    </li>
                    <li>
                      • Keep the entire QR code visible in the camera frame
                    </li>
                    <li>
                      • Clean your camera lens if the image appears blurry
                    </li>
                    <li>• Try moving closer to or farther from the QR code</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-medium">Attendance Recording</h4>
                  <p className="text-muted-foreground mb-2 text-sm">
                    If attendance isn't being recorded correctly:
                  </p>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>
                      • Ensure you're scanning during the valid time window
                    </li>
                    <li>• Check your internet connection</li>
                    <li>• Verify you're logged in with the correct account</li>
                    <li>• Contact your lecturer if issues persist</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-medium">
                    Manual Check-in (For Lecturers)
                  </h4>
                  <p className="text-muted-foreground mb-2 text-sm">
                    When performing manual check-ins for students:
                  </p>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>
                      • Navigate to Attendance Tracking from your dashboard
                    </li>
                    <li>
                      • Select the current session to view all enrolled students
                    </li>
                    <li>
                      • Look for the student who approached you (they may show
                      as absent)
                    </li>
                    <li>• Click "Check In" next to their name</li>
                    <li>
                      • Confirm the attendance was recorded successfully in the
                      list
                    </li>
                    <li>
                      • Manual check-ins count toward attendance requirements
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Submit a support request or question
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2"
                      value={formData.category}
                      onChange={e =>
                        handleInputChange("category", e.target.value)
                      }
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="technical">Technical Issue</option>
                      <option value="feature">Feature Request</option>
                      <option value="account">Account Problem</option>
                      <option value="attendance">Attendance Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Brief description of your issue"
                      value={formData.subject}
                      onChange={e =>
                        handleInputChange("subject", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide detailed information about your question or issue..."
                      rows={5}
                      value={formData.message}
                      onChange={e =>
                        handleInputChange("message", e.target.value)
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Support Request"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="font-medium text-green-600">
                    ✓ Support request submitted successfully!
                  </div>
                  <p className="text-muted-foreground text-sm">
                    We've received your message and will respond as soon as
                    possible. You can expect a response within 24-48 hours.
                  </p>
                  <Button onClick={() => setSubmitted(false)} variant="outline">
                    Submit Another Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alternative Contact Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>System Administrator:</strong> admin@attendease.edu
                </div>
                <div>
                  <strong>Technical Support:</strong> support@attendease.edu
                </div>
                <div>
                  <strong>Phone:</strong> (555) 123-4567
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
