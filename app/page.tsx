import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-content">
      {/* Nav */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <span className="font-heading text-sm font-semibold tracking-tight text-content">
            Scaleva
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-content-muted transition-colors hover:text-content"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 py-16 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[60fr_40fr] lg:items-center">
          {/* Left: copy */}
          <div>
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-[-0.03em] text-content sm:text-4xl lg:text-[56px]">
              Your customers forget you exist.{" "}
              <span className="text-content-muted">Scaleva fixes that.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-content-muted">
              Scaleva writes a personal SMS for each customer using their
              purchase history and your brand voice, then sends it at the right
              time. No templates. No blasting.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-10 items-center rounded-btn bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Get started free
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-content-muted transition-colors hover:text-content"
              >
                See pricing →
              </Link>
            </div>
          </div>

          {/* Right: terminal — hidden on small screens */}
          <div className="hidden overflow-hidden rounded-card border border-line bg-surface font-mono text-xs lg:block">
            <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
            </div>
            <div className="space-y-3 px-5 py-5 leading-relaxed">
              <p>
                <span className="text-content-muted">scaleva</span>{" "}
                <span className="text-content-muted">~</span>{" "}
                <span className="text-content">%</span>{" "}
                <span className="text-content-muted">
                  generate --customer &quot;Sarah M.&quot;
                </span>
              </p>
              <div className="space-y-1 border-l border-line pl-4 text-content-muted">
                <p>Customer: Sarah M.</p>
                <p>Last visit: 47 days ago</p>
                <p>Spent: $284.00</p>
              </div>
              <p className="text-content-muted">Writing message...</p>
              <div className="rounded-btn border border-line bg-base px-4 py-3 text-content">
                &ldquo;Hey Sarah! It&apos;s been a little while since your last
                visit. We&apos;ve got a few new things we think you&apos;ll love.
                Come say hi this week.&rdquo;
              </div>
              <p>
                <span className="text-accent">✓</span>{" "}
                <span className="text-content-muted">
                  Queued &middot; Sending tonight at 6pm
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-24">
          <div className="mb-12">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-content sm:text-2xl">
              Built for businesses that rely on repeat customers
            </h2>
            <p className="mt-2 text-base text-content-muted">
              Salons, restaurants, contractors. If customers come back, Scaleva
              keeps them coming back.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* Large card */}
            <div className="rounded-card border border-line bg-surface p-6 lg:col-span-2 lg:row-span-2 lg:p-8">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-btn border border-line text-content-muted">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-content sm:text-xl">
                Knows your customers
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-content-muted">
                Connect Square, Stripe, Shopify, or upload a CSV. Every message
                Scaleva writes is grounded in what that customer actually bought
                and when they last visited.
              </p>
              <div className="mt-8 overflow-hidden rounded-btn border border-line bg-base px-4 py-4 font-mono text-xs text-content-muted">
                <p className="mb-2 text-content-muted/50">// customer context</p>
                <p>
                  <span className="text-accent">name</span>: &ldquo;Maria
                  C.&rdquo;
                </p>
                <p>
                  <span className="text-accent">last_visit</span>: &ldquo;23
                  days ago&rdquo;
                </p>
                <p>
                  <span className="text-accent">spent</span>: &ldquo;$412.00&rdquo;
                </p>
                <p>
                  <span className="text-accent">tags</span>: [&ldquo;regular&rdquo;,
                  &ldquo;color-client&rdquo;]
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-btn border border-line text-content-muted">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-base font-semibold tracking-[-0.02em] text-content">
                Writes in your voice
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                Tell Scaleva your industry and tone once. Every message sounds
                like you wrote it, not a template.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-btn border border-line text-content-muted">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-base font-semibold tracking-[-0.02em] text-content">
                Runs without you
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                Set your cadence and goals once. Scaleva handles the timing,
                tracks replies, and never double-sends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <span className="font-heading text-sm font-semibold text-content">
              Scaleva
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-content-muted sm:justify-end">
              <Link href="/pricing" className="hover:text-content transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-content transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-content transition-colors">Terms of Service</Link>
              <span>&copy; {new Date().getFullYear()} Scaleva</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
