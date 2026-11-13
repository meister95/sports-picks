"use client";

import { ChangeEvent, useActionState, useRef, useState } from "react";
import { saveProfileAction, type ProfileState } from "./actions";
import { PasswordInput } from "@/components/password-input";
import { UserAvatar } from "@/components/user-avatar";
import { createClient } from "@/lib/supabase/client";

const maxAvatarSize = 2 * 1024 * 1024;
const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];

export function ProfileForm({
  defaultValue = "",
  avatarPath: initialAvatarPath = "",
  avatarUrl: initialAvatarUrl = null,
  requirePassword = false,
}: {
  defaultValue?: string;
  avatarPath?: string;
  avatarUrl?: string | null;
  requirePassword?: boolean;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfileAction, {});
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (!allowedAvatarTypes.includes(file.type)) {
      setUploadError("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus.");
      return;
    }
    if (file.size > maxAvatarSize) {
      setUploadError("Das Bild darf höchstens 2 MB groß sein.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setUploadError("Supabase ist noch nicht verbunden.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUploadError("Bitte melde dich erneut an.");
        return;
      }

      const path = `${user.id}/avatar`;
      const { error } = await supabase.storage.from("prediq-avatars").upload(path, file, {
        cacheControl: "0",
        contentType: file.type,
        upsert: true,
      });
      if (error) {
        setUploadError(error.message.includes("Bucket not found")
          ? "Der Profilbild-Speicher ist noch nicht eingerichtet."
          : "Das Bild konnte nicht hochgeladen werden. Bitte versuche es erneut.");
      } else {
        setAvatarPath(path);
        setAvatarUrl(URL.createObjectURL(file));
      }
    } catch {
      setUploadError("Das Bild konnte nicht hochgeladen werden. Bitte prüfe deine Verbindung.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="auth-form">
      {requirePassword && <>
        <input type="hidden" name="invited" value="1" />
        <label>Passwort festlegen<PasswordInput name="password" minLength={8} autoComplete="new-password" required /></label>
      </>}
      <div className="profile-avatar-preview">
        <UserAvatar src={avatarUrl} name={defaultValue || "Profil"} className="profile-avatar-large" />
        <button className="profile-avatar-edit" type="button" aria-label="Profilbild ändern" title="Profilbild ändern" onClick={() => avatarInput.current?.click()} disabled={uploading}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14.5 5.5 4 4M4 20l4.2-.8L19 8.4a2.12 2.12 0 0 0-3-3L5.2 16.2 4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <input ref={avatarInput} id="profile-avatar" className="avatar-upload-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={uploading} aria-label="Profilbild auswählen" />
      {uploading && <p className="avatar-upload-status" role="status">Bild wird hochgeladen …</p>}
      {uploadError && <p className="form-error" role="alert">{uploadError}</p>}
      <input type="hidden" name="avatar_path" value={avatarPath} />
      <label>Öffentlicher Nutzername<input name="username" defaultValue={defaultValue} minLength={2} maxLength={24} autoComplete="nickname" required /></label>
      <span className="field-hint">Dieser Name wird neben deinen Kommentaren angezeigt.</span>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="auth-submit" disabled={pending || uploading}>{uploading ? "Bild wird hochgeladen …" : pending ? "Speichere …" : "Profil speichern"}</button>
    </form>
  );
}
