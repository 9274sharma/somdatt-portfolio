import type { Metadata } from "next";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <div className="hm-wrap">
      <header className="hm-pagehead">
        <p className="hm-eyebrow">Legal</p>
        <h1>Datenschutz</h1>
      </header>
      <div className="hm-prose" style={{ paddingBottom: "4rem" }}>
        <h2>1. Verantwortlicher</h2>
        <p>
          Somdatt Sharma, [Adresse], Hamburg ·{" "}
          <a href="mailto:somdattaatre@gmail.com">somdattaatre@gmail.com</a>
        </p>

        <h2>2. Hosting</h2>
        <p>
          Diese Website wird bei Vercel Inc. gehostet. Beim Aufruf werden
          technisch notwendige Server-Logdaten (z. B. gekürzte IP-Adresse,
          Zeitpunkt, aufgerufene Seite) verarbeitet (Art. 6 Abs. 1 lit. f
          DSGVO).
        </p>

        <h2>3. Buchungsanfragen</h2>
        <p>
          Wenn Sie über das Formular unter /contact einen Termin anfragen, verarbeite ich die eingegebenen Daten: Name,
          E-Mail-Adresse, optional Telefonnummer, Wunschtermin und ungefähre Uhrzeit, Art des Events, Ort, gewünschte
          Leistungen, Ihre Nachricht und freiwillige Angaben (z. B. Gästezahl oder Budget), außerdem die gewählte Sprache
          und den Zeitpunkt der Anfrage. Zweck ist die Bearbeitung Ihrer Anfrage und die Durchführung des Auftrags;
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen bzw. Vertrag).
        </p>
        <p>Dafür setze ich folgende Dienste ein:</p>
        <ul>
          <li>
            <strong>Sanity</strong> (Sanity Inc., USA): Speicherung der Anfrage bzw. Buchung in einem nicht öffentlichen
            Bereich des Content-Management-Systems.
          </li>
          <li>
            <strong>Resend</strong> (Resend Inc., USA): Versand der E-Mails an Sie (Eingangsbestätigung, Zusage oder
            Absage, ggf. weitere Nachrichten zur Buchung) und der Benachrichtigung an mich.
          </li>
          <li>
            <strong>CallMeBot</strong> (callmebot.com): ein externer Dienst, der mir neue Anfragen mit den Angaben aus dem
            Formular als WhatsApp-Nachricht zustellt; die Zustellung erfolgt über WhatsApp (WhatsApp Ireland Ltd.). Eine
            Verarbeitung außerhalb der EU kann dabei nicht ausgeschlossen werden.
          </li>
          <li>
            <strong>Google Kalender</strong> (Google Ireland Ltd.): Nach einer Zusage trage ich den Termin (Name, Datum,
            Uhrzeit, Ort, eigene Notizen) in meinen Kalender ein. Sie erhalten keine Einladung von Google; die
            Bestätigungs-E-Mail enthält eine Kalenderdatei (.ics).
          </li>
          <li>
            <strong>OpenRouteService</strong> (HeiGIT gGmbH, Heidelberg): Zur Berechnung der Fahrzeit wird nur die
            Ortsangabe übermittelt, nicht Ihr Name oder Ihre Kontaktdaten.
          </li>
        </ul>
        <p>
          <strong>Kontakt per WhatsApp:</strong> Über den WhatsApp-Button können Sie mich direkt anschreiben. Die
          Website lädt dafür keine Inhalte von WhatsApp; erst wenn Sie den Button antippen, öffnet sich WhatsApp
          (WhatsApp Ireland Ltd.) und Ihre Nachricht wird nach dessen Bedingungen verarbeitet. Die Nutzung ist
          freiwillig – Sie erreichen mich auch per E-Mail oder über das Anfrageformular.
        </p>
        <p>
          Zum Schutz vor Missbrauch wird Ihre IP-Adresse kurzzeitig (höchstens 10 Minuten) im Arbeitsspeicher
          verarbeitet, um die Zahl der Anfragen zu begrenzen; sie wird nicht gespeichert (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
        <p>
          Soweit Daten an Anbieter in den USA übermittelt werden, geschieht dies auf Grundlage des EU-U.S. Data Privacy
          Framework bzw. von EU-Standardvertragsklauseln (Art. 45, 46 DSGVO).
        </p>
        <p>
          Anfragen, aus denen keine Buchung wird, lösche ich spätestens 12 Monate nach dem angefragten Termin. Daten zu
          durchgeführten Aufträgen bewahre ich im Rahmen der gesetzlichen Aufbewahrungspflichten auf (in der Regel 6 bzw.
          10 Jahre, § 147 AO, § 257 HGB).
        </p>

        <h2>4. Inhalte &amp; Medien</h2>
        <p>
          Bilder werden über das Content-Delivery-Network von Sanity (sanity.io)
          ausgeliefert.
        </p>

        <h2 id="reviews" style={{ scrollMarginTop: "6rem" }}>5. Bewertungen (Kundenstimmen)</h2>
        <p>
          Über das Bewertungsformular (/review) können Kund:innen eine Bewertung abgeben. Gespeichert werden: Name
          (wie angegeben), optionale Angaben zur Person, Sternebewertung, Art des Shootings, Bewertungstext, Sprache,
          Zeitpunkt sowie – bei einem persönlichen Link – die Zuordnung zur jeweiligen Buchung. Die Daten werden im
          Content-Management-System Sanity (sanity.io) gespeichert; über neue Bewertungen werde ich per E-Mail (Resend)
          benachrichtigt. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
        </p>
        <p>
          <strong>Wie Bewertungen geprüft werden:</strong> Jede Bewertung wird vor der Veröffentlichung manuell
          geprüft. Mit „Verifizierte:r Kund:in“ gekennzeichnete Bewertungen wurden über einen persönlichen Link
          abgegeben, den ich nach einer tatsächlichen Buchung verschickt habe. Bewertungen über den allgemeinen Link
          werden anhand des Namens geprüft. Nicht veröffentlicht werden nur Spam, Bewertungen von Personen, die keine
          Kund:innen waren, Duplikate oder Bewertungen mit personenbezogenen Daten Dritter – kritische Bewertungen
          werden ebenfalls veröffentlicht.
        </p>
        <p>
          Sie können Ihre Einwilligung jederzeit per E-Mail widerrufen; die Bewertung wird dann gelöscht.
          Abgelehnte Bewertungen werden nach spätestens 90 Tagen automatisch gelöscht.
        </p>

        <h2>6. Lokale Speicherung</h2>
        <p>
          Für Einstellungen wie Theme, Schriftart und Sprache verwenden wir
          technisch notwendigen lokalen Speicher (localStorage) im Browser —
          keine Tracking-Cookies.
        </p>

        <h2>7. Ihre Rechte</h2>
        <ul>
          <li>Auskunft, Berichtigung, Löschung, Einschränkung</li>
          <li>Datenübertragbarkeit</li>
          <li>Widerspruch gegen die Verarbeitung</li>
          <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde</li>
        </ul>

        {/* TODO before launch (not shown on the site): add the address in section 1 and have the whole text checked
            (eRecht24 / Händlerbund), incl. sections 3 and 5. Add a cookie consent if analytics or embeds are ever added. */}
      </div>
    </div>
  );
}
