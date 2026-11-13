import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Token-authenticated client for server-side writes (admin bookings). */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});
