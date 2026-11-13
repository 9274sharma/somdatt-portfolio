import { type SchemaTypeDefinition } from "sanity";
import { localeBlock, localeString, localeText, richText } from "./objects/locale";
import { homeAbout, homeContact, homeHero, homeReviews, homeServices, homeWork } from "./documents/home";
import { servicesPage, workPage } from "./documents/pages";
import category from "./documents/category";
import project from "./documents/project";
import service from "./documents/service";
import aboutPage from "./documents/aboutPage";
import review from "./documents/review";
import siteSettings from "./documents/siteSettings";
import booking from "./documents/booking";
import bookingSettings from "./documents/bookingSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // objects
    localeString,
    localeText,
    richText,
    localeBlock,
    // Home sections
    homeHero,
    homeWork,
    homeServices,
    homeAbout,
    homeReviews,
    homeContact,
    // pages + content
    workPage,
    servicesPage,
    category,
    project,
    service,
    aboutPage,
    review,
    siteSettings,
    booking,
    bookingSettings,
  ],
};

/** Documents that exist exactly once (fixed IDs). */
export const SINGLETONS = [
  "homeHero",
  "homeWork",
  "homeServices",
  "homeAbout",
  "homeReviews",
  "homeContact",
  "workPage",
  "servicesPage",
  "aboutPage",
  "siteSettings",
  "bookingSettings",
];
