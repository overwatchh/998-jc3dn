"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { FaqItem, faqItems } from "./_components/faq";

interface StepDef {
  id: number;
  title: string;
  subtitle: string;
  details: string[];
  imgAlt: string;
  imgSrc: string;
}

const steps: StepDef[] = [
  {
    id: 1,
    title: "Allow camera access",
    subtitle: "Grant permission so the scanner can read the class QR codes.",
    details: [
      "When prompted by the browser, click Allow to enable the camera.",
      "If you accidentally clicked Block, use the Try Again button to re-request access.",
    ],
    imgAlt: "Browser camera permission prompt screenshot",
    imgSrc: "/camera-permission.jpg",
  },
  {
    id: 2,
    title: "Scan QR to check in (first scan)",
    subtitle: "Scan the session's QR code during the FIRST validity window.",
    details: [
      "Open the Scan page from the bottom navigation.",
      "Point your camera steadily at the projected / shared QR code.",
      "You will see a success message once the first check‑in is recorded (counts for 45%).",
    ],
    imgAlt: "Scanning first QR code screenshot",
    imgSrc: "/qr-first-checkin.png",
  },
  {
    id: 3,
    title: "Wait for the second window",
    subtitle: "A later time window opens to verify you stayed present.",
    details: [
      "Keep attending the lecture; do not leave early.",
      "You can monitor any countdown on the session page (if provided).",
      "No action is needed until the second window opens.",
    ],
    imgAlt: "Second validity window indicator illustration",
    imgSrc: "/attend-lecture.png",
  },
  {
    id: 4,
    title: "Manual second check‑in",
    subtitle:
      "Confirm presence again to receive the full attendance weight (up to 90%).",
    details: [
      "Return to the Scan page once the second window starts.",
      "Tap the Manual Check‑In button (or scan the refreshed QR if instructed).",
      "You'll see a confirmation that your second check‑in succeeded.",
    ],
    imgAlt: "Manual second check‑in confirmation screenshot",
    imgSrc: "/qr-second-checkin.png",
  },
];

export default function TutorialPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 pt-6 pb-20 md:pt-10">
      <header className="mb-10 space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-balance md:text-4xl">
          Attendance Scanning Tutorial
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg">
          Follow these steps to successfully record your attendance. Two
          confirmations (first scan + later verification) give you full credit.
        </p>
      </header>

      <ol className="space-y-10">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          return (
            <li key={step.id} className="group">
              <Card
                aria-labelledby={`step-${stepNumber}-title`}
                className="overflow-hidden"
              >
                <CardHeader className="pb-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1.5 md:max-w-2xl">
                      <div className="text-primary/80 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                        <span className="bg-primary/10 text-primary ring-primary/20 inline-flex size-6 items-center justify-center rounded-full font-semibold ring-1 ring-inset md:size-7 md:text-sm">
                          {stepNumber}
                        </span>
                        Step {stepNumber}
                      </div>
                      <CardTitle>
                        <h2
                          id={`step-${stepNumber}-title`}
                          className="text-lg leading-snug font-semibold text-balance md:text-2xl"
                        >
                          {step.title}
                        </h2>
                      </CardTitle>
                      <CardDescription className="text-sm md:text-base">
                        {step.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-8 pt-6">
                  <div className="bg-muted/30 ring-border/40 relative flex justify-center rounded-xl border p-2 shadow-inner ring-1 ring-inset">
                    {(() => {
                      // Dimension map to derive aspect ratio for wrapper (needed when using fill)
                      const dim: Record<string, { w: number; h: number }> = {
                        "/camera-permission.jpg": { w: 1079, h: 1965 },
                        "/qr-first-checkin.png": { w: 485, h: 796 },
                        "/attend-lecture.png": { w: 1024, h: 1024 },
                        "/qr-second-checkin.png": { w: 487, h: 788 },
                      };
                      const { w, h } = dim[step.imgSrc] ?? { w: 800, h: 800 };
                      return (
                        <div
                          className="relative mx-auto max-h-[520px] w-full max-w-md overflow-hidden rounded-xl"
                          style={{ aspectRatio: `${w} / ${h}` }}
                        >
                          <Image
                            src={step.imgSrc}
                            alt={step.imgAlt}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 100vw, 640px"
                            className="border-border/40 rounded-xl border object-contain shadow-sm select-none"
                          />
                        </div>
                      );
                    })()}
                  </div>
                  <ul className="flex flex-col gap-3 text-sm md:gap-4 md:text-base">
                    {step.details.map((d, i) => (
                      <li
                        key={i}
                        className="bg-muted/30 group-hover:border-primary/30 group-hover:bg-muted/40 relative rounded-lg border border-transparent p-3 pl-4 leading-relaxed transition-colors md:p-4"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <section className="mt-16">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold tracking-tight md:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-sm md:text-base">
            Quick answers to common issues students face while recording
            attendance.
          </p>
        </div>

        <ul className="space-y-4">
          {faqItems.map((item, i) => (
            <li key={i}>
              <FaqItem {...item} defaultOpen={i === 0} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
