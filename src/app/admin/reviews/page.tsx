import { auth } from "@/auth";
import { writeClient } from "@/sanity/writeClient";
import { reviewToken } from "@/lib/reviewToken";
import { purgeRejectedReviews } from "@/lib/reviews";
import { loadAdmin } from "@/lib/admin-data";
import { SITE_URL } from "@/lib/mailer";
import { PageHead } from "@/components/admin/AdminShell";
import { ReviewsPanel, type AdminReview, type InviteBooking } from "@/components/admin/ReviewsPanel";
import { deleteReview, setReviewStatus } from "../actions";

export const metadata = { title: "Reviews" };

type RawReview = {
  _id: string;
  status: "pending" | "published" | "hidden";
  rating?: number;
  type?: string;
  name: string;
  role?: string;
  text: string;
  submittedAt?: string;
  rejectReason?: string;
  tokenReused?: boolean;
  booking?: { client?: string; startDate?: string } | null;
};

const fmt = (d?: string) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export default async function ReviewsPage() {
  if (!(await auth())) return null;
  await purgeRejectedReviews();
  const [d, reviews] = await Promise.all([
    loadAdmin(),
    writeClient.fetch<RawReview[]>(
      `*[_type=="review"]|order(submittedAt desc){_id,status,rating,type,name,role,text,submittedAt,rejectReason,tokenReused,"booking": booking->{client,startDate}}`,
      {},
      { cache: "no-store" },
    ),
  ]);
  // Always the real site address — these links end up on printed QR cards.
  const origin = SITE_URL;
  const invites: InviteBooking[] = d.items
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 40)
    .map((b) => ({ id: b.id, token: reviewToken(b.id), label: [b.client, b.type, fmt(b.start)].filter(Boolean).join(" · ") }));
  const items: AdminReview[] = reviews.map((r) => ({
    id: r._id,
    rating: r.rating ?? 0,
    type: r.type,
    name: r.name,
    role: r.role,
    text: r.text,
    date: fmt(r.submittedAt),
    status: r.status,
    reason: r.rejectReason,
    reused: r.tokenReused,
    booking: r.booking?.client ? [r.booking.client, fmt(r.booking.startDate)].filter(Boolean).join(", ") : undefined,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 md:px-8 md:pt-10">
      <PageHead eyebrow="What clients say" title="Reviews" />
      <ReviewsPanel formUrl={`${origin}/review`} bookings={invites} initial={items} setStatus={setReviewStatus} remove={deleteReview} />
    </div>
  );
}
