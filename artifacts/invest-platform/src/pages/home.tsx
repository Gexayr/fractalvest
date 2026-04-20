import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Building2, LineChart, ShieldCheck, Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-20 border-b border-border flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm">FV</div>
          FractionalVest
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Start Investing</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl lg:text-7xl font-bold tracking-tighter leading-[1.1]"
            >
              Own a piece of <span className="text-primary">trophy real estate.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl leading-relaxed"
            >
              Access institutional-grade real estate investments for a fraction of the cost. Build a diversified portfolio of premium properties.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg">
                  View Properties <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
          <div className="flex-1 relative">
            <div className="aspect-[4/3] rounded-sm bg-card border border-border relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600" 
                alt="Luxury real estate"
                className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-background/90 backdrop-blur border border-border p-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold">124 Luxury Condos</h3>
                    <p className="text-muted-foreground">Miami, FL</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary font-mono mb-1">Expected Yield</div>
                    <div className="text-2xl font-bold text-chart-1">12.4%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card border-y border-border px-6 lg:px-12">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold">Institutional access, retail simplicity.</h2>
              <p className="text-muted-foreground">We've broken down the barriers to premium real estate investing.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Building2, title: "Curated Assets", desc: "Every property is vetted by our institutional investment committee." },
                { icon: LineChart, title: "Daily Liquidity", desc: "Trade shares on our secondary market with immediate execution." },
                { icon: Wallet, title: "Passive Income", desc: "Receive quarterly dividend distributions directly to your wallet." }
              ].map((f, i) => (
                <div key={i} className="p-6 border border-border bg-background relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 lg:px-12 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold tracking-tight text-primary">
            <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-mono text-[10px]">FV</div>
            FractionalVest
          </div>
          <p className="text-sm text-muted-foreground">© 2025 FractionalVest Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}