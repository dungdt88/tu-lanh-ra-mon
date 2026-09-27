import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipe-form";
import { getCurrentUser } from "@/lib/auth";
import { getCongThuc } from "@/lib/repo/recipe";

export const metadata = { title: "Sửa công thức · Tủ Lạnh Ra Món" };

export default async function SuaCongThucPage({
  params,
}: PageProps<"/cong-thuc/[id]/sua">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/dang-nhap?next=/cong-thuc/${id}/sua`);

  const congThuc = await getCongThuc(id);
  if (!congThuc || congThuc.authorId !== user.id) notFound();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sửa công thức"
        subtitle={congThuc.name}
        backHref={`/cong-thuc/${id}`}
      />
      <div className="px-4">
        <RecipeForm
          congThuc={{
            id: congThuc.recipeId,
            name: congThuc.name,
            emoji: congThuc.emoji,
            summary: congThuc.summary,
            role: congThuc.role,
            slots: congThuc.slots,
            minutes: congThuc.minutes,
            servings: congThuc.servings,
            difficulty: congThuc.difficulty,
            core: congThuc.core,
            optional: congThuc.optional,
            extras: congThuc.extras,
            steps: congThuc.steps,
            tip: congThuc.tip,
            isPublic: congThuc.isPublic,
          }}
        />
      </div>
    </div>
  );
}
