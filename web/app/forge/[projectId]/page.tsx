import type { Id } from "@/convex/_generated/dataModel";
import TopNav from "@/components/TopNav";
import ForgeGate from "@/components/ForgeGate";
import ForgePipeline from "@/components/ForgePipeline";

// Server component: `params` is a Promise in Next 16 and must be awaited.
export default async function ForgeProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <>
      <TopNav />
      <ForgeGate>
        <ForgePipeline projectId={projectId as Id<"generationProjects">} />
      </ForgeGate>
    </>
  );
}
