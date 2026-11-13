"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/user-avatar";

type CommentRow = { id: string; body: string; user_id: string; created_at: string; username?: string; avatarUrl?: string | null };
type ProfileRow = { id: string; username: string | null; avatar_path: string | null };

export function TipSocial({ tipId, isOwner = false }: { tipId: string; isOwner?: boolean }) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const [{ data: { user } }, { data: reactions }, { data: rows }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("tip_reactions").select("reaction,user_id").eq("tip_id", tipId),
      supabase.from("tip_comments").select("id,body,user_id,created_at").eq("tip_id", tipId).order("created_at", { ascending: true }),
    ]);
    setUserId(user?.id ?? null);
    setLikeCount(reactions?.filter((item) => item.reaction === "like").length ?? 0);
    setLiked(reactions?.some((item) => item.user_id === user?.id && item.reaction === "like") ?? false);
    const ids = [...new Set((rows ?? []).map((row) => row.user_id))];
    let profiles: ProfileRow[] = [];
    if (ids.length) {
      const profileResult = await supabase.from("profiles").select("id,username,avatar_path").in("id", ids);
      if (profileResult.error?.code === "42703" || profileResult.error?.code === "PGRST204") {
        const fallback = await supabase.from("profiles").select("id,username").in("id", ids);
        profiles = (fallback.data ?? []).map((profile) => ({ ...profile, avatar_path: null }));
      } else {
        profiles = (profileResult.data ?? []) as ProfileRow[];
      }
    }
    const avatarPaths = profiles.flatMap((profile) => profile.avatar_path ? [profile.avatar_path] : []);
    const { data: signedAvatars } = avatarPaths.length
      ? await supabase.storage.from("prediq-avatars").createSignedUrls(avatarPaths, 86400)
      : { data: [] };
    const avatarUrls = new Map((signedAvatars ?? []).map((avatar) => [avatar.path, avatar.signedUrl]));
    setComments((rows ?? []).map((row) => {
      const profile = profiles?.find((item) => item.id === row.user_id);
      const avatarPath = profile?.avatar_path;
      const avatarUrl = avatarPath ? avatarUrls.get(avatarPath) ?? null : null;
      return { ...row, username: profile?.username ?? "Freund", avatarUrl };
    }));
    setLoading(false);
  }, [supabase, tipId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function react() {
    if (!supabase) return;
    if (!userId) { setStatus("Bitte einloggen, um zu reagieren."); return; }
    setStatus("");
    const result = liked
      ? await supabase.from("tip_reactions").delete().eq("tip_id", tipId).eq("user_id", userId)
      : await supabase.from("tip_reactions").upsert({ tip_id: tipId, user_id: userId, reaction: "like" }, { onConflict: "tip_id,user_id" });
    if (result.error) setStatus("Reaktion konnte nicht gespeichert werden.");
    else await refresh();
  }

  async function comment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    if (!userId) { setStatus("Bitte einloggen, um zu kommentieren."); return; }
    const body = message.trim();
    if (!body || body.length > 1000) { setStatus("Kommentar muss zwischen 1 und 1000 Zeichen lang sein."); return; }
    const { error } = await supabase.from("tip_comments").insert({ tip_id: tipId, user_id: userId, body });
    if (error) setStatus("Kommentar konnte nicht gespeichert werden.");
    else { setMessage(""); setStatus(""); await refresh(); }
  }

  async function deleteComment(commentId: string) {
    if (!supabase || !userId) { setStatus("Bitte einloggen, um Kommentare zu verwalten."); return; }
    if (!window.confirm("Möchtest du diesen Kommentar endgültig löschen?")) return;
    setStatus("");
    const { error } = await supabase.from("tip_comments").delete().eq("id", commentId).eq("tip_id", tipId);
    if (error) setStatus("Kommentar konnte nicht gelöscht werden.");
    else { setStatus(""); await refresh(); }
  }

  return <section className="tip-social" aria-label="Reaktionen und Kommentare">
    <div className="reaction-row"><button type="button" className={liked ? "reaction active" : "reaction"} aria-pressed={liked} onClick={() => void react()}>♥ <span>Gefällt mir</span> {likeCount}</button><span className="comment-count">{comments.length} Kommentare</span></div>
    {!loading && comments.length > 0 && <ul className="comment-list">{comments.map((item) => <li key={item.id}><UserAvatar src={item.avatarUrl} name={item.username ?? "Freund"} className="comment-avatar"/><div className="comment-content"><strong>{item.username}</strong><span>{item.body}</span>{(isOwner || item.user_id === userId) && <button className="comment-delete" type="button" onClick={() => void deleteComment(item.id)}>Löschen</button>}</div></li>)}</ul>}
    <form className="comment-form" onSubmit={comment}><input aria-label="Kommentar" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder={userId ? "Kommentar schreiben …" : "Zum Kommentieren einloggen"} disabled={!userId}/><button type="submit" disabled={!userId || !message.trim()}>Senden</button></form>
    {status && <p className="social-status" role="status">{status} {!userId && <a href="/login">Einloggen</a>}</p>}
  </section>;
}
