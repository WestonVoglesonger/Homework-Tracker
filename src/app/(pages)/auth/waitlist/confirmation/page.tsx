"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";

export default function WaitlistConfirmationPage() {
  const router = useRouter();

  // Redirect to home if not coming from registration
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 10000); // Auto redirect after 10 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Link href="/">
              <Image
                src="/logo/due-north-logo.png"
                alt="DueNorth Logo"
                width={80}
                height={80}
                className="mx-auto w-20 h-20 mb-4 cursor-pointer"
                priority
              />
            </Link>
          </div>

          <div className="space-y-6 p-6 rounded-xl border bg-white">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                You&apos;re on the waitlist!
              </h1>
              <p className="text-gray-600">
                Thank you for your interest in DueNorth. We&apos;ve added you to our waitlist and sent you a confirmation email.
                Please verify your email address to ensure you receive your invitation when space opens.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">What happens next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Check your email for a welcome message</li>
                    <li>• Click the verification link to confirm your email</li>
                    <li>• We&apos;ll notify you when space becomes available</li>
                    <li>• You can access our public pages in the meantime</li>
                  </ul>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  You&apos;ll be automatically redirected to the home page in a few seconds...
                </p>

                <div className="flex gap-3">
                  <Link
                    href="/"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    Go to Home
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
