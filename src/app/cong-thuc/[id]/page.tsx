import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipe-detail";
import { requireUser } from "@/lib/auth";
import { getCongThuc } from "@/lib/repo/recipe";

export async function generateMetadata({
  params,
}: PageProps<"/cong-thuc/[id]">) {
  const { id } = await params;
  const congThuc = await getCongThuc(id);
  return {
    title: congThuc
      ? `${congThuc.name} · Tủ Lạnh Ra Món`
      : "Không tìm thấy công thức",
    description: congThuc?.summary,
  };
}

export default async function CongThucChiTietPage({
  params,
}: PageProps<"/cong-thuc/[id]">) {
  const { id } = await params;

  // RLS lo phần quyền: công thức để riêng thì chỉ chủ nhà đọc được, người khác
  // nhận null và rơi vào notFound.
  const user = await requireUser(`/cong-thuc/${id}`);

  const congThuc = await getCongThuc(id);
  if (!congThuc) notFound();

  return (
    <RecipeDetail congThuc={congThuc} cuaToi={user.id === congThuc.authorId} />
  );
}
