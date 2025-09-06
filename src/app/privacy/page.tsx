"use client";
import AppShell from "@components/layout/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Who we are
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              DueNorth (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a student-developed assignment tracking tool
              designed to help students manage their academic workload by connecting to Canvas LMS.
              Contact us at support@duenorth.app for any privacy-related questions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Scope
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              This Privacy Policy applies to your use of the DueNorth website and mobile application.
              We are not affiliated with the University of North Carolina, Instructure Inc., or Canvas LMS.
              This policy does not apply to any third-party services you may access through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              What we collect
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                We collect and process the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Account Information:</strong> Email address and authentication data required
                  to create and secure your account
                </li>
                <li>
                  <strong>Canvas Personal Access Token:</strong> Encrypted at rest and used solely
                  to access your Canvas data on your behalf
                </li>
                <li>
                  <strong>Assignment Metadata:</strong> Course titles, assignment titles, due dates,
                  and course IDs from your Canvas account (we do not access or store grades)
                </li>
                <li>
                  <strong>Usage Logs:</strong> Basic analytics data about app usage patterns
                  to improve service reliability
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Why we collect this information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Provide the core assignment tracking service</li>
              <li>Sync and display your assignments from Canvas</li>
              <li>Prevent abuse and maintain service security</li>
              <li>Improve service reliability and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Legal basis for processing
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We process your data based on consent (your agreement to these terms and use of our service)
              and legitimate interest (providing the service you requested). If you are located in the
              European Union, this processing complies with Article 6(1)(a) and (b) of the GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Sharing your information
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                We do not sell your personal information to third parties. We share data only with
                essential service providers:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Vercel:</strong> Hosting and deployment platform</li>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Email Service:</strong> For account verification and password reset</li>
                <li><strong>Logging Service:</strong> For error monitoring and service reliability</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Data retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We retain your data only as long as necessary:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Account data and Canvas tokens are deleted immediately upon account deletion</li>
              <li>Usage logs are retained for 90 days for security and debugging purposes</li>
              <li>Backup data is automatically purged within 30 days of account deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Your choices and rights
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Disconnect Canvas:</strong> Revoke your token at any time in your account settings</li>
                <li><strong>Delete Account:</strong> Permanently remove all your data from our systems</li>
                <li><strong>Export Data:</strong> Download a copy of your stored information</li>
                <li><strong>Access:</strong> Review what data we have stored about you</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Do Not Track
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We do not respond to Do-Not-Track (DNT) signals. We disclose our DNT practices here
              to comply with California requirements. We may still collect usage analytics to
              maintain and improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Children&apos;s privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our Service is not directed to children under 13. We do not knowingly collect
              personal information from children under 13. If you believe we have collected
              information from a child under 13, please contact us immediately and we will
              delete it. This complies with COPPA (Children&apos;s Online Privacy Protection Act).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              FERPA notice
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We are not affiliated with any educational institution and are not a &quot;school official&quot;
              under FERPA. You connect your own Canvas account and choose to share assignment data
              with us. We store only the minimum needed to display your assignments (titles, due dates,
              course IDs). We do not access or store grades, submissions, or other education records.
              Universities and the Department of Education are not parties to this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Canvas tokens are encrypted at rest using AES-256 encryption</li>
              <li>All data transmission uses TLS 1.3 encryption</li>
              <li>Rate limiting and abuse prevention measures</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              International data transfers
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Your data is primarily stored in the United States. If you are located outside the US,
              your data may be transferred to and processed in the US. We ensure appropriate safeguards
              are in place for such transfers through our subprocessors&apos; compliance with data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Changes to this policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify users of material
              changes via email or through a prominent notice in the application. Your continued use
              of the service after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Contact us
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy or our data practices,
              please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> westonvogle@duenorthapp.com<br />
                <strong>Subject:</strong> Privacy Policy Inquiry
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
