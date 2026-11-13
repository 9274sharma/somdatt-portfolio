import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { loadAdmin } from "@/lib/admin-data";
import { BookingDetail } from "@/components/admin/BookingDetail";

export const metadata = { title: "Booking" };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return null;
  const id = decodeURIComponent((await params).id);
  const d = await loadAdmin();
  const b = d.items.find((x) => x.id === id);
  if (!b) notFound();
  const req = d.requests.find((r) => r.id === id);
  return (
    <BookingDetail
      key={b.id + b.status + b.notes.length + b.activity.length}
      b={b}
      today={d.today}
      templates={d.templates}
      request={
        req
          ? { requests: [req], confirmed: d.confirmed, emails: d.emails, contact: d.contact, calendarConnected: d.calendarConnected, travelEnabled: d.travelEnabled }
          : undefined
      }
    />
  );
}
