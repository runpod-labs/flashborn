import TopNav from "@/components/TopNav";
import CardDetail from "./CardDetail";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <TopNav />
      <main className="flex-1">
        <CardDetail slug={slug} />
      </main>
    </>
  );
}
