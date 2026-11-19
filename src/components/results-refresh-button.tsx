"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CheckResponse = { checked?: number; settled?: number; unavailable?: number; error?: string };

export function ResultsRefreshButton() {
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
          return;
        }
        setMessage(result.unavailable
          ? `${result.settled} Ergebnis${result.settled === 1 ? "" : "se"} aktualisiert. Einige Spieldaten waren gerade nicht verfügbar.`
          : `${result.settled} Ergebnis${result.settled === 1 ? "" : "se"} aktualisiert · ${result.checked} Tipps geprüft.`);
        router.refresh();
      } catch {
        setMessage("Die Ergebnisabfrage konnte gerade nicht erreicht werden.");
      }
    });
  }

  return <div className="results-refresh-control">
    <button className="results-refresh-button" type="button" onClick={checkNow} disabled={pending}>
      {pending ? "Ergebnisse werden geprüft …" : "Ergebnisse jetzt abrufen"}
    </button>
    {message && <p role="status">{message}</p>}
  </div>;
}
