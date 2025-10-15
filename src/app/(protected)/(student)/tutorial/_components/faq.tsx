"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FaqItemProps {
  q: string;
  a: string | React.ReactNode;
  defaultOpen?: boolean;
}

function FaqItem({ q, a, defaultOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm transition-colors"
    >
      <CollapsibleTrigger className="group focus-visible:ring-ring focus-visible:ring-offset-background hover:bg-muted/40 flex w-full items-center gap-3 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:px-6">
        <span className="flex-1 text-sm font-medium md:text-base">{q}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-5 shrink-0 transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pt-0 pb-5 md:px-6">
        <div className="text-muted-foreground text-sm leading-relaxed md:text-base">
          {a}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const faqItems: FaqItemProps[] = [
  {
    q: "What is AttendEase?",
    a: (
      <span>
        AttendEase is a platform that allows students to confirm their
        attendance in lectures and classes by scanning a QR code. AttendEase
        also provides advanced tracking tools to allow students and lecturers
        alike to better track their attendance.
      </span>
    ),
  },
  {
    q: "How do I confirm my attendance?",
    a: (
      <span>
        Students can simply scan the QR code when prompted by their lecturer,
        then follow the on-screen prompts to confirm their attendance.
      </span>
    ),
  },
  {
    q: "I don't have a phone or camera. How can I check in?",
    a: "If you're unable to use the QR scanning system due to not having a phone or camera access, please speak with your lecturer at the end of the class. They can perform a manual check-in for you to ensure your attendance is properly recorded.",
  },
  {
    q: "How do I add classes (Student)?",
    a: (
      <span>
        At this time, students are unable to add or enrol themselves in classes.
        Student enrolment is provided by institutions, and students are
        automatically enrolled based on this data.
      </span>
    ),
  },
  {
    q: "How do I access my past attendance?",
    a: (
      <span>
        Students can log in with their account details to access their
        dashboard. This dashboard gives access to information about the classes
        enrolled, as well as statistics for each class and overall attendance.
      </span>
    ),
  },
  {
    q: "How can I determine if I have sufficient attendance?",
    a: (
      <span>
        Students can check their account dashboard to check their attendance
        rates at any time. The minimum attendance thresholds for enrolled
        classes can also be accessed via this dashboard. Students are also
        notified if their attendance drops below minimum attendance, and on
        their first missed session for each class.
      </span>
    ),
  },
  {
    q: "Why does AttendEase request GPS location data?",
    a: (
      <span>
        AttendEase utilises student GPS data to determine whether students are
        attending in person. Student GPS data can be cross-referenced with the
        location data of the venue for the event to determine whether students
        are attending in-person or viewing the lecture online.
      </span>
    ),
  },
  {
    q: "How is GPS data used?",
    a: (
      <span>
        GPS data is used by AttendEase to verify whether students are in the
        correct location, which is a requirement for in-person attendance for
        some event types (based on lecturer settings). This GPS data is only
        used to verify location at the time of attendance confirmation, and is
        not stored.
      </span>
    ),
  },
  {
    q: "What if I can't scan the code?",
    a: (
      <span>
        If you are unable to scan the QR code for some reason, such as a lack of
        device access or technical issues, your lecturer can manually confirm
        your attendance. Ask your lecturer about whether they are able to sign
        you in manually, or if there is another way you can confirm your
        attendance.
      </span>
    ),
  },
  {
    q: "Can I check in after class?",
    a: (
      <span>
        Students are not able to check in after their class. Each lecture
        instance and its associated QR codes are time sensitive, based on the
        times entered by the lecturer at the time of creation. As a result, the
        check in page will be unavailable outside of these times.
      </span>
    ),
  },
  {
    q: "What if I forget to check in?",
    a: (
      <span>
        If you forget to check in, you will be unable to scan the QR code at a
        later date to confirm your attendance. Please contact your lecturer so
        that they can manually add your attendance.
      </span>
    ),
  },
  {
    q: "What devices and browsers are supported?",
    a: (
      <span>
        AttendEase works on most modern smartphones, tablets, and computers with
        internet access. We recommend using the latest version of Chrome,
        Firefox, Safari, or Edge browsers. The camera scanning feature requires
        a device with a camera and works best on mobile devices.
      </span>
    ),
  },
  {
    q: "How do I create an account or reset my password?",
    a: (
      <span>
        Account creation and management is handled by your institution. If
        you're having trouble logging in or need to reset your password, please
        contact your institution's IT support or lecturer for assistance with
        your student account credentials.
      </span>
    ),
  },
  {
    q: "Is my data secure and private?",
    a: (
      <span>
        Yes, AttendEase takes data privacy seriously. Your attendance data is
        encrypted and stored securely. GPS location data is only used
        temporarily for verification and is not permanently stored. You can
        review our privacy policy for more details about how your data is
        handled.
      </span>
    ),
  },
  {
    q: "How do I contact support if I need help?",
    a: (
      <span>
        If you need technical support or have questions about using AttendEase,
        you can contact your institution's IT support team or speak directly
        with your lecturer. For system-wide issues, you can also use the support
        page within the application to report problems.
      </span>
    ),
  },
  {
    q: "Can I use multiple devices to check in?",
    a: (
      <span>
        Yes, you can use different devices to check in for different classes,
        but we recommend using the same device consistently for the best
        experience. Make sure location services are enabled on whichever device
        you're using for attendance confirmation.
      </span>
    ),
  },
  {
    q: "What should I do if the QR code isn't scanning properly?",
    a: (
      <span>
        If you're having trouble scanning the QR code, try the following: clean
        your camera lens, ensure good lighting, hold your device steady, make
        sure the entire QR code is visible in the camera frame, and try moving
        slightly closer or farther from the code. If problems persist, ask your
        lecturer for manual check-in assistance.
      </span>
    ),
  },
  {
    q: "I don't see the camera permission prompt anymore. How do I enable it?",
    a: (
      <span>
        Click the site info (lock) icon in your browser's address bar, locate
        Camera, and set it to Allow. Then refresh the page and open Scan again.
      </span>
    ),
  },
  {
    q: "My first scan worked but the second window never appeared. What now?",
    a: "The second window is time-based. Stay on the session; if it has closed already you'll keep the first (partial) credit. If this keeps happening, notify your lecturer with the session date/time.",
  },
  {
    q: "The QR code won't scan / stays blurry.",
    a: "Clean your camera lens, move closer (but keep the full code visible), or increase screen brightness if scanning from a screen. Lock device orientation if it keeps refocusing.",
  },
  {
    q: "I missed the first scan. Can I still get attendance?",
    a: "You can still perform the second check‑in (manual or QR depending on instructions) but it will grant reduced credit because the initial presence wasn't verified.",
  },
  {
    q: "Manual check-in button is disabled or missing.",
    a: "You might be outside the allowed second window or the lecturer disabled manual mode. Refresh the page after the announced start time, and if still missing, contact the lecturer.",
  },
];

export { FaqItem, faqItems };
