import { requireUser } from "@/lib/supabase/require-user";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default async function ScheinePage() {
  await requireUser();
  return <>
    <SiteHeader currentPath="/scheine" />
    <main className="page-wrap quick-page empty-page">
      <p>Noch keine Scheine veröffentlicht.</p>
    </main>
    <SiteFooter />
  </>;
}
