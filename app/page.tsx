import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    title: "AI-written messages",
    body: "No templates. Claude writes a personal SMS for each customer in your brand voice, shaped by their real purchase history.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Knows your customers",
    body: "Connect Square, Stripe, Shopify, or upload a CSV. Every message is personalized with what they bought and when.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Runs on autopilot",
    body: "Set your goals once. Scaleva schedules follow-ups, tracks responses, and keeps customers coming back automatically.",
  },
];

const stats = [
  { value: "500+", label: "businesses" },
  { value: "4.9", label: "avg. rating" },
  { value: "3×", label: "repeat purchases" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-base font-semibold text-white">Scaleva</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 pb-32 pt-40">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Powered by Claude AI
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Turn one-time buyers{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              into loyal customers.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Scaleva writes personalized SMS messages for every customer — using
            their purchase history and your brand voice — then sends them on
            autopilot while you run your business.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-900/50 transition-colors hover:bg-indigo-700"
            >
              Start free
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg border border-white/10 bg-white/5 px-6 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              Log in
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-5">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-0.5 text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Everything you need to keep customers coming back
          </h2>
          <p className="mt-3 text-base text-gray-500">
            One platform. Import your customers, set your goals, and watch revenue grow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                {feature.icon}
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-base text-gray-500">
            No engineers needed. If you can upload a spreadsheet, you can use Scaleva.
          </p>

          <div className="mt-12 grid gap-8 text-left sm:grid-cols-3">
            {[
              { step: "01", title: "Connect your data", body: "Import customers from Square, Stripe, Shopify, Toast, HubSpot, or upload a CSV." },
              { step: "02", title: "Set your goals", body: "Tell Scaleva your brand voice, industry, and what kind of messages to send." },
              { step: "03", title: "Watch it work", body: "AI writes personalized messages. Approve, edit, or let autopilot handle everything." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 text-sm font-bold text-indigo-500">{item.step}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Ready to grow your business?
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Join hundreds of small businesses driving repeat revenue with Scaleva. Free to start.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-11 items-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Get started for free
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Scaleva</span>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Scaleva. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
