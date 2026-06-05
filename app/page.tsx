import Link from "next/link";
import { Button } from "@/components/Button";

const features = [
  {
    title: "AI-written outreach",
    body: "Claude drafts personalized SMS for every customer in your brand voice — no templates, no copy-paste.",
  },
  {
    title: "Knows your customers",
    body: "Scaleva tracks purchase history and spend so each message lands at the right moment.",
  },
  {
    title: "Hands-off autopilot",
    body: "Set your goals once. Scaleva schedules and sends follow-ups so you never lose a lead.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-xl font-bold text-brand-700">Scaleva</span>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
          AI-powered CRM for small businesses
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Personalized SMS outreach,
          <br />
          sent on autopilot.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Scaleva uses AI to write and send personalized text messages to your
          customers — re-engaging lapsed buyers, following up on leads, and
          driving repeat business while you run your shop.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Start free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-gray-50 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Scaleva. All rights reserved.
      </footer>
    </main>
  );
}
