import { Suspense } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import { INDIAN_CITY_PRESETS } from '@/lib/data/environment';

function ClerkHeaderAuth() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="hidden sm:inline-flex rounded-xl border border-[#E4E1D8] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Sign In
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}

export default function HomePage() {
  const hasClerkKey = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-slate-900 selection:bg-teal-700/15 selection:text-teal-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#E4E1D8] bg-[#F7F6F2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white shadow-sm transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  SaansPlan
                </span>
                <span className="hidden sm:inline-block rounded-md border border-[#E4E1D8] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                  AIR DEFENSE COPILOT
                </span>
              </div>
              <p className="text-xs text-slate-600">
                GenAI Exposure & Impact Engine
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a href="#how-it-works" className="hover:text-teal-800 transition-colors">
              How It Works
            </a>
            <a href="#problem-vs-solution" className="hover:text-teal-800 transition-colors">
              Exposure vs AQI
            </a>
            <a href="#personas" className="hover:text-teal-800 transition-colors">
              Family Personas
            </a>
            <a href="#equity" className="hover:text-teal-800 transition-colors">
              DIY Equity Mode
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {hasClerkKey ? (
              <Suspense fallback={<div className="h-8 w-16" />}>
                <ClerkHeaderAuth />
              </Suspense>
            ) : null}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-900 transition-all hover:gap-2.5"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[#E4E1D8] bg-gradient-to-b from-white via-[#FBFBF8] to-[#F7F6F2] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1 text-xs font-semibold text-teal-900">
                <Sparkles className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>Deterministic Math + Grounded Public Health RAG</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.15]">
                City AQI is a Single Number.{' '}
                <span className="text-teal-800 underline decoration-teal-300 decoration-wavy decoration-2 underline-offset-4">
                  Your Family’s Exposure is Not.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
                During winter thermal inversion, an asthmatic grandmother at home, an 8-year-old child in an open school bus, and an office worker in an AC car breathe radically different doses of toxic PM2.5. SaansPlan turns city-wide smog into personalized micro-actions and a verified Impact Ledger.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-900 transition-all hover:scale-[1.02]"
                >
                  <span>Launch Family Air Defense Copilot</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E4E1D8] bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Activity className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>See How It Works</span>
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left border-t border-[#EFECE4]">
                <div className="rounded-xl border border-[#E4E1D8] bg-white p-3.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Core Engine
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-slate-900">
                    100% Deterministic
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Zero LLM math hallucination
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4E1D8] bg-white p-3.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Indoor Physics
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-slate-900">
                    Mass-Balance ODE
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    15-min CADR simulation
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4E1D8] bg-white p-3.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Clean Air Equity
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-amber-900">
                    ₹1,800 DIY Box
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    No expensive purifier needed
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4E1D8] bg-white p-3.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Health Guidance
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-emerald-800">
                    WHO + CPCB + ICMR
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Grounded with citations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Monitored Zones Strip */}
        <section className="border-b border-[#E4E1D8] bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pre-configured Monitoring Zones:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INDIAN_CITY_PRESETS.map((city) => (
                  <Link
                    key={city.id}
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E1D8] bg-[#FAF9F5] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-700 hover:bg-teal-50/50 transition-colors"
                  >
                    <span>{city.city}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-normal text-slate-500">{city.locality}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem vs Solution: Why Chatbots Fail */}
        <section id="problem-vs-solution" className="py-16 sm:py-20 border-b border-[#E4E1D8]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800">
                The Core Difference
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Why Standard AQI Apps & Chatbots Fail Families
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Most platforms display a single city-wide number and generic tips like &ldquo;Wear a mask.&rdquo; But air defense requires person-level biology, microenvironments, and quantified tradeoffs.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Typical Chatbot */}
              <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-900">
                  <span>Traditional &ldquo;AQI Chatbot&rdquo;</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  City-Level Ambient Proxy
                </h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>One Number for Everyone:</strong> Treats a toddler, an asthmatic grandmother, and an athlete as identical.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Generic Advice:</strong> &ldquo;Stay indoors and wear a mask&rdquo;—unhelpful for school buses and unavoidable commutes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Ignores Indoor Hazards:</strong> Blind to cooking fuel spikes (chulha/tadka) and road-facing window infiltration.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Zero Quantified Impact:</strong> Never tells you how much PM2.5 or inhaled dose you actually saved.</span>
                  </li>
                </ul>
              </div>

              {/* SaansPlan Engine */}
              <div className="rounded-2xl border border-teal-300 bg-teal-50/40 p-6 space-y-4 shadow-sm">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-800 px-3 py-1 text-xs font-bold text-white">
                  <span>SaansPlan Air Defense Copilot</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Person-Level Exposure & Impact Engine
                </h3>
                <ul className="space-y-3 text-sm text-slate-800">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-800 mt-0.5" />
                    <span><strong>Personal Exposure Score:</strong> Factored by activity breathing rate (0.42 to 1.95 m³/h) and physiological sensitivity (1.0 to 1.55x).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-800 mt-0.5" />
                    <span><strong>Agentic Daily Clean Air Plan:</strong> Shifts 6 AM walk to 2 PM sunlight trough, saving 38%+ exposure with zero effort.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-800 mt-0.5" />
                    <span><strong>Indoor What-If Simulator:</strong> Real-time mass-balance differential equation for CADR, room volume, and kitchen exhaust.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-800 mt-0.5" />
                    <span><strong>Quantified Impact Ledger:</strong> Records exact µg/m³ PM2.5 avoided, CO₂ saved, and streaks in Supabase Postgres.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works: The 4 Steps */}
        <section id="how-it-works" className="py-16 sm:py-20 border-b border-[#E4E1D8] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800">
                Architecture & Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                How SaansPlan Generates Your Daily Air Defense Plan
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#E4E1D8] bg-[#FAF9F5] p-5 space-y-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 font-mono text-sm font-bold text-white">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Household Digital Twin
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter home floor, road orientation, cooking fuel (PNG/biomass), and member vulnerability profiles in 60 seconds.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E4E1D8] bg-[#FAF9F5] p-5 space-y-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 font-mono text-sm font-bold text-white">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Telemetry & Inversion
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pulls live hourly PM2.5, wind speed, shallow boundary layer heights, and regional agricultural stubble fire data.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E4E1D8] bg-[#FAF9F5] p-5 space-y-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 font-mono text-sm font-bold text-white">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Exposure Verification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deterministic engine computes baseline doses, tests candidate routine shifts, and discards anything with negligible impact.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E4E1D8] bg-[#FAF9F5] p-5 space-y-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 font-mono text-sm font-bold text-white">
                  4
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Actionable Ledger
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Agent explains recommendations in EN, Hindi, or Hinglish with WHO citations; user clicks &ldquo;Done&rdquo; to log verified savings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Personas Section */}
        <section id="personas" className="py-16 sm:py-20 border-b border-[#E4E1D8]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800">
                Real-World Households
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Tailored for Diverse Urban & Low-Income Lives
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Persona 1 */}
              <div className="rounded-2xl border border-[#E4E1D8] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                    Sharma Family · 3BHK Flat (Rohini, Delhi)
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Standard Urban Setup
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Multi-generational household with working parents, two school-going kids, and an asthmatic 68-year-old grandmother.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3 text-xs">
                    <span className="font-bold text-slate-900">Kamla Devi (Dadi):</span>
                    <p className="text-slate-600 mt-0.5">Asthma sensitivity (1.55x) · Morning tea cooking & park walk pose 131 µg/m³ peak risk.</p>
                  </div>
                  <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3 text-xs">
                    <span className="font-bold text-slate-900">Aarav (8 yrs):</span>
                    <p className="text-slate-600 mt-0.5">Child minute ventilation · Morning open bus commute exposes lungs to on-road diesel exhaust.</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900"
                  >
                    <span>Load Sharma Family in Cockpit →</span>
                  </Link>
                </div>
              </div>

              {/* Persona 2 */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-900 px-3 py-1 text-xs font-bold text-white">
                    Meena Devi · JJ Cluster (Seemapuri, Delhi)
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    Clean Air Equity Mode
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Low-income informal settlement home with solid biomass/chulha cooking, road-facing entrance, and no budget for a ₹15,000 purifier.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-amber-200 bg-white p-3 text-xs">
                    <span className="font-bold text-slate-900">Indoor Chulha Spike:</span>
                    <p className="text-slate-600 mt-0.5">Cooking spikes PM2.5 above 300 µg/m³ without chimney · requires window cross-ventilation.</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-white p-3 text-xs">
                    <span className="font-bold text-slate-900">₹1,800 DIY Box Defense:</span>
                    <p className="text-slate-600 mt-0.5">Box fan + MERV-13 filter achieves ~220 m³/h CADR at 10% of commercial purifier cost.</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950"
                  >
                    <span>Load Meena Household in Cockpit →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Equity & DIY Playbook Showcase */}
        <section id="equity" className="py-16 sm:py-20 border-b border-[#E4E1D8] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Zero & Low-Cost Air Defense Playbook</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Clean Air Should Not Be a Luxury Good
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                Most air quality advice assumes everyone owns a high-end air purifier. SaansPlan puts equal engineering into free and low-cost physical hacks proven by EPA, IIT-Kanpur, and ICMR studies:
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-4 space-y-2">
                <span className="font-mono text-xs font-bold text-teal-800">1. CORS-ROSENTHAL BOX</span>
                <h3 className="text-sm font-bold text-slate-900">~₹1,800 DIY HEPA Alternative</h3>
                <p className="text-xs text-slate-600">A 20&quot; box fan taped to pleated MERV-13 filters delivers ~220 m³/h CADR, cutting indoor PM2.5 by 45–60%.</p>
              </div>

              <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-4 space-y-2">
                <span className="font-mono text-xs font-bold text-teal-800">2. DAMP TOWEL DOOR SEAL</span>
                <h3 className="text-sm font-bold text-slate-900">₹0 Smog Infiltration Cut</h3>
                <p className="text-xs text-slate-600">Rolling a damp cotton cloth along bottom entrance gaps reduces outside particle ingress by ~16%.</p>
              </div>

              <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-4 space-y-2">
                <span className="font-mono text-xs font-bold text-teal-800">3. WET MOPPING (POCHA)</span>
                <h3 className="text-sm font-bold text-slate-900">Zero Dust Resuspension</h3>
                <p className="text-xs text-slate-600">Dry brooming (jhadu) kicks settled toxic particles back into children’s breathing zone. Wet mopping locks them down.</p>
              </div>

              <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-4 space-y-2">
                <span className="font-mono text-xs font-bold text-teal-800">4. COMMUTE N95 FIT</span>
                <h3 className="text-sm font-bold text-slate-900">~₹50 Roadside Defense</h3>
                <p className="text-xs text-slate-600">A snug N95/FFP2 respirator with pinched nose clip filters ~82% of vehicle exhaust during two-wheeler and bus trips.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Launch Banner */}
        <section className="bg-teal-900 py-16 text-white text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Protect Your Family Today?
            </h2>
            <p className="text-base text-teal-100 max-w-2xl mx-auto leading-relaxed">
              Open the interactive dashboard, explore the 24-hour mass-balance simulator, and generate your customized clean air schedule in under a minute.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-teal-950 shadow-xl hover:bg-teal-50 transition-all hover:scale-105"
              >
                <span>Launch Family Air Defense Cockpit</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E4E1D8] bg-[#FAF9F5] py-8 text-xs text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-bold text-slate-900">SaansPlan</span> — Family Air Defense Copilot · Public GitHub Repository (&lt;10 MB)
          </div>
          <div className="flex flex-wrap gap-4 text-slate-500">
            <span>WHO 2021 Guidelines</span>
            <span>·</span>
            <span>CPCB GRAP Advisories</span>
            <span>·</span>
            <span>ICMR Guidance</span>
            <span>·</span>
            <span>Supabase + Clerk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
