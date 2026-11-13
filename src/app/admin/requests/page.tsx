import { auth } from "@/auth";
import { loadAdmin } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/AdminShell";
import { RequestsView } from "@/components/admin/RequestsView";

export const metadata = { title: "Requests" };

export default async function RequestsPage() {
  if (!(await auth())) return null;
  const d = await loadAdmin();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 md:px-8 md:pt-10">
      <PageHead eyebrow="Inbox" title="Requests" />
      <RequestsView
        requests={d.requests}
        confirmed={d.confirmed}
        emails={d.emails}
        contact={d.contact}
        calendarConnected={d.calendarConnected}
        travelEnabled={d.travelEnabled}
      />
    </div>
  );
}
