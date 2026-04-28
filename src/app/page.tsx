import { Activity, ArrowRight, BrainCircuit, FileHeart, ShieldCheck, Stethoscope } from "lucide-react";

const metrics = [
  { value: "98.4%", label: "Clinical summary accuracy" },
  { value: "< 45s", label: "Average note turnaround" },
  { value: "24/7", label: "Automated triage monitoring" },
];

const capabilities = [
  {
    title: "AI Clinical Documentation",
    description: "Transform consultations into structured notes, summaries, and coding suggestions in seconds.",
    icon: FileHeart,
  },
  {
    title: "Risk Intelligence",
    description: "Surface patient deterioration signals and operational bottlenecks before they escalate.",
    icon: BrainCircuit,
  },
  {
    title: "Security by Design",
    description: "Built for auditability, role-based access, and healthcare-grade deployment workflows.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_24%),radial-gradient(circle_at_80%_20%,_rgba(129,140,248,0.2),_transparent_22%),linear-gradient(180deg,_#020617_0%,_#020817_45%,_#01040d_100%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-20 pt-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <div className="rounded-full bg-cyan-400/15 p-2 text-cyan-300">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-medium tracking-wide">Genesis Clinical AI</span>
          </div>
          <div className="hidden items-center gap-3 text-sm text-slate-400 sm:flex">
            <span>FHIR-ready</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>HIPAA-aligned workflows</span>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              <Activity className="h-4 w-4" />
              Clinical intelligence for modern care teams
            </div>

            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Turn clinical data into decisions with a faster, safer AI workspace.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                A dark, enterprise-ready landing experience for documentation automation, patient risk review,
                and secure operational visibility across your clinical organization.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#platform"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Explore Platform
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#capabilities"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Capabilities
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <p className="text-3xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative" id="platform">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm text-cyan-300">Live Command Center</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Clinical Operations Overview</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    Systems nominal
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Active documentation queue</p>
                      <p className="text-lg font-semibold text-white">126 cases</p>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/5">
                      <div className="h-2 w-[72%] rounded-full bg-cyan-400" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-slate-400">Escalations prevented</p>
                      <p className="mt-3 text-3xl font-semibold text-white">34</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-slate-400">Time saved this week</p>
                      <p className="mt-3 text-3xl font-semibold text-white">218h</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <p className="text-sm text-cyan-100">AI Insight</p>
                    <p className="mt-2 text-sm leading-7 text-cyan-50/90">
                      Neurology and cardiology queues show the highest documentation burden. Suggested automation
                      workflows are ready for activation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="capabilities" className="grid gap-6 lg:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <article
                key={capability.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{capability.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{capability.description}</p>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
