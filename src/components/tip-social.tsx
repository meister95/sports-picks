"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CommentRow = { id: string; body: string; user_id: string; created_at: string; username?: string };

export function TipSocial({ tipId }: { tipId: string }) {
  const [counts, setCounts] = useState({ like: 0, dislike: 0 });
  const [mine, setMine] = useState<string | null>(null);
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
    setCounts({ like: reactions?.filter((item) => item.reaction === "like").length ?? 0, dislike: reactions?.filter((item) => item.reaction === "dislike").length ?? 0 });
    setMine(reactions?.find((item) => item.user_id === user?.id)?.reaction ?? null);
    const ids = [...new Set((rows ?? []).map((row) => row.user_id))];
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : { data: [] };
    setComments((rows ?? []).map((row) => ({ ...row, username: profiles?.find((profile) => profile.id === row.user_id)?.username ?? "Freund" })));
    setLoading(false);
  }, [supabase, tipId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function react(value: "like" | "dislike") {
    if (!supabase) return;
    if (!userId) { setStatus("Bitte einloggen, um zu reagieren."); return; }
    setStatus("");
    const result = mine === value
      ? await supabase.from("tip_reactions").delete().eq("tip_id", tipId).eq("user_id", userId)
      : await supabase.from("tip_reactions").upsert({ tip_id: tipId, user_id: userId, reaction: value }, { onConflict: "tip_id,user_id" });
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

  return <section className="tip-social" aria-label="Reaktionen und Kommentare">
    <div className="reaction-row"><button type="button" className={mine === "like" ? "reaction active" : "reaction"} aria-pressed={mine === "like"} onClick={() => void react("like")}>♥ <span>Gefällt mir</span> {counts.like}</button><button type="button" className={mine === "dislike" ? "reaction active" : "reaction"} aria-pressed={mine === "dislike"} onClick={() => void react("dislike")}>− <span>Gefällt mir nicht</span> {counts.dislike}</button><span className="comment-count">{comments.length} Kommentare</span></div>
    {!loading && comments.length > 0 && <ul className="comment-list">{comments.map((item) => <li key={item.id}><strong>{item.username}</strong><span>{item.body}</span></li>)}</ul>}
    <form className="comment-form" onSubmit={comment}><input aria-label="Kommentar" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder={userId ? "Kommentar schreiben …" : "Zum Kommentieren einloggen"} disabled={!userId}/><button type="submit" disabled={!userId || !message.trim()}>Senden</button></form>
    {status && <p className="social-status" role="status">{status} {!userId && <a href="/login">Einloggen</a>}</p>}
  </section>;
}
