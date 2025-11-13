"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Wallet,
  BarChart3,
  CheckCircle2,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const socialProof = [
  "apple.com",
  "netflix.com",
  "spotify.com",
  "shopify.com",
  "adobe.com",
  "oracle.com",
];

const features = [
  {
    title: "Track All Your Subscriptions",
    description:
      "Keep all your subscriptions in one place. Add services manually with details like billing cycle, amount, and renewal dates.",
    icon: Wallet,
  },
  {
    title: "Never Miss a Renewal",
    description:
      "Get reminders before your subscriptions renew. See upcoming billing dates at a glance so you're never surprised by charges.",
    icon: Clock,
  },
  {
    title: "Understand Your Spending",
    description:
      "View your monthly and yearly spending at a glance. Break down costs by category to see where your money goes.",
    icon: BarChart3,
  },
];

const workflow = [
  {
    title: "Add your subscriptions",
    description:
      "Quickly add your subscriptions with name, amount, billing cycle, and next billing date. Organize them by category for better tracking.",
  },
  {
    title: "Monitor your spending",
    description:
      "See your total monthly and yearly spending in one dashboard. Track active subscriptions and view upcoming billing dates.",
  },
  {
    title: "Get renewal reminders",
    description:
      "Receive alerts before subscriptions renew. Stay on top of upcoming bills and never forget to cancel unused services.",
  },
];

const testimonials = [
  {
    quote:
      "Krodit helped me realize I was spending $200/month on subscriptions I forgot about. Cancelled three services in the first week.",
    name: "Sarah Chen",
    role: "Freelance Designer",
  },
  {
    quote:
      "Finally, a simple way to track all my subscriptions. The renewal reminders are a lifesaver - no more surprise charges.",
    name: "Michael Torres",
    role: "Software Developer",
  },
];

const planHighlights = [
  "Track subscription up to 3",
  "Renewal reminders & alerts",
  "Monthly & yearly spending overview",
  "Category-based organization",
];

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-x-0 top-[-120px] -z-10 flex justify-center overflow-hidden">
        <div className="h-[620px] w-[1200px] rounded-full bg-gradient-to-br from-primary/30 via-primary/5 to-transparent blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 lg:px-12">
        <Link href="/" className="flex items-center gap-0.9 text-2xl font-bold">
          <Image
            src="/file.svg"
            alt="Krodit Logo"
            width={72}
            height={72}
            className="h-20 w-20"
            priority
          />
          <span>Krodit</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground">
            How it works
          </Link>
          <Link href="#pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="#testimonials" className="hover:text-foreground">
            Stories
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Button asChild>
            <Link href="/sign-up" className="flex items-center gap-2">
              Start for free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-24 pt-12 lg:px-12 lg:pt-20">
        {/* Hero */}
        <section className="grid items-center gap-16 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-primary/10 text-primary">
              Simple subscription management
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Take control of your subscriptions.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Track all your subscriptions in one place. Never miss a renewal date and understand exactly where your money goes each month.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up" className="flex items-center gap-2">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Free to start
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="grid size-9 place-items-center rounded-full border border-border/90 bg-muted text-sm font-medium text-foreground"
                  >
                    {(item + 1) * 2}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground">Users track an average of</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">12+ subscriptions</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-2xl" />
            <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly spending</p>
                  <p className="text-2xl font-semibold">$127.50</p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  $1,530/year
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active subscriptions</p>
                  <p className="mt-2 text-xl font-semibold">8</p>
                  <p className="text-xs text-muted-foreground">3 upcoming renewals</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top category</p>
                  <p className="mt-2 text-xl font-semibold">Entertainment</p>
                  <p className="text-xs text-muted-foreground">$45/month</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-5 text-sm">
                <p className="text-sm font-semibold text-foreground">Upcoming Renewals</p>
                <div className="mt-4 space-y-3">
                  {[
                    { vendor: "Netflix", amount: "$15.99", days: "in 3 days" },
                    { vendor: "Spotify", amount: "$9.99", days: "in 7 days" },
                    { vendor: "Adobe Creative Cloud", amount: "$52.99", days: "in 12 days" },
                  ].map((item) => (
                    <div key={item.vendor} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">{item.vendor}</p>
                        <p className="text-xs text-muted-foreground">{item.amount}</p>
                      </div>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {item.days}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Track subscriptions from</p>
          <div className="flex flex-wrap items-center gap-8 opacity-70">
            {socialProof.map((brand) => (
              <div key={brand} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide">
                <span className="size-1 rounded-full bg-primary/50" />
                {brand}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-secondary text-secondary-foreground">Why choose Krodit</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple subscription management for everyone.</h2>
            <p className="text-base text-muted-foreground">
              Stop losing track of your subscriptions. Krodit helps you see all your recurring charges in one place, 
              get reminders before renewals, and understand your spending at a glance.
            </p>
            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Your data, your control</p>
                  <p className="text-sm text-muted-foreground">
                    All your subscription data is stored securely. Simple, private, and always accessible.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm">
                <CheckCircle2 className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Easy to use</p>
                  <p className="text-sm text-muted-foreground">
                    Add subscriptions in seconds. Clean interface that makes tracking your spending effortless.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group relative flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg transition hover:shadow-xl"
              >
                <div className="grid size-12 place-items-center rounded-2xl border border-border/80 bg-primary/10 text-primary transition duration-200 group-hover:bg-primary/15">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="size-4" />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/5 via-background to-background p-10 shadow-xl"
        >
          <div className="absolute -left-16 top-20 hidden h-48 w-48 rounded-full bg-primary/20 blur-3xl lg:block" />
          <div className="absolute -right-20 -top-10 hidden h-56 w-56 rounded-full bg-primary/30 blur-3xl lg:block" />
          <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-5">
              <Badge className="w-fit bg-primary text-primary-foreground">How it works</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Get started in minutes.</h2>
              <p className="text-base text-muted-foreground">
                Krodit is designed to be simple. Add your subscriptions, set billing dates, and start tracking your spending right away.
              </p>
              <div className="grid gap-6">
                {workflow.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex flex-col justify-center gap-6 rounded-3xl border border-border/80 bg-background/90 p-8 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Upcoming renewals</p>
                <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Reminders enabled
                </span>
              </div>
              <div className="space-y-4">
                {["Netflix", "Spotify", "Adobe"].map((vendor, idx) => (
                  <div key={vendor} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold">
                        {vendor[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{vendor}</p>
                        <p className="text-xs text-muted-foreground">Renewal in {idx === 0 ? "3 days" : idx === 1 ? "7 days" : "12 days"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-primary">
                      ${idx === 0 ? "15.99" : idx === 1 ? "9.99" : "52.99"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-primary/10 p-4 text-primary">
                <p className="text-sm font-semibold">✅ Never miss a renewal</p>
                <p className="text-xs text-primary/80">
                  Get notified before your subscriptions renew so you can cancel or adjust as needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Badge className="w-fit bg-primary/10 text-primary">Customer stories</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Users love Krodit for its simplicity.
            </h2>
            <p className="text-base text-muted-foreground">
              People use Krodit to take control of their subscriptions and understand their spending without the complexity.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {[...Array(5)].map((_, idx) => (
                <Star key={idx} className="size-4 fill-primary text-primary" />
              ))}
              Simple and effective
            </div>
          </div>
          <div className="grid gap-5">
            {testimonials.map((testimonial) => (
              <blockquote key={testimonial.name} className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-lg">
                <p className="text-base font-medium leading-relaxed text-foreground">“{testimonial.quote}”</p>
                <footer className="mt-4 text-sm font-semibold">
                  {testimonial.name}
                  <span className="block text-xs font-normal text-muted-foreground">{testimonial.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section id="pricing" className="grid gap-8 rounded-3xl border border-border/80 bg-card/70 p-10 shadow-xl lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-5">
            <Badge className="w-fit bg-secondary text-secondary-foreground">Pricing</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start free, upgrade when you need more.</h2>
            <p className="text-base text-muted-foreground">
              Get started with Krodit for free. Upgrade to premium for unlimited subscriptions and advanced features when you're ready.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Free plan available
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-background/90 p-6 shadow-lg backdrop-blur">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold">Free</span>
              <span className="text-sm text-muted-foreground">to start</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your subscriptions, view spending, and get renewal reminders. Upgrade for unlimited subscriptions.
            </p>
            <ul className="grid gap-3 text-sm">
              {planHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 size-4 text-primary" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild>
              <Link href="/sign-up" className="flex items-center gap-2">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-primary via-primary/90 to-primary p-10 text-primary-foreground shadow-2xl">
          <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl font-semibold sm:text-4xl">Take control of your subscriptions today.</h2>
              <p className="text-base text-primary-foreground/80">
                Start tracking your subscriptions for free. No credit card required.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/sign-up" className="flex items-center gap-2">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/20 hover:text-white" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12 pt-6 text-sm text-muted-foreground lg:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-0.5 text-base font-semibold text-foreground">
            <Image
              src="/file.svg"
              alt="Krodit Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <span>Krodit</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide">
            <Link href="#features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-foreground">
              Workflow
            </Link>
            <Link href="#pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/sign-up" className="hover:text-foreground">
              Get started
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground/80 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Krodit. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="mailto:hello@krodit.app" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


