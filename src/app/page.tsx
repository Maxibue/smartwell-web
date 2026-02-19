
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle2, Star, ShieldCheck, HeartHandshake, Clock, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">

              {/* Left Column */}
              <div className="space-y-8 max-w-2xl relative z-10">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary shadow-sm hover:bg-primary/10 transition-colors">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                  SMARTWELL – Red de bienestar profesional en LATAM
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-secondary leading-[1.15]">
                  La conversación correcta puede <span className="text-primary relative inline-block">
                    cambiarlo todo.
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-text-secondary max-w-[540px] leading-relaxed">
                  Conectamos personas con profesionales de bienestar validados en Latinoamérica.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5" asChild>
                    <Link href="/comenzar">Buscar profesional</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl border-2 hover:bg-neutral-50" asChild>
                    <Link href="/para-profesionales">
                      Soy profesional <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="pt-8 flex flex-wrap gap-y-4 gap-x-8 text-sm font-medium text-text-secondary border-t border-neutral-100 mt-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Red profesional validada en Latinoamérica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Proceso de validación activo y continuo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <span>100% confidencial y seguro</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Image */}
              <div className="relative mx-auto w-full max-w-[480px] lg:max-w-[520px]">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-secondary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.01] duration-500">
                  <Image
                    src="/hero-modern.png"
                    alt="Bienestar y Mindfulness"
                    width={800}
                    height={800}
                    className="w-full h-auto object-cover bg-neutral-50"
                    priority
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features / How it works */}
        <section className="py-24 bg-neutral-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor" className="text-secondary">
              <circle cx="50" cy="50" r="40" />
            </svg>
          </div>

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">El proceso</span>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">Encontrar apoyo profesional es más simple de lo que pensás.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <HeartHandshake className="h-8 w-8 text-white" />,
                  title: "1. Elegí tu especialidad",
                  desc: "Explorá profesionales validados según lo que necesitás hoy.",
                  color: "bg-primary"
                },
                {
                  icon: <Star className="h-8 w-8 text-white" />,
                  title: "2. Agendá tu sesión",
                  desc: "Reservá en pocos pasos, de forma segura y confidencial.",
                  color: "bg-accent"
                },
                {
                  icon: <CheckCircle2 className="h-8 w-8 text-white" />,
                  title: "3. Iniciá tu proceso",
                  desc: "Conectate con el profesional adecuado y empezá tu acompañamiento.",
                  color: "bg-secondary"
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 group">
                  <div className={`inline-flex p-4 rounded-xl shadow-lg shadow-black/5 mb-6 ${feature.color} transform group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-3">{feature.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Especialidades — 4 grandes áreas, diseño monocromo */}
        <section className="py-16 bg-white">
          <div className="container px-4 md:px-6 mx-auto">

            <div className="max-w-2xl mb-10">
              <span className="text-accent font-semibold tracking-wider text-sm uppercase mb-2 block">Especialidades</span>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-2">Elegí el área que necesitás hoy.</h2>
              <p className="text-text-secondary text-lg">Explorá profesionales de bienestar validados en cada especialidad.</p>
            </div>

            {/* Grid 2×2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  emoji: "🧠",
                  area: "Salud Mental",
                  sub: "Psicología clínica, ansiedad, estrés y terapia de pareja.",
                  href: "/profesionales?area=salud-mental",
                },
                {
                  emoji: "🥗",
                  area: "Nutrición",
                  sub: "Nutrición deportiva y alimentación consciente.",
                  href: "/profesionales?area=nutricion",
                },
                {
                  emoji: "👶",
                  area: "Maternidad y Familia",
                  sub: "Lactancia, sueño infantil y acompañamiento familiar.",
                  href: "/profesionales?area=maternidad",
                },
                {
                  emoji: "🚀",
                  area: "Desarrollo y Carrera",
                  sub: "Coaching, liderazgo y desarrollo profesional.",
                  href: "/profesionales?area=desarrollo",
                },
              ].map((card) => (
                <Link
                  key={card.area}
                  href={card.href}
                  className="group flex flex-col justify-between p-7 bg-white border border-neutral-200 rounded-2xl hover:border-neutral-400 hover:shadow-lg transition-all duration-200"
                >
                  <div>
                    <span className="text-2xl mb-4 block">{card.emoji}</span>
                    <h3 className="text-xl font-bold text-secondary font-display mb-2">{card.area}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{card.sub}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-text-muted">Profesionales validados en LATAM · Online</span>
                    <span className="text-sm font-semibold text-secondary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Explorar <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-xl border-2 font-semibold group" asChild>
                <Link href="/profesionales">
                  Explorar todos los profesionales <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-secondary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 L100 0 L100 100 Z" fill="#2CBFAE" />
            </svg>
          </div>

          <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-6 leading-tight">
              Empezá tu camino de <br className="hidden md:block" /> bienestar hoy.
            </h2>
            <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light">
              Sin esperas, sin complicaciones. Conectá con profesionales que realmente te entienden.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary-active text-white border-0 text-lg px-8 h-14 rounded-full shadow-2xl shadow-primary/20 transform hover:scale-105 transition-all duration-300" asChild>
              <Link href="/comenzar">Buscar mi profesional</Link>
            </Button>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
