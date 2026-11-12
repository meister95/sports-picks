# PREDIQ

Eine private Tipps-Seite für deinen Freundeskreis, gebaut mit Next.js, TypeScript, Tailwind CSS und Supabase. Zum Ansehen und Verwenden ist eine Anmeldung erforderlich; die Registrierung bleibt offen.

## Lokal starten

1. Installiere [Node.js LTS](https://nodejs.org/).
2. Öffne den Projektordner in einem Terminal und installiere die Pakete einmalig:

   ```bash
   npm install
   ```

3. Starte die Website:

   ```bash
   npm run dev
   ```

4. Öffne [http://localhost:3000](http://localhost:3000). Mit `Ctrl+C` beendest du den Server.

Ohne Supabase-Einstellungen zeigt die Website den Login-Hinweis. Die Tipps und übrigen Seiten sind nur nach erfolgreicher Anmeldung erreichbar.

## Login und Kommentare mit Supabase einrichten

Supabase stellt Login und eine gehostete PostgreSQL-Datenbank bereit. Für 30–50 Nutzer ist der kostenlose Tarif zum Start ausreichend. Free-Projekte können nach längerer Inaktivität pausieren; für dauerhafte Verfügbarkeit und Backups kannst du später auf einen bezahlten Tarif wechseln. Für ein Deployment auf Vercel solltest du eine externe Datenbank verwenden: das lokale Dateisystem von Serverless-Funktionen ist nicht dauerhafte Speicherung.

1. Erstelle ein Projekt auf [supabase.com](https://supabase.com/).
2. Öffne **SQL Editor** in Supabase, füge den Inhalt von `supabase/schema.sql` ein und führe ihn aus. Das erstellt die Tipps-, Profil-, Like/Dislike- und Kommentartabellen mit aktivierter Row Level Security. Anonyme Nutzer erhalten keinen Lesezugriff.
3. Kopiere die Project URL und den Publishable key aus **Project Settings → API Keys**. Erstelle im Projektordner eine Datei namens `.env.local` (oder kopiere `.env.example`) und trage ein:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dein-publishable-key
   ```

   Den Publishable key darf der Browser verwenden. Verwende niemals den `service_role`- oder Secret key in dieser Website.
4. Füge in **Authentication → URL Configuration** `http://localhost:3000` als Site URL hinzu. Die Website verarbeitet sowohl die normalen Supabase-Bestätigungslinks als auch `/auth/confirm` mit `token_hash`.
5. Starte den Entwicklungsserver erneut. Freunde können sich über `/registrieren` selbst registrieren. Bei aktivierter E-Mail-Bestätigung müssen sie den Link aus der Bestätigungs-E-Mail öffnen. Supabases eingebauter Testversand ist nur für E-Mail-Adressen des Projektteams gedacht und auf zwei Nachrichten pro Stunde begrenzt; richte eigenen SMTP ein, damit Registrierungen für deine Freunde funktionieren.
6. Beim ersten Login wählt jede Person einen Anzeigenamen. In deinem bestehenden PREDIQ-Projekt ist dein Konto bereits als Betreiber eingerichtet. Bei einer neuen Installation kannst du dein Profil nach der Registrierung auf Betreiber setzen. Ersetze `DEIN_NAME` und führe das in SQL Editor aus:

   ```sql
   update public.profiles set is_owner = true where username = 'DEIN_NAME';
   ```

7. Auf Vercel müssen dieselben beiden Umgebungsvariablen in den Project Settings eingetragen sein. Freunde können sich über die Registrierungsseite selbst ein Konto erstellen; einzelne Supabase-Einladungen sind nicht nötig.

Der kostenlose Supabase-E-Mail-Versand hat ein niedriges Testlimit. Für zuverlässige Einladungen an Freunde richte in Supabase später einen eigenen SMTP-Anbieter ein. Teile niemals Passwörter oder Secret keys.

## Funktionen und Daten

- `/tipps` zeigt die veröffentlichten Tipps; Likes, Dislikes und Kommentare erscheinen je Tipp.
- `/scheine` ist der vorbereitete Bereich für zukünftige Wettscheine.
- `/statistik` zeigt die Tippstatistik.
- `/login` ist der Login, `/registrieren` die öffentliche Registrierung.
- `/profil` fragt beim ersten Login einen öffentlichen Nutzernamen ab.
- Beispieltipps bleiben vorerst leer. Wenn du später Tipps einpflegst, ist deren `id` der Schlüssel für die Reaktionen und Kommentare.

Es gibt keine Wettanbieter-Anbindung oder Zahlungen.
