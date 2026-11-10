import Link from "next/link";
import Hero from "@/components/home/Hero";
import MoodRail from "@/components/home/MoodRail";
import Reveal from "@/components/home/Reveal";
import { ATLAS } from "@/lib/catalog";

const STEPS = [
  {
    n: "01",
    title: "Read the mood",
    body: "Describe how you feel in your own words, or arm up to three emotional spectrums at once.",
    offset: "",
  },
  {
    n: "02",
    title: "Calibrate",
    body: "Dial in intensity, genre, language, runtime, rating and the kind of ending you can handle tonight.",
    offset: "md:translate-y-10",
  },
  {
    n: "03",
    title: "Receive transmissions",
    body: "Every film arrives with a compatibility score and a plain-language reason it was chosen for you.",
    offset: "md:translate-y-20",
  },
];

const SIGNALS = ["Mood fit", "Genre", "Plot relevance", "IMDb rating", "Runtime", "Release era"];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section aria-labelledby="how" className="mt-24 md:mt-40">
        <Reveal>
          <p className="hud mb-3">Sequence</p>
          <h2 id="how" className="display max-w-2xl text-3xl text-balance md:text-4xl">
            Three moves from a feeling to a film.
          </h2>
        </Reveal>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n} className={s.offset}>
              <Reveal delay={i * 0.12}>
                <div className="holo h-full p-6">
                  <span className="display text-5xl text-white/10">{s.n}</span>
                  <h3 className="display mt-4 text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dim">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="spectrums" className="mt-28 md:mt-48">
        <Reveal>
          <p className="hud mb-3">Spectrums</p>
          <h2 id="spectrums" className="display mb-10 max-w-2xl text-3xl text-balance md:text-4xl">
            Pick a portal. Step through.
          </h2>
        </Reveal>
        <MoodRail />
      </section>

      <section aria-labelledby="engine" className="mt-28 md:mt-44">
        <Reveal>
          <div className="holo grid gap-8 p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
            <div>
              <p className="hud mb-3">The engine</p>
              <h2 id="engine" className="display text-2xl text-balance md:text-3xl">
                Not a genre filter. A compatibility score.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-dim">
                No movie database knows how a film feels. CineMood pairs a hand-tagged atlas of{" "}
                {ATLAS.length} films with live metadata and full plots, then weighs six signals to rank
                what fits you right now.
              </p>
              <Link href="/mood" className="neon-btn mt-7">
                Start scanning
              </Link>
            </div>
            <ul className="grid grid-cols-2 content-center gap-x-6 gap-y-4">
              {SIGNALS.map((s, i) => (
                <li key={s} className="border-t border-line pt-3">
                  <span className="hud text-[var(--mood-a)]!">0{i + 1}</span>
                  <span className="mt-1 block text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
}
