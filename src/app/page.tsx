import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, PieChart, Zap, Globe, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-down">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">SplitWise Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors duration-200">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors duration-200">How it works</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex btn-press">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="btn-press">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">

          {/* Background image: bg.jpeg on large screens, bg1.jpeg on small screens */}
          <div
            className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/bg.jpeg')" }}
          />
          <div
            className="absolute inset-0 block md:hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/bg1.jpeg')" }}
          />

          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-black/52" />

          {/* Subtle grid texture on top */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px]" />

          {/* Content */}
          <div className="container mx-auto px-4 relative z-10 text-center py-24 md:py-32">
            <div className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-sm font-semibold mb-6 text-white/80 bg-white/10 backdrop-blur animate-slide-down">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
              The smartest way to split expenses
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-tight text-white animate-slide-up delay-150">
              Share expenses without{" "}
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                ruining friendships.
              </span>
            </h1>

            <p className="text-xl text-white/75 mb-10 max-w-2xl mx-auto animate-slide-up delay-300">
              SplitWise Pro automatically calculates who owes what. From weekend trips to shared
              apartments, keep track of shared expenses in real-time.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up delay-500">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base group btn-press"
                >
                  Start Splitting Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 text-base border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur btn-press"
                >
                  See Features
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need to manage group expenses
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We handle the complex math so you can focus on the fun parts of your trips and events.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-background p-6 rounded-2xl shadow-sm border card-hover animate-slide-up delay-100">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Split Engine</h3>
                <p className="text-muted-foreground">
                  Our greedy algorithm automatically simplifies debts, matching top creditors with
                  debtors to minimize the number of transactions needed.
                </p>
              </div>

              <div className="bg-background p-6 rounded-2xl shadow-sm border card-hover animate-slide-up delay-200">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Sync</h3>
                <p className="text-muted-foreground">
                  Powered by WebSockets, see new expenses and settlements instantly across all your
                  devices without refreshing the page.
                </p>
              </div>

              <div className="bg-background p-6 rounded-2xl shadow-sm border card-hover animate-slide-up delay-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
                <p className="text-muted-foreground">
                  End-to-end encrypted sessions, role-based team management, and secure password
                  handling keep your financial data safe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
              <div className="flex-1 space-y-8 animate-slide-up">
                <h2 className="text-3xl md:text-4xl font-bold">How to settle up</h2>

                <div className="space-y-6">
                  {[
                    { n: "1", title: "Create a team", desc: "Start a new group and share the invite code with your friends or colleagues." },
                    { n: "2", title: "Add expenses",  desc: "Anyone can add an expense. Tell us who paid and how much." },
                    { n: "3", title: "Settle debts",  desc: "Review the calculated balances and mark payments as settled in one click." },
                  ].map(({ n, title, desc }, i) => (
                    <div
                      key={n}
                      className={`flex gap-4 animate-slide-in-right delay-${(i + 1) * 200}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold transition-transform duration-200 hover:scale-110">
                        {n}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-1">{title}</h4>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full relative animate-slide-in-right delay-300">
                <div className="bg-muted rounded-2xl p-8 border shadow-xl relative z-10 card-hover">
                  <div className="space-y-4">
                    {[
                      { letter: "A", name: "Arjun gets back", sub: "from 2 people", amount: "₹1500", color: "blue", sign: "+" },
                      { letter: "K", name: "Karthik owes",    sub: "to Arjun",     amount: "₹500",  color: "red",  sign: "-" },
                      { letter: "S", name: "Sanjay owes",     sub: "to Arjun",     amount: "₹1000", color: "red",  sign: "-" },
                    ].map(({ letter, name, sub, amount, color, sign }, i) => (
                      <div
                        key={letter}
                        className={`flex items-center justify-between p-4 bg-background rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-slide-up delay-${(i + 1) * 200}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full bg-${color}-100 flex items-center justify-center text-${color}-600 font-bold`}>
                            {letter}
                          </div>
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-muted-foreground">{sub}</p>
                          </div>
                        </div>
                        <div className={`${color === "blue" ? "text-emerald-500" : "text-red-500"} font-bold text-lg`}>
                          {amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-blue-600 opacity-20 blur-2xl -z-10 rounded-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-20 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4 max-w-3xl animate-slide-up">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to stop arguing over bills?</h2>
            <p className="text-primary-foreground/80 text-xl mb-10">
              Join thousands of users who manage their group expenses effortlessly.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-10 text-lg rounded-full shadow-2xl btn-press"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-12 bg-muted/20 animate-fade-in">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">SplitWise Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 SplitWise Pro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
