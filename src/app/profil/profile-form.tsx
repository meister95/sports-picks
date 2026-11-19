"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useActionState, useRef, useState } from "react";
import { saveProfileAction, type ProfileState } from "./actions";
import { PasswordInput } from "@/components/password-input";
import { UserAvatar } from "@/components/user-avatar";
import { createClient } from "@/lib/supabase/client";

const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const cropSize = 256;

type CropImage = { url: string; image: HTMLImageElement; width: number; height: number };

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
  const [cropImage, setCropImage] = useState<CropImage | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, zoom: 1 });
  const [cropError, setCropError] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const cropArea = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);

  function cropBounds(image: CropImage, zoom: number) {
    const base = Math.max(cropSize / image.width, cropSize / image.height);
    return { width: image.width * base * zoom, height: image.height * base * zoom };
  }

  function clampCrop(image: CropImage, x: number, y: number, zoom: number) {
    const size = cropBounds(image, zoom);
    return { x: Math.min(0, Math.max(cropSize - size.width, x)), y: Math.min(0, Math.max(cropSize - size.height, y)) };
  }

  async function prepareAvatar(file: File) {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.src = url;
    try {
      await image.decode();
      const next = { url, image, width: image.naturalWidth, height: image.naturalHeight };
      const bounds = cropBounds(next, 1);
      setCropImage(next);
      setCrop({ x: (cropSize - bounds.width) / 2, y: (cropSize - bounds.height) / 2, zoom: 1 });
      setCropError("");
    } catch {
      URL.revokeObjectURL(url);
      setUploadError("Dieses Bild konnte nicht geöffnet werden. Bitte wähle ein anderes Foto.");
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (!allowedAvatarTypes.includes(file.type)) {
      setUploadError("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus.");
      return;
    }
    setUploadError("");
    await prepareAvatar(file);
  }

  function startCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!cropImage || !cropArea.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: crop.x, y: crop.y };
  }

  function moveCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!cropImage || !dragStart.current || !cropArea.current) return;
    const scale = cropSize / cropArea.current.getBoundingClientRect().width;
    const next = clampCrop(cropImage, dragStart.current.x + (event.clientX - dragStart.current.pointerX) * scale, dragStart.current.y + (event.clientY - dragStart.current.pointerY) * scale, crop.zoom);
    setCrop((current) => ({ ...current, ...next }));
  }

  async function saveCroppedAvatar() {
    if (!cropImage) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) { setCropError("Der Bildzuschnitt ist momentan nicht verfügbar."); return; }
    const bounds = cropBounds(cropImage, crop.zoom);
    const sourceScale = bounds.width / cropImage.width;
    const sourceX = -crop.x / sourceScale;
    const sourceY = -crop.y / sourceScale;
    const sourceSize = cropSize / sourceScale;
    context.drawImage(cropImage.image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);

    setUploading(true);
    setCropError("");
    setUploadError("");
    try {
      let quality = 0.9;
      let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      while (blob && blob.size > 1.8 * 1024 * 1024 && quality > 0.45) {
        quality -= 0.1;
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      }
      if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("compress");
      const supabase = createClient();
      if (!supabase) { setUploadError("Supabase ist noch nicht verbunden."); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploadError("Bitte melde dich erneut an."); return; }
      const path = `${user.id}/avatar`;
      const { error } = await supabase.storage.from("prediq-avatars").upload(path, blob, { cacheControl: "0", contentType: "image/jpeg", upsert: true });
      if (error) {
        setUploadError(error.message.includes("Bucket not found") ? "Der Profilbild-Speicher ist noch nicht eingerichtet." : "Das Bild konnte nicht hochgeladen werden. Bitte versuche es erneut.");
      } else {
        const previewUrl = URL.createObjectURL(blob);
        setAvatarPath(path);
        setAvatarUrl(previewUrl);
        setCropImage(null);
      }
    } catch {
      setCropError("Das Bild konnte nicht klein genug verarbeitet werden. Bitte wähle ein anderes Foto.");
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
      {cropImage && <div className="avatar-crop-backdrop" role="presentation">
        <section className="avatar-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
          <h2 id="avatar-crop-title">Profilbild zuschneiden</h2>
          <p>Verschiebe das Foto und passe den Ausschnitt mit dem Regler an.</p>
          <div ref={cropArea} className="avatar-crop-area" onPointerDown={startCropDrag} onPointerMove={moveCropDrag} onPointerUp={() => { dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }}>
            <img src={cropImage.url} alt="Foto zum Zuschneiden" draggable={false} style={{ width: cropBounds(cropImage, crop.zoom).width, height: cropBounds(cropImage, crop.zoom).height, left: crop.x, top: crop.y }} />
          </div>
          <label className="avatar-crop-zoom">Zoom<input type="range" min="1" max="3" step="0.01" value={crop.zoom} onChange={(event) => { const zoom = Number(event.target.value); const bounds = cropBounds(cropImage, crop.zoom); const centerX = (cropSize / 2 - crop.x) / bounds.width; const centerY = (cropSize / 2 - crop.y) / bounds.height; const nextBounds = cropBounds(cropImage, zoom); const next = clampCrop(cropImage, cropSize / 2 - centerX * nextBounds.width, cropSize / 2 - centerY * nextBounds.height, zoom); setCrop({ ...next, zoom }); }} /></label>
          {cropError && <p className="form-error" role="alert">{cropError}</p>}
          <div className="avatar-crop-actions"><button type="button" onClick={() => { URL.revokeObjectURL(cropImage.url); setCropImage(null); setCropError(""); }} disabled={uploading}>Abbrechen</button><button type="button" onClick={saveCroppedAvatar} disabled={uploading}>{uploading ? "Wird gespeichert …" : "Zuschnitt verwenden"}</button></div>
        </section>
      </div>}
      <input type="hidden" name="avatar_path" value={avatarPath} />
      <label>Öffentlicher Nutzername<input name="username" defaultValue={defaultValue} minLength={2} maxLength={24} autoComplete="nickname" required /></label>
      <span className="field-hint">Dieser Name wird neben deinen Kommentaren angezeigt.</span>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="auth-submit" disabled={pending || uploading}>{uploading ? "Bild wird hochgeladen …" : pending ? "Speichere …" : "Profil speichern"}</button>
    </form>
  );
}
