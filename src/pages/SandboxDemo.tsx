import Routine from "./Routine";
import DuplicatePipelinePreview from "./DuplicatePipelinePreview";

/**
 * Demo 3: the integrated sandbox demonstration.
 *
 * The two production demos remain the source of truth. This page composes them
 * in their existing order so future integration work can be added here without
 * duplicating or changing either original demo.
 */
export default function SandboxDemo() {
  return (
    <main className="min-h-screen bg-white">
      <section aria-label="Demo 1: Routine">
        <Routine />
      </section>
      <section aria-label="Demo 2: Duplicate pipeline preview">
        <DuplicatePipelinePreview />
      </section>
    </main>
  );
}
