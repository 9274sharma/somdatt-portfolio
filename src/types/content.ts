export type ProjectCategory =
  | "Weddings"
  | "Commercial"
  | "Social"
  | "Personal";

export type BilingualText = {
  en: string;
  de: string;
};

export type BilingualList = {
  en: string[];
  de: string[];
};

export type ProjectEntry = {
  slug: string;
  category: ProjectCategory;
  cover: string;
  /** Full in-modal list when `galleryFolder` is not set, or fallback if the folder is empty. */
  gallery: string[];
  /**
   * Paths under `public/` for the on-page bento only (4–5). When `galleryFolder` is set,
   * `+N` on the last tile uses (folder file count − preview count).
   */
  previewGallery?: string[];
  /** e.g. `images/K-Dream` — server reads this folder to build the full lightbox list. */
  galleryFolder?: string;
  title: BilingualText;
  role: BilingualText;
  client: BilingualText;
  year: string;
  location: BilingualText;
  brief: BilingualText;
  behind: BilingualText;
  resultsBullets: BilingualList;
};

export type PortfolioFile = {
  heroImage: string;
  /** CSS `object-position` for the hero (e.g. `center 62%`) when the file has empty sky above the subject. */
  heroImageObjectPosition?: string;
  featuredSlugs: string[];
  portfolioIntro: BilingualText;
  projects: ProjectEntry[];
};

export type AboutExperienceItem = {
  title: BilingualText;
  dates: BilingualText;
  bullets: BilingualList;
};

export type AboutFile = {
  /** Optional portrait under `public/` (same pattern as portfolio hero). */
  portraitImage?: string;
  portraitImageObjectPosition?: string;
  header: {
    title: BilingualText;
    intro: BilingualText;
  };
  experienceHeading: BilingualText;
  experience: AboutExperienceItem[];
  skillsHeading: BilingualText;
  skillsLines: BilingualList;
  educationHeading: BilingualText;
  educationLines: BilingualList;
  languagesHeading: BilingualText;
  languagesLine: BilingualText;
  downloadCvLabel: BilingualText;
};
