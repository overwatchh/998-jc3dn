import { Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Brand and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-sm font-bold">QR</span>
              </div>
              <span className="text-xl font-bold">Attendease</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Advanced QR code-based attendance tracking system for educational
              institutions. Streamline attendance management with real-time
              tracking and comprehensive reporting.
            </p>
            <div className="flex space-x-4">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/support"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Support
              </Link>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Get in Touch</h3>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>
                For technical support or feature requests, please contact your
                system administrator.
              </p>
              <p>
                This system is designed for educational institutions to manage
                attendance efficiently.
              </p>
            </div>
            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <span>© {currentYear} Attendease. All rights reserved.</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="text-muted-foreground flex items-center text-sm">
              <span>Version 0.1.0</span>
            </div>
            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>for education</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
