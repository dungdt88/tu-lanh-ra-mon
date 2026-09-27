import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipe-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Viết công thức · Tủ Lạnh Ra Món" };

export default async function CongThucMoiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/cong-thuc/moi");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Viết công thức"
        subtitle="Món tủ của nhà mình"
        backHref="/cong-thuc"
      />
      <div className="px-4">
        <RecipeForm />
      </div>
    </div>
  );
}
