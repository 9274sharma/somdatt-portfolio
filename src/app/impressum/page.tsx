import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <div className="hm-wrap">
      <header className="hm-pagehead">
        <p className="hm-eyebrow">Legal</p>
        <h1>Impressum</h1>
      </header>
      <div className="hm-prose" style={{ paddingBottom: "4rem" }}>
        <p>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</p>

        <h2>Diensteanbieter</h2>
        <p>
          Somdatt Sharma
          <br />
          [Straße &amp; Hausnummer]
          <br />
          [PLZ] Hamburg
          <br />
          Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a href="mailto:somdattaatre@gmail.com">somdattaatre@gmail.com</a>
          <br />
          Telefon: +49 1525 342 7924
        </p>

        <h2>Umsatzsteuer</h2>
        <p>
          [USt-IdNr. gemäß § 27a UStG, falls vorhanden — andernfalls: Kleinunternehmer
          gemäß § 19 UStG, keine Ausweisung der Umsatzsteuer]
        </p>

        <h2>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
        <p>Somdatt Sharma (Anschrift wie oben)</p>

        {/* TODO before launch (not shown on the site): fill in street, PLZ and the tax line above. */}
      </div>
    </div>
  );
}
