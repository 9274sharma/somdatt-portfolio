import type { PortableTextBlock } from "next-sanity";
import { fetchMaybeDraft } from "./fetch";
import type { LocaleString, SanityImage } from "./content";

/** Typed fetchers for the restructured Studio (Home sections, Work, Project, About, Reviews, Settings). */

const opts = { next: { revalidate: 60 } } as const;

export type LocaleBlock = { en?: PortableTextBlock[]; de?: PortableTextBlock[] } | undefined;
export type Img = SanityImage & { hotspot?: { x: number; y: number }; alt?: string };
export type GalleryImg = Img & { _key: string; showOnHome?: boolean; inMix?: boolean };

export function pickBlocks(f: LocaleBlock, lang: "en" | "de"): PortableTextBlock[] {
  if (lang === "de" && f?.de?.length) return f.de;
  return f?.en ?? [];
}

// ---------- reviews ----------
export type ReviewDoc = {
  _id: string;
  name: string;
  role?: string;
  rating?: number;
  type?: string;
  text: string;
  verified?: boolean;
  submittedAt?: string;
};
const REVIEW = `_id,name,role,rating,type,text,verified,submittedAt`;

// ---------- settings ----------
export type Settings = {
  font?: string;
  contactEmail?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  linkedin?: string;
  googleReviewUrl?: string;
  footerTagline?: LocaleString;
  footerContactHeading?: LocaleString;
  footerLegalHeading?: LocaleString;
  footerCopyright?: LocaleString;
} | null;
export function getSettings(): Promise<Settings> {
  return fetchMaybeDraft(
    `*[_id=="siteSettings"][0]{font,contactEmail,phone,whatsapp,instagram,linkedin,googleReviewUrl,footerTagline,footerContactHeading,footerLegalHeading,footerCopyright}`,
    {},
    opts,
  );
}

// ---------- home ----------
export type HomeData = {
  hero: { eyebrow?: LocaleString; line1?: LocaleString; line2?: LocaleString; sub?: LocaleString; cta1?: LocaleString; cta2?: LocaleString; images?: Img[] } | null;
  work: { eyebrow?: LocaleString; heading?: LocaleString; linkLabel?: LocaleString } | null;
  services: { eyebrow?: LocaleString; heading?: LocaleString; linkLabel?: LocaleString } | null;
  about: { photo?: Img; eyebrow?: LocaleString; title?: LocaleString; body?: LocaleBlock; linkLabel?: LocaleString } | null;
  reviews: { show?: boolean; eyebrow?: LocaleString; heading?: LocaleString; linkLabel?: LocaleString } | null;
  contact: { eyebrow?: LocaleString; heading?: LocaleString; text?: LocaleString; button?: LocaleString } | null;
  serviceItems: { _id: string; title: LocaleString; description?: LocaleString; icon?: string; image?: Img; priceFrom?: LocaleString }[];
  projects: { slug: string; title: LocaleString; cat?: LocaleString; cover: Img; picks: GalleryImg[]; gallery: GalleryImg[] }[];
  /** from the About page — for the Home teaser */
  aboutStats: { _key: string; value?: number; suffix?: string; label?: LocaleString }[] | null;
  clients: string[] | null;
  /** Services page VAT setting — shown under the Home price chips too */
  vat?: "incl" | "small" | null;
  latestReviews: ReviewDoc[];
  reviewCount: number;
};
export function getHome(): Promise<HomeData> {
  return fetchMaybeDraft(
    `{
      "hero": *[_id=="homeHero"][0]{eyebrow,line1,line2,sub,cta1,cta2,images},
      "work": *[_id=="homeWork"][0]{eyebrow,heading,linkLabel},
      "services": *[_id=="homeServices"][0]{eyebrow,heading,linkLabel},
      "about": *[_id=="homeAbout"][0]{photo,eyebrow,title,body,linkLabel},
      "reviews": *[_id=="homeReviews"][0]{show,eyebrow,heading,linkLabel},
      "contact": *[_id=="homeContact"][0]{eyebrow,heading,text,button},
      "serviceItems": *[_type=="service" && showOnHome != false]|order(order asc){_id,title,description,icon,image,priceFrom},
      "aboutStats": *[_id=="aboutPage"][0].stats[defined(value)][0...3]{_key,value,suffix,label},
      "clients": *[_id=="aboutPage"][0].clients[].name,
      "vat": *[_id=="servicesPage"][0].vat,
      "projects": *[_type=="project" && defined(slug.current)]|order(order asc, _createdAt desc){
        "slug": slug.current, title, "cat": category->title, cover,
        "picks": gallery[showOnHome == true], "gallery": gallery[0...8]
      },
      "latestReviews": *[_type=="review" && status=="published"]|order(submittedAt desc)[0...3]{${REVIEW}},
      "reviewCount": count(*[_type=="review" && status=="published"])
    }`,
    {},
    opts,
  );
}

// ---------- work ----------
export type WorkCategory = {
  _id: string;
  slug: string;
  title: LocaleString;
  description?: LocaleString;
  intro?: LocaleBlock;
  cover?: Img;
  cta?: { title?: LocaleString; text?: LocaleString };
};
export type WorkProject = {
  _id: string;
  slug: string;
  title: LocaleString;
  description?: LocaleString;
  date?: string;
  location?: LocaleString;
  cover: Img;
  catId?: string;
  mix: GalleryImg[];
  firstFrames: GalleryImg[];
  photoCount?: number;
};
export type WorkData = {
  page: { eyebrow?: LocaleString; title?: LocaleString; lead?: LocaleString; ctaTitle?: LocaleString; ctaText?: LocaleString; ctaButton?: LocaleString } | null;
  categories: WorkCategory[];
  projects: WorkProject[];
};
export function getWork(): Promise<WorkData> {
  return fetchMaybeDraft(
    `{
      "page": *[_id=="workPage"][0]{eyebrow,title,lead,ctaTitle,ctaText,ctaButton},
      "categories": *[_type=="category" && defined(slug.current)]|order(order asc){_id,"slug":slug.current,title,description,intro,cover,cta},
      "projects": *[_type=="project" && defined(slug.current)]|order(order asc, _createdAt desc){
        _id, "slug": slug.current, title, description, date, location, cover, "catId": category._ref,
        "mix": gallery[inMix == true], "firstFrames": gallery[0...6], "photoCount": count(gallery)
      }
    }`,
    {},
    opts,
  );
}

// ---------- project ----------
export type Video = {
  _key: string;
  title?: LocaleString;
  url?: string;
  fileUrl?: string;
  vertical?: boolean;
  poster?: Img;
  duration?: string;
};
export type ProjectFull = {
  _id: string;
  slug: string;
  title: LocaleString;
  description?: LocaleString;
  date?: string;
  location?: LocaleString;
  cover: Img;
  headline?: LocaleString;
  story?: LocaleBlock;
  facts?: { _key: string; label?: LocaleString; value?: LocaleString }[];
  highlights?: { _key: string; title?: LocaleString; text?: LocaleString }[];
  gallery?: GalleryImg[];
  videos?: Video[];
  category?: { _id: string; slug: string; title: LocaleString };
  more: { _id: string; slug: string; title: LocaleString; description?: LocaleString; date?: string; location?: LocaleString; cover: Img }[];
} | null;
export function getProjectFull(slug: string): Promise<ProjectFull> {
  return fetchMaybeDraft(
    `*[_type=="project" && slug.current==$slug][0]{
      _id, "slug": slug.current, title, description, date, location, cover, headline, story, facts, highlights, gallery,
      "videos": videos[]{_key, title, url, "fileUrl": file.asset->url, vertical, poster, duration},
      "category": category->{_id, "slug": slug.current, title},
      "more": *[_type=="project" && category._ref == ^.category._ref && slug.current != $slug]|order(order asc, _createdAt desc)[0...6]{
        _id, "slug": slug.current, title, description, date, location, cover
      }
    }`,
    { slug },
    opts,
  );
}

// ---------- about ----------
export type AboutFull = {
  portrait?: Img;
  tagline?: LocaleString;
  intro?: LocaleString;
  basedIn?: string;
  stats?: { _key: string; value?: number; suffix?: string; label?: LocaleString }[];
  storyTitle?: LocaleString;
  story?: LocaleBlock;
  quote?: LocaleString;
  signature?: string;
  map?: { from?: string; fromNote?: LocaleString; to?: string; toNote?: LocaleString; distance?: string };
  behindTheLens?: (Img & { _key: string; caption?: LocaleString })[];
  journey?: { _key: string; year?: string; title?: LocaleString; text?: LocaleString; image?: Img }[];
  process?: { _key: string; title?: LocaleString; text?: LocaleString }[];
  capabilities?: { _key: string; title?: LocaleString; image?: Img; points?: LocaleString[] }[];
  clients?: { _key: string; name?: string; logo?: Img }[];
  faq?: { _key: string; q?: LocaleString; a?: LocaleString }[];
  reviews: ReviewDoc[];
} | null;
export function getAboutFull(): Promise<AboutFull> {
  return fetchMaybeDraft(
    `*[_id=="aboutPage"][0]{
      portrait, tagline, intro, basedIn, stats, storyTitle, story, quote, signature, map,
      behindTheLens, journey, process, capabilities, clients, faq,
      "reviews": *[_type=="review" && status=="published"]|order(submittedAt desc){${REVIEW}}
    }`,
    {},
    opts,
  );
}

// ---------- services ----------
export type ServiceItem = {
  _id: string;
  title: LocaleString;
  description?: LocaleString;
  intro?: LocaleString;
  icon?: string;
  image?: Img;
  videoUrl?: string;
  bestFor?: { _id: string; slug: string; title: LocaleString }[];
  points?: LocaleString[];
  deliverables?: LocaleString[];
  turnaround?: LocaleString;
  priceFrom?: LocaleString;
};
export type ServicesData = {
  page: {
    eyebrow?: LocaleString;
    title?: LocaleString;
    lead?: LocaleString;
    heroImage?: Img;
    pricingNote?: LocaleString;
    vat?: "incl" | "small";
    bundles?: { _key: string; title?: LocaleString; bestFor?: LocaleString; text?: LocaleString; includes?: LocaleString[]; price?: LocaleString; featured?: boolean }[];
    timeline?: { _key: string; when?: LocaleString; what?: LocaleString; text?: LocaleString }[];
    faq?: { _key: string; q?: LocaleString; a?: LocaleString }[];
  } | null;
  items: ServiceItem[];
  frames: { slug: string; title: LocaleString; cat?: string; imgs: GalleryImg[] }[];
  latestReviews: ReviewDoc[];
};
export function getServicesFull(): Promise<ServicesData> {
  return fetchMaybeDraft(
    `{
      "page": *[_id=="servicesPage"][0]{eyebrow,title,lead,heroImage,pricingNote,vat,bundles,timeline,faq},
      "items": *[_type=="service"]|order(order asc){
        _id,title,description,intro,icon,image,"videoUrl": video.asset->url,points,deliverables,turnaround,priceFrom,
        "bestFor": bestFor[]->{_id,"slug":slug.current,title}
      },
      "frames": *[_type=="project" && defined(slug.current)]|order(order asc, _createdAt desc)[0...6]{
        "slug": slug.current, title, "cat": category->slug.current, "imgs": gallery[0...6]
      },
      "latestReviews": *[_type=="review" && status=="published"]|order(submittedAt desc)[0...3]{${REVIEW}}
    }`,
    {},
    opts,
  );
}
