import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Scaleva",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base text-content">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-heading text-sm font-semibold tracking-tight text-content">
            Scaleva
          </Link>
          <Link href="/dashboard" className="text-sm text-content-muted hover:text-content">
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-content">Privacy Policy</h1>
        <p className="mt-2 text-sm text-content-muted">Last updated: June 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-content-muted">

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">What data we collect</h2>
            <p>When you use Scaleva, we collect the following information:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Business name and owner email address (from account registration)</li>
              <li>Customer names, phone numbers, and email addresses (entered manually or imported)</li>
              <li>Customer purchase history and spend amounts</li>
              <li>SMS message content generated and sent through our platform</li>
              <li>Inbound SMS replies from your customers</li>
              <li>Payment and billing information (processed by Stripe — we do not store card details)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">How we use it</h2>
            <p>
              We use the data collected solely to provide the Scaleva service: generating personalized
              SMS messages on behalf of your business and sending them to your customers via Twilio.
              We do not sell your data or your customers&apos; data to third parties. We do not use
              customer phone numbers for any purpose other than sending messages you explicitly authorize.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Data storage</h2>
            <p>
              All data is stored securely in Supabase (PostgreSQL) with row-level security enabled.
              Each business can only access its own data. Data is stored in the United States.
              Backups are retained for 7 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Third-party services</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong className="text-content">Twilio</strong> — SMS delivery. Customer phone numbers are sent to Twilio to deliver messages. Twilio&apos;s privacy policy applies.</li>
              <li><strong className="text-content">Anthropic (Claude)</strong> — AI message generation. Customer context (name, purchase history) is sent to Anthropic to generate message copy. No data is retained by Anthropic for training.</li>
              <li><strong className="text-content">Stripe</strong> — Payment processing. Billing details are handled by Stripe and subject to Stripe&apos;s privacy policy.</li>
              <li><strong className="text-content">Supabase</strong> — Database and authentication. Subject to Supabase&apos;s privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Data retention</h2>
            <p>
              We retain your data for as long as your account is active. If you cancel your account,
              all data (businesses, customers, messages) will be permanently deleted within 30 days.
              You can request immediate deletion at any time by using the Danger Zone in Settings or
              emailing us at <a href="mailto:privacy@scaleva.app" className="text-accent hover:underline">privacy@scaleva.app</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">TCPA compliance</h2>
            <p>
              Scaleva is a tool for businesses to communicate with their own customers.
              <strong className="text-content"> Businesses are solely responsible for obtaining proper consent
              from their customers before sending SMS messages.</strong> You must comply with the
              Telephone Consumer Protection Act (TCPA) and all applicable SMS marketing laws in your
              jurisdiction. Scaleva does not provide legal advice on TCPA compliance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">GDPR</h2>
            <p>
              Scaleva is operated from the United States. Data is processed in the US. If you are
              subject to GDPR (e.g., EU residents), by using Scaleva you consent to the transfer
              and processing of your data in the United States. Contact us at{" "}
              <a href="mailto:privacy@scaleva.app" className="text-accent hover:underline">privacy@scaleva.app</a>{" "}
              for data subject requests.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Contact</h2>
            <p>
              For any privacy questions or requests, email us at{" "}
              <a href="mailto:privacy@scaleva.app" className="text-accent hover:underline">privacy@scaleva.app</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-line mt-16">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <span className="font-heading text-sm font-semibold text-content">Scaleva</span>
          <div className="flex items-center gap-4 text-xs text-content-muted">
            <Link href="/privacy" className="hover:text-content">Privacy</Link>
            <Link href="/terms" className="hover:text-content">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
