"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { capNhatHoSo, type ActionState } from "@/lib/actions/post";
import type { PublicProfile } from "@/lib/supabase/database.types";

const TRONG: ActionState = {};

export function ProfileForm({ profile }: { profile: PublicProfile | null }) {
  const [state, action, pending] = React.useActionState(capNhatHoSo, TRONG);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiện trên bài đăng</Label>
        <Input
          id="displayName"
          name="displayName"
          maxLength={60}
          defaultValue={profile?.display_name ?? ""}
          placeholder="Mẹ Bin"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="handle">Tên bếp (trong đường dẫn)</Label>
        <Input
          id="handle"
          name="handle"
          required
          maxLength={24}
          defaultValue={profile?.handle ?? ""}
          placeholder="bep-me-bin"
        />
        <p className="text-muted-foreground text-xs">
          Bếp của bạn sẽ ở /bep/<span className="font-medium">tên-này</span>.
          Chữ thường, số và dấu gạch ngang.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Giới thiệu</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          defaultValue={profile?.bio ?? ""}
          placeholder="Nhà 4 người, nấu nhanh, ít dầu mỡ."
        />
      </div>

      {state.error && (
        <p className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Lưu
      </Button>
    </form>
  );
}
