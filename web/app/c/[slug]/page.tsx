import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import TopNav from "@/components/TopNav";
import CardDetail from "./CardDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const card = await convex.query(api.cards.getBySlug, { slug });
    if (!card) return { title: "Card not found — Flashborn" };
    const title = `${card.name} — Flashborn`;
    const description = `${card.rarity} ${card.role} · ${card.faction.replace(/_/g, " ")}. ${card.abilityText ?? ""}`.trim();
    const image = card.artworkUrl ?? undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : undefined,
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
    };
  } catch {
    return { title: "Flashborn" };
  }
}

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
