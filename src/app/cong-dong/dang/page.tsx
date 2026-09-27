import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PostComposer } from "@/components/post-composer";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Khoe món · Tủ Lạnh Ra Món" };

export default async function DangBaiPage({
  searchParams,
}: PageProps<"/cong-dong/dang">) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/cong-dong/dang");

  const { mon } = await searchParams;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Khoe món"
        subtitle="Mâm cơm hôm nay của nhà mình"
        backHref="/cong-dong"
      />
      <div className="px-4">
        <PostComposer monBanDau={typeof mon === "string" ? mon : undefined} />
      </div>
    </div>
  );
}
