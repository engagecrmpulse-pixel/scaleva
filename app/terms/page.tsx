import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Scaleva",
};

export default function TermsPage() {
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
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-content">Terms of Service</h1>
        <p className="mt-2 text-sm text-content-muted">Last updated: June 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-content-muted">

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Service description</h2>
            <p>
              Scaleva is an AI-powered SMS customer relationship management (CRM) platform. It enables
              businesses to generate personalized SMS messages using customer purchase history and
              send them via Twilio. By using Scaleva, you agree to these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Acceptable use</h2>
            <p>You agree to use Scaleva only for lawful purposes. You must not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Send SMS messages to any person who has not given you explicit consent to receive them</li>
              <li>Send spam, unsolicited commercial messages, or illegal content</li>
              <li>Use Scaleva for harassment, threats, or abusive messaging</li>
              <li>Attempt to circumvent Scaleva&apos;s rate limits, usage limits, or security measures</li>
              <li>Resell or redistribute access to Scaleva without written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">SMS compliance</h2>
            <p>
              <strong className="text-content">Businesses are solely responsible for TCPA compliance
              and A2P 10DLC registration.</strong> Before using Scaleva to send SMS messages, you must:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Obtain written or documented consent from each customer before texting them</li>
              <li>Register your brand and campaign with carriers through the A2P 10DLC process</li>
              <li>Provide a clear opt-out mechanism (e.g., "Reply STOP to unsubscribe")</li>
              <li>Honor opt-out requests immediately</li>
            </ul>
            <p className="mt-3">
              Scaleva is not responsible for regulatory fines, carrier violations, or legal claims
              arising from your messaging practices.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Subscription terms</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Subscriptions are billed monthly via Stripe</li>
              <li>You may cancel at any time; cancellation takes effect at the end of the current billing period</li>
              <li>We do not offer refunds for partial billing months</li>
              <li>Prices may change with 30 days&apos; notice</li>
              <li>Accounts that violate these terms may be terminated without refund</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Liability limitation</h2>
            <p>
              Scaleva is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>SMS message deliverability (carrier delays, filtering, or blocking)</li>
              <li>Customer responses or lack thereof</li>
              <li>Revenue loss or business impact from using or not using the service</li>
              <li>Data loss beyond what is required by our data retention policy</li>
            </ul>
            <p className="mt-3">
              To the maximum extent permitted by law, Scaleva&apos;s total liability to you shall not
              exceed the amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time if you violate
              these Terms, engage in fraudulent activity, or cause harm to other users or third
              parties. We will provide notice where reasonably possible.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Governing law</h2>
            <p>
              These Terms are governed by the laws of the State of California, without regard to
              conflict of law principles. Any disputes shall be resolved in the courts of San
              Francisco County, California.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">Contact</h2>
            <p>
              Questions about these Terms? Email us at{" "}
              <a href="mailto:engagecrmpulse@gmail.com" className="text-accent hover:underline">legal@scaleva.app</a>.
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
