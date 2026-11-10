import type { Metadata } from "next";
import Results from "@/components/results/Results";

export const metadata: Metadata = { title: "Your transmissions" };

export default function ResultsPage() {
  return <Results />;
}
