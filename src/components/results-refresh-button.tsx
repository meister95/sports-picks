"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CheckResponse = { checked?: number; settled?: number; unavailable?: number; deferredTips?: number; deferredGroups?: number; status?: "success" | "partial" | "failed"; error?: string };
type CheckStatus = { checked_at: string; status: "success" | "partial" | "failed"; checked_count: number; settled_count: number; unavailable_count: number; deferred_count: number };

export function ResultsRefreshButton({ checkStatus }: { checkStatus: CheckStatus | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function checkNow() {
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/results", { method: "POST" });
        const result = await response.json() as CheckResponse;
        if (!response.ok) {
          setMessage(result.error ?? "Die Ergebnisabfrage ist fehlgeschlagen.");
          router.refresh();
          return;
        }
        setMessage(result.status === "partial"
          ? `${result.settled} Ergebnis${result.settled === 1 ? "" : "se"} aktualisiert. Einige Spieldaten fehlen noch und werden erneut geprüft.`
          : `${result.settled} Ergebnis${result.settled === 1 ? "" : "se"} aktualisiert · ${result.checked} Tipps geprüft.`);
        router.refresh();
      } catch {
        setMessage("Die Ergebnisabfrage konnte gerade nicht erreicht werden.");
      }
    });
  }

  const checkedAt = checkStatus?.checked_at
    ? new Intl.DateTimeFormat("de-AT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Vienna" }).format(new Date(checkStatus.checked_at))
    : null;
  const statusText = !checkStatus ? "Noch keine automatische Ergebnisprüfung gespeichert."
    : checkStatus.status === "failed" ? "Ergebnisdaten gerade nicht erreichbar. Offene Tipps werden später erneut geprüft."
      : checkStatus.status === "partial" ? `${checkStatus.unavailable_count + checkStatus.deferred_count} Spieldaten noch offen; sie werden erneut geprüft.`
        : checkStatus.checked_count === 0 ? "Keine offenen Tipps zum Prüfen."
          : `${checkStatus.settled_count} Ergebnis${checkStatus.settled_count === 1 ? "" : "se"} aktualisiert · ${checkStatus.checked_count} Tipps geprüft.`;

  return <div className="results-refresh-control">
    <div className={`results-check-status results-check-${checkStatus?.status ?? "idle"}`} aria-live="polite">
      <strong>{checkedAt ? `Letzte Prüfung: ${checkedAt}` : "Ergebnisprüfung"}</strong>
      <span>{statusText}</span>
    </div>
    <button className="results-refresh-button" type="button" onClick={checkNow} disabled={pending}>
      {pending ? "Ergebnisse werden geprüft …" : "Ergebnisse jetzt abrufen"}
    </button>
    {message && <p role="status">{message}</p>}
  </div>;
}
