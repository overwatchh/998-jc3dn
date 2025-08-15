"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { authClient } from "@/lib/auth/auth-client"
import { Role } from "@/lib/auth/permission"
import { GraduationCap, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface Props {
  userId: string
}

export function RolePicker({ userId }: Props) {
  const [selectedRole, setSelectedRole] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  function handleSubmit() {
    if (!selectedRole) return
    setShowConfirmation(true)
  }

  async function handleConfirmedSubmit(role: Role) {
    const { error } = await authClient.admin.setRole({
      userId,
      role,
    })

    if (error) {
      toast.error("Failed to set role. Check server log for more details.")
      return
    }

    window.location.reload()
  }

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Access learning materials and submit assignments",
      icon: GraduationCap,
    },
    {
      id: "lecturer",
      title: "Lecturer",
      description: "Create courses, manage students, and grade assignments",
      icon: Users,
    },
  ]

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Choose Your Role</h1>
        <p className="text-muted-foreground">
          Select your role to get started with the platform
        </p>
      </div>

      <RadioGroup
        value={selectedRole}
        onValueChange={setSelectedRole}
        className="space-y-3"
      >
        {roles.map(role => {
          const Icon = role.icon
          return (
            <div key={role.id} className="relative">
              <RadioGroupItem
                value={role.id}
                id={role.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={role.id}
                className="flex cursor-pointer items-start space-x-3 rounded-lg border-2 border-muted p-4 transition-all hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <Icon className="mt-1 h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                <div className="space-y-1">
                  <div className="font-medium leading-none peer-data-[state=checked]:text-primary">
                    {role.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {role.description}
                  </div>
                </div>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      <Button
        onClick={handleSubmit}
        disabled={!selectedRole}
        className="w-full"
        size="lg"
      >
        Continue as{" "}
        {selectedRole ? roles.find(r => r.id === selectedRole)?.title : "..."}
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Role</AlertDialogTitle>
            <AlertDialogDescription>
              You have selected <strong>{selectedRole}</strong> as your role.
              This will determine your access level and available features. Are
              you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmedSubmit(selectedRole as Role)}
            >
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
