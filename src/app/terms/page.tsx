"use client";
import AppShell from "@components/layout/AppShell";

export default function TermsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              By accessing and using DueNorth (&quot;Service&quot;), you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to abide by the
              above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Eligibility
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              You must be at least 13 years old to use this service. By using DueNorth, you
              represent and warrant that you meet this requirement and that you have the
              authority to enter into this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Description of Service
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              DueNorth is a read-only assignment tracking tool that connects to your Canvas LMS
              account to display your courses and assignments. We do not store or access grades,
              submissions, or other sensitive academic data. This service is not endorsed by,
              affiliated with, or sponsored by the University of North Carolina or Instructure Inc.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Accounts
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                When you create an account with us, you must provide information that is accurate,
                complete, and current at all times. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Safeguarding the password and access to your account</li>
                <li>All activities that occur under your account</li>
                <li>Keeping your Canvas personal access token confidential</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                You may revoke your Canvas token at any time directly in your Canvas account settings.
                See Canvas&apos;s documentation for instructions on managing API access tokens.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              License
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable,
              revocable license to use the Service for personal, non-commercial purposes.
              This license does not include any resale or commercial use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Prohibited Uses
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              You may not use the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To interfere with or circumvent the security features of the Service</li>
              <li>To use any automated system to access the Service without permission</li>
              <li>To abuse or interfere with Canvas rate limits or API usage policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Availability and Service Levels
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We strive to keep the Service available, but we do not guarantee uptime or availability.
              The Service may be temporarily unavailable due to maintenance, updates, or factors
              beyond our control. We reserve the right to modify, suspend, or discontinue the
              Service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Disclaimers
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              The information on this Service is provided on an &apos;as is&apos; basis. To the fullest
              extent permitted by law, we exclude all representations, warranties, conditions,
              and terms whether express or implied, statutory or otherwise, including without
              limitation warranties of merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              In no event shall DueNorth, nor its directors, employees, partners, agents, suppliers,
              or affiliates, be liable for any indirect, incidental, special, consequential, or
              punitive damages, including without limitation, loss of profits, data, use, goodwill,
              or other intangible losses, resulting from your use of the Service. Our total liability
              shall not exceed the amount paid by you for the Service in the twelve months preceding
              the claim (which is $0 if you use our free service).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Indemnification
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              You agree to defend, indemnify, and hold us harmless from and against any claims,
              damages, costs, liabilities, and expenses (including reasonable attorneys&apos; fees)
              arising out of or related to your use of the Service, your violation of these Terms,
              or your violation of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may terminate or suspend your account and bar access to the Service immediately,
              without prior notice or liability, for any reason whatsoever. You may also delete
              your account and all associated data at any time through the Service. Upon termination,
              your right to use the Service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Governing Law
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              These Terms shall be interpreted and governed by the laws of the State of North Carolina,
              United States, without regard to its conflict of law provisions. Our failure to enforce
              any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to modify these Terms at any time. We will notify users of
              material changes via email or through a prominent notice in the application.
              Your continued use of the Service after such modifications constitutes acceptance
              of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> westonvogle@duenorthapp.com<br />
                <strong>Subject:</strong> Terms of Service Inquiry
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
