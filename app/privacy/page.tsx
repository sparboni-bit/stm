import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Pickleball Arena Tournament Manager.",
};

const email = "stefano@pickleballandstay.com";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-[18px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <header className="border-b border-neutral-200 pb-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Pickleball Arena Tournament Manager
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-neutral-500">Last updated: September 12, 2026</p>
        </header>

        <PolicyEnglish />

        <section className="mt-10 border-t border-neutral-200 pt-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">Italiano</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Informativa sulla privacy</h2>
          <PolicyItalian />
        </section>
      </article>
    </main>
  );
}

function ContactLink() {
  return (
    <a href={`mailto:${email}`} className="font-bold text-neutral-950 underline underline-offset-2">
      {email}
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-black text-neutral-950">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function PolicyEnglish() {
  return (
    <div className="mt-7 space-y-7 text-sm leading-7 text-neutral-700">
      <Section title="1. Developer and contact">
        <p>
          Pickleball Arena Tournament Manager is developed by Stefano Parboni, operating under the
          Pickleball Arena brand.
        </p>
        <p>Contact: <ContactLink /></p>
      </Section>

      <Section title="2. Data collection and sharing">
        <p>
          The current Android version works offline and does not require an account, login, or
          registration. It does not transmit tournament data, player information, or other
          user-entered operational data to Stefano Parboni, Pickleball Arena, Supabase, or an STM server.
        </p>
        <p>
          The app does not sell or share user data with third parties for advertising, analytics,
          or tracking purposes.
        </p>
      </Section>

      <Section title="3. Information stored on the device">
        <p>
          Tournament details, player names, matches, scores, standings, and related settings entered
          by the user are stored locally on the device and used only for tournament-management functions.
        </p>
      </Section>

      <Section title="4. Individual Rotation reference data">
        <p>
          Individual Rotation uses a static reference catalog bundled with the app. It is an
          application resource and does not collect, upload, or transmit information about users or tournaments.
        </p>
      </Section>

      <Section title="5. Export and sharing initiated by the user">
        <p>
          Export or sharing actions occur only when initiated by the user. If an external app or
          service is selected, its handling of the exported information is governed by its own privacy practices.
        </p>
      </Section>

      <Section title="6. Advertising, analytics, and tracking">
        <p>
          The current Android release does not include advertising, advertising identifiers,
          analytics services, or user-tracking functionality.
        </p>
      </Section>

      <Section title="7. Retention and deletion">
        <p>
          Because tournament information is stored locally, users control its retention through the
          app and their device. Deleting data in the app or uninstalling it removes locally managed
          application data subject to Android operating-system behavior.
        </p>
        <p>
          Android or device-level backup and restore features may independently preserve or restore
          app data according to device and account settings. Such operating-system services are
          outside the developer&apos;s control.
        </p>
      </Section>

      <Section title="8. Children&apos;s privacy">
        <p>
          The app is a tournament-management tool and does not knowingly collect personal data from
          children or other users. Tournament organizers are responsible for information they choose
          to enter locally on their devices.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          This policy may be updated if the app&apos;s functionality or data practices change. The
          current version will be available on this public Privacy Policy page.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For privacy questions, app support, Pickleball Arena sports initiatives, collaborations,
          or enquiries about similar software projects, contact <ContactLink />.
        </p>
      </Section>
    </div>
  );
}

function PolicyItalian() {
  return (
    <div className="mt-6 space-y-7 text-sm leading-7 text-neutral-700">
      <Section title="1. Sviluppatore e contatti">
        <p>
          Pickleball Arena Tournament Manager è sviluppata da Stefano Parboni, che opera con il
          marchio Pickleball Arena.
        </p>
        <p>Contatto: <ContactLink /></p>
      </Section>

      <Section title="2. Raccolta e condivisione dei dati">
        <p>
          L&apos;attuale versione Android funziona offline e non richiede account, login o
          registrazione. Non trasmette dati dei tornei, informazioni sui giocatori o altri dati
          operativi inseriti dall&apos;utente a Stefano Parboni, Pickleball Arena, Supabase o a un server STM.
        </p>
        <p>
          L&apos;app non vende né condivide dati degli utenti con terze parti per finalità
          pubblicitarie, analitiche o di tracciamento.
        </p>
      </Section>

      <Section title="3. Informazioni memorizzate sul dispositivo">
        <p>
          Dati del torneo, nomi dei giocatori, partite, punteggi, classifiche e relative impostazioni
          sono memorizzati localmente sul dispositivo e usati esclusivamente per la gestione dei tornei.
        </p>
      </Section>

      <Section title="4. Dati di riferimento Individual Rotation">
        <p>
          Individual Rotation utilizza un catalogo statico di riferimento incluso nell&apos;app.
          Questa risorsa non raccoglie, carica o trasmette informazioni sugli utenti o sui tornei.
        </p>
      </Section>

      <Section title="5. Esportazione e condivisione avviate dall&apos;utente">
        <p>
          Esportazione e condivisione avvengono solo su iniziativa dell&apos;utente. Se viene scelto
          un servizio esterno, il trattamento delle informazioni esportate è regolato dalla relativa
          informativa sulla privacy.
        </p>
      </Section>

      <Section title="6. Pubblicità, analytics e tracciamento">
        <p>
          L&apos;attuale release Android non include pubblicità, identificatori pubblicitari,
          servizi di analytics o funzionalità di tracciamento.
        </p>
      </Section>

      <Section title="7. Conservazione e cancellazione">
        <p>
          Poiché i dati dei tornei sono locali, l&apos;utente ne controlla la conservazione tramite
          l&apos;app e il dispositivo. La cancellazione nell&apos;app o la disinstallazione rimuove i
          dati gestiti localmente, secondo il comportamento del sistema operativo Android.
        </p>
        <p>
          Le funzioni di backup e ripristino di Android o del dispositivo possono conservare o
          ripristinare autonomamente dati dell&apos;app in base alle impostazioni del dispositivo e
          dell&apos;account. Tali servizi sono fuori dal controllo dello sviluppatore.
        </p>
      </Section>

      <Section title="8. Privacy dei minori">
        <p>
          L&apos;app è uno strumento per la gestione di tornei e non raccoglie consapevolmente dati
          personali di minori o altri utenti. Gli organizzatori sono responsabili delle informazioni
          che scelgono di inserire localmente sui propri dispositivi.
        </p>
      </Section>

      <Section title="9. Modifiche all&apos;informativa">
        <p>
          Questa informativa può essere aggiornata se cambiano le funzionalità o le modalità di
          trattamento dei dati. La versione corrente sarà disponibile in questa pagina pubblica.
        </p>
      </Section>

      <Section title="10. Contatti">
        <p>
          Per privacy, assistenza sull&apos;app, iniziative sportive Pickleball Arena, collaborazioni
          o richieste relative a software simile, contattare <ContactLink />.
        </p>
      </Section>
    </div>
  );
}
