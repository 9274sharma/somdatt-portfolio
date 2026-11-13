import "server-only";
import { writeClient } from "@/sanity/writeClient";

/** Deletes reviews rejected more than 90 days ago (as promised in the admin + privacy policy).
 *  Runs lazily whenever Admin → Reviews opens or a new review arrives — no cron needed. */
export async function purgeRejectedReviews(): Promise<number> {
  try {
    const ids = await writeClient.fetch<string[]>(
      `*[_type=="review" && status=="hidden" && dateTime(coalesce(rejectedAt, _updatedAt)) < dateTime(now()) - 60*60*24*90]._id`,
    );
    if (!ids.length) return 0;
    const tx = writeClient.transaction();
    ids.forEach((id) => tx.delete(id));
    await tx.commit();
    return ids.length;
  } catch (e) {
    console.error("purgeRejectedReviews", e);
    return 0;
  }
}
