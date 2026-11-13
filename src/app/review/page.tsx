import type { Metadata } from "next";
import { writeClient } from "@/sanity/writeClient";
import { getSettings } from "@/sanity/queries";
import { readReviewToken } from "@/lib/reviewToken";
import { getLang } from "@/i18n/server";
import { ui } from "@/i18n/ui";
import { ReviewForm, type ReviewInvite } from "@/components/reviews/ReviewForm";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Leave a review",
  robots: { index: false, follow: false },
};

const typeOf = (s = "") =>
  /wedd|hochzeit|bride|braut/i.test(s)
    ? "wedding"
    : /event|party|club|night|dj|konzert/i.test(s)
      ? "event"
      : /brand|commercial|product|marke|campaign/i.test(s)
        ? "brand"
        : /portrait|porträt|headshot/i.test(s)
          ? "portrait"
          : undefined;

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ type?: string; invite?: string }> }) {
  const [{ type, invite }, lang, settings] = await Promise.all([searchParams, getLang(), getSettings()]);
  const u = ui(lang);

  let inv: ReviewInvite | undefined;
  const bookingId = readReviewToken(invite);
  if (bookingId && invite) {
    const b = await writeClient.fetch<{ client?: string; eventType?: string; startDate?: string } | null>(
      `*[_type=="booking" && _id==$id][0]{client,eventType,startDate}`,
      { id: bookingId },
    );
    if (b?.client) {
      const date = b.startDate
        ? new Date(`${b.startDate}T12:00:00`).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "";
      inv = { token: invite, name: b.client, type: typeOf(b.eventType), label: [b.client, b.eventType, date].filter(Boolean).join(" · ") };
    }
  }

  return (
    <div className="hm-wrap pb-20">
      <ReviewForm
        action={submitReview}
        t={u.form}
        cardLabels={u.reviews}
        initialType={type}
        invite={inv}
        contactEmail={settings?.contactEmail || "somdattaatre@gmail.com"}
        googleReviewUrl={settings?.googleReviewUrl}
      />
    </div>
  );
}
