import type { Metadata } from "next";
import Calibrator from "@/components/calibrate/Calibrator";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Calibrate" };

export default function CalibratePage() {
  return (
    <>
      <PageHeader
        step="Step 2 of 3 · Calibration"
        title="Tune the signal."
        sub="Every dial is optional. Leave them open for range, tighten them for precision."
      />
      <Calibrator />
    </>
  );
}
