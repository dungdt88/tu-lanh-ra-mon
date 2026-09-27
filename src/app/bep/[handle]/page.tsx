import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/follow-button";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { ShareButton } from "@/components/share-button";
import { requireUser } from "@/lib/auth";
import { getBepByHandle, getFeed } from "@/lib/repo/feed";

export async function generateMetadata({ params }: PageProps<"/bep/[handle]">) {
  const { handle } = await params;
  const bep = await getBepByHandle(handle, null);

  if (!bep) return { title: "Không tìm thấy bếp" };

  const title = `Bếp ${bep.name} · Tủ Lạnh Ra Món`;
  const description = bep.bio ?? `${bep.postCount} món đã khoe.`;

  return { title, description, openGraph: { title, description } };
}

export default async function BepPage({ params }: PageProps<"/bep/[handle]">) {
  const { handle } = await params;
  const user = await requireUser(`/bep/${handle}`);

  const bep = await getBepByHandle(handle, user.id);
  if (!bep) notFound();

  const posts = await getFeed({
    authorId: bep.id,
    viewerId: user.id,
    limit: 30,
  });

  const from = `/bep/${handle}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title={bep.name}
        subtitle={`@${bep.handle}`}
        backHref="/cong-dong"
        action={
          <ShareButton
            path={from}
            title={`Bếp ${bep.name} · Tủ Lạnh Ra Món`}
            label=""
            variant="ghost"
          />
        }
      />

      <div className="space-y-4 px-4">
        <div className="flex items-center gap-3">
          <span className="bg-accent flex size-14 shrink-0 items-center justify-center rounded-full text-xl">
            {bep.name.slice(0, 1).toUpperCase()}
          </span>
          <dl className="text-muted-foreground flex flex-1 justify-around text-center text-xs">
            {[
              { label: "món", value: bep.postCount },
              { label: "người theo dõi", value: bep.followerCount },
              { label: "đang theo dõi", value: bep.followingCount },
            ].map((item) => (
              <div key={item.label}>
                <dd className="text-foreground text-base font-semibold">
                  {item.value}
                </dd>
                <dt>{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {bep.bio && <p className="text-sm">{bep.bio}</p>}

        {bep.isMe ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/ho-so">
              <Pencil className="size-4" /> Sửa hồ sơ
            </Link>
          </Button>
        ) : (
          <FollowButton
            targetId={bep.id}
            following={bep.followedByMe}
            from={from}
          />
        )}

        {posts.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            Bếp này chưa khoe món nào.
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} from={from} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
