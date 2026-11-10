import type { Metadata } from "next";
import MoodSelector from "@/components/mood/MoodSelector";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Mood scan" };

export default function MoodPage() {
  return (
    <>
      <PageHeader
        step="Step 1 of 3 · Mood scan"
        title="How do you feel right now?"
        sub="Say it in your own words, or arm up to three spectrums in the orbit."
      />
      <MoodSelector />
    </>
  );
}
