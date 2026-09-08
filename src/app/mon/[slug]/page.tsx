import { notFound } from "next/navigation";
import { DISHES, getDishBySlug } from "@/data/dishes";
import { DishDetail } from "@/components/dish-detail";

export function generateStaticParams() {
  return DISHES.map((dish) => ({ slug: dish.slug }));
}

export async function generateMetadata({ params }: PageProps<"/mon/[slug]">) {
  const { slug } = await params;
  const dish = getDishBySlug(slug);
  return {
    title: dish ? `${dish.name} · Tủ Lạnh Ra Món` : "Không tìm thấy món",
    description: dish?.summary,
  };
}

export default async function DishPage({ params }: PageProps<"/mon/[slug]">) {
  const { slug } = await params;
  const dish = getDishBySlug(slug);
  if (!dish) notFound();

  return <DishDetail dish={dish} />;
}
