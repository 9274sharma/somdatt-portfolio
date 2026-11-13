import { auth } from "@/auth";
import { loadAdmin } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/AdminShell";
import { CalendarView } from "@/components/admin/CalendarView";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!(await auth())) return null;
  const [d, sp] = await Promise.all([loadAdmin(), searchParams]);
  const view = sp.view === "week" || sp.view === "list" ? sp.view : "month";
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-10">
      <PageHead eyebrow="Bookings" title="Calendar" />
      <CalendarView items={d.items} today={d.today} initialView={view} />
    </div>
  );
}
