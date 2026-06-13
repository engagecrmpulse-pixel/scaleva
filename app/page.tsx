import Link from "next/link";
import HeroPhone from "@/components/HeroPhone";

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
              href="/quiz"
              className="inline-flex h-9 items-center rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get started now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[60fr_40fr] lg:items-center">
          {/* Left: copy */}
          <div>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-[-0.03em] text-content sm:text-5xl lg:text-[56px]">
              Your best guests dined once and disappeared.{" "}
              <span className="text-content-muted">Scaleva brings them back.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-content-muted">
              Scaleva writes a personal SMS for each guest — using what they
              ordered, when they last visited, and your restaurant&apos;s voice —
              then sends it at exactly the right moment. No templates. No blasting.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/quiz"
                className="inline-flex h-10 items-center rounded-btn bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Get started now
              </Link>
              <Link
                href="/login"
                className="text-sm text-content-muted transition-colors hover:text-content"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Right: SMS demo */}
          <HeroPhone />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="mb-12">
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-content">
              Built for restaurants that run on regulars
            </h2>
            <p className="mt-2 text-base text-content-muted">
              Fine dining, neighborhood bistros, cocktail bars, and brunch cafes.
              If guests come back, Scaleva keeps them coming back.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* Large card */}
            <div className="rounded-card border border-line bg-surface p-8 lg:col-span-2 lg:row-span-2">
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
              <h3 className="font-heading text-xl font-semibold tracking-[-0.02em] text-content">
                Knows your guests
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-content-muted">
                Connect Square, Toast, Clover, or upload a CSV. Every message
                Scaleva writes is grounded in what that guest actually ordered
                and when they last visited.
              </p>
              <div className="mt-8 overflow-hidden rounded-btn border border-line bg-base px-4 py-4 font-mono text-xs text-content-muted">
                <p className="mb-2 text-content-muted/50">// guest context</p>
                <p>
                  <span className="text-accent">name</span>: &ldquo;Maria
                  C.&rdquo;
                </p>
                <p>
                  <span className="text-accent">last_visit</span>: &ldquo;23
                  days ago&rdquo;
                </p>
                <p>
                  <span className="text-accent">last_order</span>: &ldquo;Truffle Pasta, Barolo&rdquo;
                </p>
                <p>
                  <span className="text-accent">tags</span>: [&ldquo;regular&rdquo;,
                  &ldquo;wine-lover&rdquo;]
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
                Writes in your restaurant&apos;s voice
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                Tell Scaleva your tone once — warm, upscale, casual, playful.
                Every message sounds like it came from you, not a template.
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
                Runs while you&apos;re in service
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                Set your cadence and goals once. Scaleva handles the timing,
                tracks replies, and fills your slow nights automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6">
          <span className="font-heading text-sm font-semibold text-content">
            Scaleva
          </span>
          <p className="text-xs text-content-muted">
            &copy; {new Date().getFullYear()} Scaleva
          </p>
        </div>
      </footer>
    </div>
  );
}
