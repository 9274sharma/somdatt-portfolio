import type { ComponentType } from "react";
import { map } from "rxjs";
import type { DefaultDocumentNodeResolver, StructureBuilder, StructureResolver } from "sanity/structure";
import { HomeIcon } from "@sanity/icons/Home";
import { ProjectsIcon } from "@sanity/icons/Projects";
import { FolderIcon } from "@sanity/icons/Folder";
import { DocumentIcon } from "@sanity/icons/Document";
import { ThListIcon } from "@sanity/icons/ThList";
import { UserIcon } from "@sanity/icons/User";
import { CommentIcon } from "@sanity/icons/Comment";
import { CogIcon } from "@sanity/icons/Cog";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { ImagesIcon } from "@sanity/icons/Images";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { EditIcon } from "@sanity/icons/Edit";
import { EyeOpenIcon } from "@sanity/icons/EyeOpen";
import { PreviewPane } from "./components/PreviewPane";
import { PREVIEWABLE } from "./previewTargets";

/** Every page-backed document gets two tabs: the form and a live page preview. */
const views = (S: StructureBuilder, type: string) =>
  PREVIEWABLE.has(type)
    ? [S.view.form().icon(EditIcon), S.view.component(PreviewPane).title("Preview").icon(EyeOpenIcon)]
    : [S.view.form()];

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) =>
  S.document().views(views(S, schemaType));

const single = (S: StructureBuilder, id: string, title: string, icon?: ComponentType) =>
  S.listItem()
    .title(title)
    .id(id)
    .icon(icon ?? DocumentIcon)
    .child(S.document().schemaType(id).documentId(id).title(title).views(views(S, id)));

type Cat = { _id: string; title?: { en?: string } };

/** Studio sidebar: Home · Work (a live folder per category) · Services · About · Reviews · Site settings · Bookings. */
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Somdatt")
    .items([
      S.listItem()
        .title("Home")
        .id("home")
        .icon(HomeIcon)
        .child(
          S.list()
            .title("Home")
            .items([
              single(S, "homeHero", "Main frame", ImagesIcon),
              single(S, "homeWork", "Selected work", ProjectsIcon),
              S.listItem()
                .title("What I do")
                .id("what-i-do")
                .icon(ThListIcon)
                .child(
                  S.list()
                    .title("What I do")
                    .items([
                      single(S, "homeServices", "Heading & link"),
                      S.documentTypeListItem("service").title("Boxes (same as Services)"),
                    ]),
                ),
              single(S, "homeAbout", "Short about", UserIcon),
              single(S, "homeReviews", "What clients say", CommentIcon),
              single(S, "homeContact", "Get in touch", EnvelopeIcon),
            ]),
        ),

      S.listItem()
        .title("Work")
        .id("work")
        .icon(ProjectsIcon)
        .child(() =>
          context.documentStore
            .listenQuery(`*[_type=="category"]|order(order asc, _createdAt asc){_id,title}`, {}, {})
            .pipe(
              map((rows: Cat[]) => {
                // drafts and published share one folder
                const byId = new Map<string, Cat>();
                for (const c of rows) {
                  const id = c._id.replace(/^drafts\./, "");
                  if (!byId.has(id) || c._id.startsWith("drafts.")) byId.set(id, { ...c, _id: id });
                }
                const cats = [...byId.values()];
                return S.list()
                  .title("Work")
                  .items([
                    single(S, "workPage", "Work page — title, lead text, CTA"),
                    S.documentTypeListItem("category").title("Categories (chips) — add / rename / delete"),
                    S.divider(),
                    ...cats.map((c) => {
                      const name = c.title?.en || "Untitled category";
                      return S.listItem()
                        .title(name)
                        .id(`cat-${c._id}`)
                        .icon(FolderIcon)
                        .child(
                          S.list()
                            .title(name)
                            .items([
                              S.listItem()
                                .title("Category page")
                                .id(`page-${c._id}`)
                                .icon(DocumentIcon)
                                .child(S.document().schemaType("category").documentId(c._id).title(name).views(views(S, "category"))),
                              S.listItem()
                                .title("Projects")
                                .id(`projects-${c._id}`)
                                .icon(ProjectsIcon)
                                .child(
                                  S.documentList()
                                    .title(`${name} — projects`)
                                    .schemaType("project")
                                    .filter(`_type == "project" && category._ref == $cat`)
                                    .params({ cat: c._id })
                                    .defaultOrdering([{ field: "order", direction: "asc" }])
                                    .initialValueTemplates([S.initialValueTemplateItem("project-in-category", { catId: c._id })]),
                                ),
                            ]),
                        );
                    }),
                  ]);
              }),
            ),
        ),

      S.listItem()
        .title("Services")
        .id("services")
        .icon(ThListIcon)
        .child(
          S.list()
            .title("Services")
            .items([single(S, "servicesPage", "Services page — header, bundles, booking steps, FAQ, VAT"), S.documentTypeListItem("service").title("Services")]),
        ),

      single(S, "aboutPage", "About", UserIcon),

      S.listItem()
        .title("Reviews")
        .id("reviews")
        .icon(CommentIcon)
        .child(
          S.list()
            .title("Reviews")
            .items(
              (
                [
                  ["pending", "Waiting for approval"],
                  ["published", "Published"],
                  ["hidden", "Rejected"],
                ] as const
              ).map(([status, title]) =>
                S.listItem()
                  .title(title)
                  .id(`reviews-${status}`)
                  .child(
                    S.documentList()
                      .title(title)
                      .schemaType("review")
                      .filter(`_type == "review" && status == $status`)
                      .params({ status })
                      .defaultOrdering([{ field: "submittedAt", direction: "desc" }]),
                  ),
              ),
            ),
        ),

      single(S, "siteSettings", "Site settings", CogIcon),
      S.divider(),
      S.listItem()
        .title("Bookings")
        .id("bookings")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Bookings")
            .items([
              single(S, "bookingSettings", "Booking settings — form, emails, templates", EnvelopeIcon),
              S.divider(),
              ...(
                [
                  ["request", "New requests", `status == "request"`],
                  ["confirmed", "Confirmed", `(status == "confirmed" || !defined(status))`],
                  ["closed", "Declined & cancelled", `status in ["declined", "cancelled"]`],
                ] as const
              ).map(([id, title, f]) =>
                S.listItem()
                  .title(title)
                  .id(`bookings-${id}`)
                  .child(
                    S.documentList()
                      .title(title)
                      .schemaType("booking")
                      .filter(`_type == "booking" && ${f}`)
                      .defaultOrdering([{ field: "startDate", direction: id === "confirmed" ? "asc" : "desc" }]),
                  ),
              ),
              S.documentTypeListItem("booking").title("All bookings"),
            ]),
        ),
    ]);
