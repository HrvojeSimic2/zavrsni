# 3. KORIŠTENE TEHNOLOGIJE I ALATI

U ovom poglavlju opisani su alati i tehnologije korišteni pri izradi web aplikacije za posredovanje između putnika i lokalnih turističkih vodiča. Aplikacija je izrađena kao cjelovito web rješenje u kojem se poslužiteljska i klijentska logika nalaze unutar istog projekta, dok se pohrana podataka, autentikacija korisnika i pohrana datoteka oslanjaju na vanjsku uslugu. Takav pristup, poznat kao *full-stack* razvoj s jednim razvojnim okvirom, smanjuje količinu infrastrukture kojom je potrebno upravljati te omogućuje da se isti programski jezik i isti model podataka koriste na obje strane aplikacije.

Odabir tehnologija vodio se trima kriterijima: podrškom za renderiranje na poslužitelju (zbog brzine prvog prikaza i indeksiranja javnih profila vodiča), tipskom sigurnošću (zbog velikog broja entiteta i stanja rezervacije) te postojanjem ugrađenog mehanizma za autorizaciju na razini zapisa u bazi podataka. U nastavku su prvo opisani razvojni alati, a zatim tehnologije od kojih je aplikacija sastavljena.

## 3.1. Alati

Prije početka razvoja potrebno je pripremiti razvojno okruženje koje omogućuje pisanje koda, njegovo verzioniranje, lokalno pokretanje aplikacije i baze podataka te konačnu objavu aplikacije na internetu. U nastavku su opisani alati koji su korišteni u svakoj od tih faza.

### 3.1.1. Visual Studio Code

Za pisanje programskog koda korišten je Visual Studio Code, besplatan i višeplatformski uređivač koda razvijen od strane Microsofta. Radi se o jednom od najkorištenijih alata za razvoj web aplikacija, prvenstveno zbog male potrošnje resursa u odnosu na potpuna razvojna okruženja te velikog broja dostupnih proširenja.

Za razvoj ove aplikacije najvažnija je bila ugrađena podrška za TypeScript. Uređivač koristi isti jezični poslužitelj koji koristi i prevoditelj TypeScripta, što znači da su tipske pogreške vidljive već tijekom pisanja koda, a ne samo pri izgradnji projekta. Kod aplikacije s velikim brojem povezanih entiteta, poput vodiča, termina i rezervacija, ta mogućnost znatno smanjuje broj pogrešaka koje se otkrivaju tek pri izvođenju.

Osim toga, korištene su i sljedeće mogućnosti uređivača:

- automatsko dovršavanje uvoza modula i predlaganje svojstava objekata na temelju definiranih tipova,
- ugrađeni terminal iz kojega su pokretane naredbe za razvojni poslužitelj i migracije baze podataka,
- ugrađena podrška za sustav za upravljanje verzijama Git, uključujući prikaz promjena po datoteci,
- proširenja za rad s Tailwind CSS-om, ESLint-om i formatiranjem koda.

Projekt sadrži i direktorij `.vscode` s postavkama specifičnim za radni prostor, čime se osigurava da se ista pravila formatiranja i provjere koda primjenjuju neovisno o računalu na kojem se projekt otvara.

*Slika 3.1. Prikaz korisničkog sučelja programa Visual Studio Code s otvorenim projektom (Autor)*

### 3.1.2. Git i GitHub

Git je distribuirani sustav za upravljanje verzijama koji omogućuje bilježenje svake promjene u izvornom kodu, vraćanje na prethodna stanja projekta te paralelan rad na više funkcionalnosti kroz odvojene grane (engl. *branch*). Za razliku od centraliziranih sustava, svaki lokalni repozitorij sadrži cijelu povijest projekta, pa je rad moguć i bez mrežne veze.

Tijekom razvoja aplikacije Git je korišten na način da svaka zaokružena funkcionalnost predstavlja jednu ili više promjena zabilježenih u zapisu (engl. *commit*), uz opisnu poruku. Time je dobivena kronologija razvoja iz koje je vidljivo kojim su redom nastale autentikacija, profili vodiča, upravljanje terminima, rezervacije i administratorski dio aplikacije. Veće promjene razvijane su u odvojenim granama koje su nakon dovršetka spojene u glavnu granu. Iz iste je povijesti vidljiv i prijelaz s prvotnog modela usmjerenog na ture na model u kojem se rezervira vrijeme samog vodiča, opisan u poglavlju 4.3.

Kao udaljeni repozitorij korišten je GitHub, mrežna platforma za pohranu Git repozitorija. Osim što služi kao sigurnosna kopija projekta, GitHub je u ovom radu bitan i zato što se objava aplikacije izvodi izravno iz repozitorija, kako je opisano u poglavlju 3.1.5.

Važan dio konfiguracije je datoteka `.gitignore`, kojom se iz repozitorija isključuju direktoriji `node_modules` i `.next` te datoteka `.env`. Prva dva sadrže sadržaj koji se može ponovno generirati, dok datoteka `.env` sadrži pristupne podatke za bazu podataka i vanjske usluge, koje nikada ne bi smjele biti dio javnog repozitorija.

### 3.1.3. Node.js i npm

Node.js je izvršno okruženje koje omogućuje pokretanje JavaScript koda izvan web preglednika. Temelji se na V8 pogonu razvijenom za preglednik Google Chrome, a koristi model izvođenja s jednom niti i neblokirajućim ulazno-izlaznim operacijama, što ga čini prikladnim za poslužiteljske aplikacije koje istovremeno obrađuju velik broj zahtjeva.

U ovom projektu Node.js ima dvostruku rolu. Prvo, on je okruženje u kojem se izvodi poslužiteljski dio aplikacije, uključujući serverske komponente, Server Actions i API rute opisane u poglavlju 3.2.3. Drugo, on je okruženje u kojem se izvode svi razvojni alati — prevoditelj TypeScripta, alat za izgradnju projekta i pomoćne skripte.

Uz Node.js dolazi i npm (engl. *Node Package Manager*), službeni upravitelj paketima. Ovisnosti projekta i njihove dopuštene verzije definirane su u datoteci `package.json`, dok datoteka `package-lock.json` bilježi točne verzije svakog instaliranog paketa, uključujući i posredne ovisnosti. Time se osigurava da instalacija projekta na drugom računalu rezultira identičnim stanjem ovisnosti.

U datoteci `package.json` definirane su i skripte kojima se pokreću najčešće radnje:

| Naredba | Namjena |
| --- | --- |
| `npm run dev` | pokretanje razvojnog poslužitelja s automatskim osvježavanjem |
| `npm run build` | izgradnja produkcijske verzije aplikacije |
| `npm run start` | pokretanje izgrađene produkcijske verzije |
| `npm run lint` | statička analiza koda alatom ESLint |
| `npm run supabase:start` | pokretanje lokalnog Supabase okruženja |
| `npm run supabase:reset` | ponovna izgradnja lokalne baze i primjena migracija |
| `npm run supabase:push` | primjena migracija na Supabase projekt u oblaku |
| `npm run seed:guide` | unos početnih podataka o vodičima, terminima i rezervacijama |
| `npm run reservations:settle` | zatvaranje rezervacija čiji je termin prošao |

*Tablica 3.1. Popis npm skripti definiranih u projektu (Autor)*

### 3.1.4. Supabase CLI i Docker (lokalno okruženje)

Razvoj aplikacije koja se oslanja na bazu podataka u oblaku nosi rizik da se pogreške tijekom razvoja odražavaju na stvarne podatke. Zbog toga je cijeli razvoj proveden nad lokalnom kopijom Supabase okruženja, koja se pokreće alatom Supabase CLI.

Supabase CLI je alat za naredbeni redak koji na razvojnom računalu pokreće iste komponente koje čine i uslugu u oblaku, i to u obliku Docker kontejnera. Docker je platforma za kontejnerizaciju koja aplikaciju i sve njezine ovisnosti pakira u izolirano okruženje neovisno o operacijskom sustavu domaćina. Zahvaljujući tome, jednom naredbom pokreće se potpuno okruženje bez ručne instalacije baze podataka i pratećih usluga.

Konfiguracija lokalnog okruženja definirana je u datoteci `supabase/config.toml`. Iz nje je vidljivo da se pokreću sljedeće komponente:

- **PostgreSQL** baza podataka, glavna verzija 17, na priključku 54322,
- **API sloj** (PostgREST i pripadajuće usluge) na priključku 54321,
- **Supabase Studio**, grafičko sučelje za pregled podataka i izvođenje SQL upita, na priključku 54323,
- **Inbucket**, lokalni poslužitelj e-pošte na priključku 54324, koji presreće poruke za potvrdu registracije i ponovno postavljanje lozinke, čime je te tokove moguće testirati bez stvarnog slanja e-pošte,
- **Storage**, usluga za pohranu datoteka s ograničenjem veličine datoteke od 50 MiB.

Druga važna mogućnost Supabase CLI-ja je upravljanje migracijama. Sve promjene strukture baze podataka zapisane su kao SQL datoteke u direktoriju `supabase/migrations`, s vremenskim žigom u nazivu koji određuje redoslijed primjene. Takav pristup, poznat kao migracije upravljane verzijama, znači da je struktura baze podataka dio izvornog koda projekta i da se identična baza može ponovno izgraditi na bilo kojem računalu. Naredbom `npm run supabase:reset` lokalna se baza briše i ponovno izgrađuje primjenom svih migracija u nizu, a naredbom `npm run supabase:push` iste se migracije primjenjuju na projekt u oblaku.

*Slika 3.2. Prikaz sučelja Supabase Studio s tablicama lokalne baze podataka (Autor)*

### 3.1.5. Vercel

Vercel je platforma za objavu web aplikacija, razvijena od strane istog poduzeća koje razvija i okvir Next.js. Zbog toga platforma podržava sve mogućnosti okvira bez dodatne konfiguracije, uključujući renderiranje na poslužitelju, keširanje odgovora i izvođenje međuprograma (engl. *middleware*).

Objava se izvodi povezivanjem GitHub repozitorija s platformom. Nakon svake promjene poslane u glavnu granu platforma automatski preuzima izvorni kod, izvodi izgradnju projekta i objavljuje novu verziju, a promjene poslane u ostale grane objavljuje na odvojenim adresama za pregled. Takav postupak naziva se kontinuirana integracija i kontinuirana dostava (engl. *Continuous Integration / Continuous Deployment*).

Pristupni podaci koji se u razvoju nalaze u datoteci `.env` na platformi se postavljaju kao varijable okruženja, pri čemu se razlikuju one dostupne pregledniku, s prefiksom `NEXT_PUBLIC_`, i one koje ostaju isključivo na poslužitelju, kao što su servisni ključ Supabase projekta i ključ usluge za slanje e-pošte.

U projekt je uključen i paket `@vercel/analytics`, čija je komponenta `Analytics` ugrađena u korijenski izgled aplikacije. Ona bilježi osnovne pokazatelje o posjećenosti stranica bez korištenja kolačića za praćenje pojedinačnih korisnika.

## 3.2. Tehnologije

Nakon opisa alata, u ovom su potpoglavlju opisane tehnologije koje čine samu aplikaciju. Redoslijed opisa slijedi slojeve aplikacije: od jezika i knjižnice za izradu sučelja, preko razvojnog okvira i oblikovanja sučelja, do pohrane podataka, validacije, višejezičnosti i slanja e-pošte.

### 3.2.1. TypeScript

TypeScript je programski jezik razvijen od strane Microsofta koji nadograđuje JavaScript sustavom statičkih tipova. Kod pisan u TypeScriptu ne izvodi se izravno, već se prevodi u JavaScript, pri čemu se tipovi koriste isključivo tijekom prevođenja i provjere koda. Budući da je svaki ispravan JavaScript program istovremeno i ispravan TypeScript program, jezik je moguće uvoditi postupno.

Cijela aplikacija napisana je u TypeScriptu, uz uključenu opciju `strict` u datoteci `tsconfig.json`. Ta opcija uključuje skup strožih provjera, od kojih je najvažnija `strictNullChecks`, koja zahtijeva izričitu obradu vrijednosti koje mogu biti `null` ili `undefined`. U aplikaciji u kojoj velik dio podataka dolazi iz baze, gdje su mnoga polja neobavezna, ta provjera sprječava čitav razred pogrešaka koje bi se inače pojavile tek pri izvođenju.

Tipovi domenskih entiteta izdvojeni su u direktorij `lib/types`, s odvojenim datotekama za vodiča, termin, recenziju i popis područja interesa. Isti tipovi koriste se u poslužiteljskim funkcijama koje podatke dohvaćaju iz baze i u komponentama koje ih prikazuju, čime je osigurano da promjena strukture podatka odmah rezultira pogreškom na svim mjestima koja tu strukturu koriste. U datoteci `tsconfig.json` definirana je i putanja `@/*`, koja omogućuje uvoz modula relativno na korijen projekta umjesto nizom relativnih putanja.

U projektu je korištena verzija TypeScripta 5.9.

### 3.2.2. React 19

React je JavaScript knjižnica za izradu korisničkih sučelja, razvijena od strane poduzeća Meta. Temelji se na komponentnom pristupu, u kojem se sučelje sastavlja od manjih, samostalnih i ponovno upotrebljivih dijelova. Svaka komponenta je funkcija koja na temelju ulaznih svojstava (engl. *props*) i vlastitog stanja opisuje kako sučelje treba izgledati, a React se brine za osvježavanje prikaza pri promjeni podataka. Za opis sučelja koristi se sintaksa JSX, koja unutar JavaScript koda dopušta pisanje strukture slične HTML-u.

U aplikaciji je korištena verzija React 19, čija je najvažnija novost za ovaj rad podjela komponenata na serverske i klijentske. Serverske komponente izvode se isključivo na poslužitelju i u preglednik šalju samo rezultat renderiranja, bez pripadajućeg JavaScript koda. Klijentske komponente, označene direktivom `"use client"`, izvode se i u pregledniku te mogu koristiti stanje i reagirati na korisničke radnje.

Ta podjela odredila je organizaciju sučelja u projektu. Stranice koje samo prikazuju podatke iz baze, kao što su popis vodiča ili javni profil pojedinog vodiča, izvedene su kao serverske komponente, čime se podaci dohvaćaju bez dodatnog mrežnog zahtjeva iz preglednika. Klijentske komponente korištene su samo tamo gdje je interakcija nužna — kod filtriranja vodiča, odabira termina u panelu za rezervaciju i prikaza obavijesti.

React 19 uvodi i podršku za asinkrone funkcije koje se izvode na poslužitelju, a pozivaju iz obrasca u pregledniku, o čemu je više riječi u sljedećem potpoglavlju.

### 3.2.3. Next.js 16 – App Router, serverske komponente, Server Actions

Next.js je razvojni okvir izgrađen nad Reactom koji dodaje usmjeravanje, renderiranje na poslužitelju, keširanje i poslužiteljsko izvođenje koda. Za razvoj ove aplikacije korištena je verzija 16 uz sustav usmjeravanja *App Router*.

**Usmjeravanje na temelju datotečnog sustava.** U App Routeru struktura direktorija unutar direktorija `app` određuje adrese aplikacije. Datoteka `page.tsx` predstavlja stranicu, datoteka `layout.tsx` zajednički izgled za sve stranice u tom dijelu aplikacije, a datoteke `loading.tsx` i `error.tsx` stanje učitavanja i prikaz pogreške. Dinamički dijelovi adrese označavaju se uglatim zagradama u nazivu direktorija, pa tako direktorij `app/[locale]/guides/[guideId]` odgovara adresi profila pojedinog vodiča za odabrani jezik. Zajednički izgled s navigacijom i podnožjem definiran je jednom, na razini jezičnog segmenta, i primjenjuje se na sve stranice unutar njega.

**Serverske komponente i dohvat podataka.** U App Routeru su komponente serverske po zadanom. Zahvaljujući tome, stranica može izravno pozvati funkciju koja podatke dohvaća iz baze, bez posrednog API sloja. Poslužiteljska logika izdvojena je u direktorij `lib`, gdje se nalaze funkcije za dohvat podataka o vodičima, njihovim terminima i rezervacijama, pa su same stranice ostale kratke i usredotočene na prikaz.

**Server Actions.** Server Actions su asinkrone funkcije označene direktivom `"use server"` koje se izvode na poslužitelju, a pozivaju se izravno iz HTML obrasca putem svojstva `action`. Njima su u aplikaciji izvedene sve radnje koje mijenjaju podatke — uređivanje profila vodiča i njegove satnice, otvaranje i uklanjanje termina, slanje zahtjeva za rezervaciju, potvrda i odbijanje zahtjeva te otkazivanje rezervacije od strane putnika. Prednost tog pristupa je u tome da za takve radnje nije potrebno pisati zasebne API rute niti u pregledniku ručno slati zahtjeve, a obrasci ostaju funkcionalni i prije nego se JavaScript kod izvrši u pregledniku.

Programski isječak 3.1 prikazuje početak akcije za otkazivanje rezervacije. Vidljiva je direktiva `"use server"`, provjera ulaznih podataka opisana u poglavlju 3.2.6 te preusmjeravanje korisnika nakon izvršene radnje.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  locale: z.string().min(2),
  reservationId: z.string().uuid(),
});

export async function cancelBookingAction(formData: FormData) {
  const parsed = schema.safeParse({
    locale: getString(formData, "locale"),
    reservationId: getString(formData, "reservationId"),
  });

  if (!parsed.success) {
    redirectWith(getString(formData, "locale") || "en", "error", "invalid");
  }
  // ...
}
```

*Programski isječak 3.1. Početak Server Action funkcije za otkazivanje rezervacije (Autor)*

**API rute.** Za slučajeve u kojima odgovor nije HTML stranica korištene su API rute, definirane datotekama `route.ts` u direktoriju `app/api`. Takvih je slučajeva u aplikaciji troje: predaja prijave za turističkog vodiča, dohvat obavijesti koji preglednik povremeno ponavlja te generiranje datoteke s podacima o terminu za uvoz u kalendar. Sve ostale radnje koje mijenjaju podatke, uključujući i učitavanje profilne slike, izvedene su Server Action funkcijama.

**Međuprogram.** Datoteka `middleware.ts` u korijenu projekta sadrži kod koji se izvodi prije obrade svakog zahtjeva. U ovoj aplikaciji on obavlja dvije radnje: određuje jezik na temelju adrese te osvježava korisničku sesiju, kako je opisano u poglavljima 3.2.5 i 3.2.7.

**Optimizacija slika.** Komponenta `next/image` automatski prilagođava veličinu i format slika. Budući da se profilne slike korisnika i vodiča nalaze u Supabase Storageu, u datoteci `next.config.ts` definirani su dopušteni vanjski izvori slika, izvedeni iz adrese Supabase projekta.

### 3.2.4. Tailwind CSS 4 i shadcn/ui (Radix UI)

**Tailwind CSS** je okvir za oblikovanje sučelja koji se temelji na pristupu *utility-first*. Umjesto pisanja zasebnih CSS pravila i imenovanja razreda, izgled se opisuje nizom malih, jednonamjenskih razreda navedenih izravno na HTML elementu. Time se izbjegava održavanje odvojenih CSS datoteka i problem nenamjeravanog utjecaja pravila na druge dijelove sučelja, a izgled komponente vidljiv je na istom mjestu gdje je definirana i njezina struktura.

U projektu je korištena verzija Tailwind CSS 4, koja je u odnosu na prethodne verzije znatno pojednostavnila konfiguraciju. Zasebna konfiguracijska datoteka više nije potrebna; okvir se uključuje jednim uvozom u glavnoj CSS datoteci, a prilagodbe se zapisuju u istoj datoteci. Uključivanje u proces izgradnje izvedeno je preko dodatka `@tailwindcss/postcss`, definiranog u datoteci `postcss.config.mjs`.

Boje aplikacije definirane su u datoteci `app/globals.css` kao CSS varijable, i to u prostoru boja OKLCH. Za razliku od heksadekadskog zapisa, OKLCH boju opisuje svjetlinom, zasićenošću i tonom, pa je moguće izvesti niz boja jednakog vizualnog kontrasta samo promjenom svjetline. Definirana su dva skupa varijabli, za svijetlu i tamnu temu, a prebacivanje između njih izvedeno je knjižnicom `next-themes`.

**shadcn/ui** nije klasična knjižnica komponenata koja se instalira kao ovisnost, već zbirka komponenata čiji se izvorni kod kopira u projekt. Komponente se nalaze u direktoriju `components/ui` i dio su izvornog koda aplikacije, što znači da se mogu slobodno mijenjati. Konfiguracija je zapisana u datoteci `components.json`, iz koje je vidljivo da je korišten stil *new-york*, osnovna boja *neutral* te da su komponente prilagođene serverskim komponentama Reacta.

Same komponente izgrađene su nad knjižnicom **Radix UI**, koja pruža neoblikovane (engl. *unstyled*) komponente s ispravno izvedenim ponašanjem — upravljanjem fokusom, podrškom za tipkovnicu i atributima za čitače zaslona. Radix time rješava dio koji je pri samostalnoj izradi najzahtjevniji i najčešće nepotpun, a Tailwind se koristi za izgled. U aplikaciji su tako izvedeni padajući izbornici za odabir područja interesa, jezika i načina sortiranja u pregledniku vodiča, potvrdni okviri, oznake polja obrazaca, prikaz profilnih slika s rezervnim inicijalima te razdjelnici sadržaja.

Za ikone je korištena knjižnica `lucide-react`. Termini se ne prikazuju kalendarom, već popisom otvorenih blokova vremena grupiranim po datumu, jer je jedinica koju putnik odabire konkretan blok, a ne dan.

### 3.2.5. Supabase – PostgreSQL, Auth, Storage

Supabase je platforma koja pruža skup poslužiteljskih usluga izgrađenih oko relacijske baze podataka PostgreSQL. Za razliku od rješenja koja podatke pohranjuju u vlastitom, zatvorenom formatu, Supabase koristi standardni PostgreSQL, pa su svi podaci dostupni običnim SQL upitima. U ovoj aplikaciji korištene su tri usluge platforme: baza podataka, autentikacija i pohrana datoteka.

**PostgreSQL.** Podaci aplikacije pohranjeni su u PostgreSQL bazi podataka, glavne verzije 17. Relacijski model odabran je zato što je domena aplikacije izrazito relacijska: vodič otvara više termina, svaki termin može biti zauzet jednom aktivnom rezervacijom, rezervacija je povezana s putnikom, a vodič ima i više recenzija. Ograničenja stranih ključeva tu povezanost provode na razini baze, čime se sprječava nastanak nedosljednih zapisa. Struktura baze i cjelovit ER dijagram opisani su u poglavlju 4.

**Sigurnost na razini redova.** Najvažnija mogućnost platforme za ovaj rad je *Row Level Security* (RLS), mehanizam PostgreSQL-a kojim se pravila pristupa definiraju na razini pojedinačnog zapisa, a ne u kodu aplikacije. Za svaku tablicu definirane su politike koje određuju koje redove pojedini korisnik smije čitati ili mijenjati, a baza ta pravila primjenjuje na svaki upit. Iz migracija u projektu vidljive su, primjerice, politike koje vodiču dopuštaju otvaranje i uklanjanje isključivo vlastitih termina te čitanje i uređivanje isključivo rezervacija na vlastitom profilu, a putniku čitanje isključivo vlastitih rezervacija. Prednost tog pristupa je što autorizacija ne ovisi o tome da svaki upit u kodu bude ispravno napisan.

Za radnje koje se moraju izvesti izvan tih pravila — kao što je administratorski pregled prijava za vodiča ili upis u tablicu vodiča nakon prihvaćanja prijave — koristi se odvojeni klijent stvoren servisnim ključem, koji zaobilazi RLS. Taj ključ nikada se ne šalje pregledniku i koristi se isključivo u poslužiteljskom kodu, nakon prethodne provjere da je korisnik administrator.

**Supabase Auth.** Autentikacija korisnika izvedena je uslugom Supabase Auth, koja podržava prijavu e-poštom i lozinkom, potvrdu adrese e-pošte, ponovno postavljanje lozinke te prijavu putem vanjskih pružatelja identiteta. U aplikaciji su korištene prijava e-poštom i lozinkom te prijava putem Google računa protokolom OAuth 2.0.

Za integraciju s Next.js-om korišten je paket `@supabase/ssr`, koji sesiju čuva u kolačićima umjesto u lokalnoj pohrani preglednika. To je nužno zato što serverske komponente nemaju pristup pohrani preglednika, a kolačići se šalju uz svaki zahtjev. Paket definira dvije vrste klijenta: `createBrowserClient` za klijentske komponente i `createServerClient` za poslužiteljski kod, koji kolačiće čita i postavlja putem Next.js API-ja za kolačiće. Oba klijenta izdvojena su u direktorij `lib/supabase`. Programski isječak 3.2 prikazuje stvaranje poslužiteljskog klijenta.

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}
```

*Programski isječak 3.2. Stvaranje poslužiteljskog Supabase klijenta (Autor)*

Budući da pristupni token ima ograničeno trajanje, u međuprogramu se pri svakom zahtjevu poziva funkcija koja sesiju osvježava i postavlja nove kolačiće, čime korisnik ostaje prijavljen tijekom dužeg korištenja aplikacije.

**Supabase Storage.** Slike koje korisnici učitavaju — profilne slike putnika i vodiča — pohranjene su uslugom Supabase Storage, koja datoteke organizira u imenovane spremnike (engl. *bucket*) i pristup njima uređuje istim mehanizmom politika kao i podatke u tablicama. Budući da je nositelj ponude sam vodič, a ne katalog proizvoda sa slikama, aplikacija koristi jedan spremnik, `avatar`, čiji su naziv i podmapa definirani varijablama okruženja s pripadajućim zadanim vrijednostima. U bazi se pohranjuje samo putanja datoteke, dok se javna adresa za prikaz izvodi u trenutku renderiranja.

### 3.2.6. Zod (validacija obrazaca)

Zod je knjižnica za deklarativnu provjeru ispravnosti podataka u TypeScriptu. Shema se definira kao objekt koji opisuje očekivani oblik podatka, a knjižnica na temelju te sheme provodi provjeru pri izvođenju i istovremeno izvodi odgovarajući TypeScript tip. Time se izbjegava dvostruko definiranje istog oblika podatka — jednom za provjeru, a jednom za sustav tipova.

Potreba za takvom provjerom proizlazi iz načina na koji su izvedeni obrasci u aplikaciji. Obrasci su izvedeni standardnim HTML elementom `<form>` koji poziva Server Action opisan u poglavlju 3.2.3, pa poslužiteljska funkcija kao ulaz dobiva objekt `FormData` u kojem su sve vrijednosti neprovjereni tekstualni podaci. Kako podaci koji dolaze iz preglednika načelno nisu pouzdani, provjera se provodi na poslužitelju, prije svakog pristupa bazi podataka.

Zod je zato korišten u svim Server Action funkcijama i API rutama koje mijenjaju podatke. Programski isječak 3.3 prikazuje shemu za prijavu za turističkog vodiča, u kojoj su vidljivi uklanjanje praznina, ograničenja najmanje i najveće dužine teksta, provjera oblika adrese e-pošte te zahtjev da korisnik potvrdi uvjete korištenja.

```ts
import { z } from "zod";

export const guideApplicationCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(40),
  location: z.string().trim().min(1).max(120),
  languages: z.string().trim().min(1).max(200),
  experience: z.string().trim().min(1).max(2000),
  tourIdeas: z.string().trim().min(1).max(4000),
  agreedToTerms: z.literal(true),
  locale: z.string().trim().min(2).max(10).optional(),
});

export type GuideApplicationCreateInput = z.infer<
  typeof guideApplicationCreateSchema
>;
```

*Programski isječak 3.3. Zod shema za provjeru prijave za turističkog vodiča (Autor)*

Za provjeru se koristi metoda `safeParse`, koja pri neispravnom podatku ne prekida izvođenje izuzetkom, već vraća rezultat s opisom pogreške. Time poslužiteljska funkcija može korisnika vratiti na obrazac s odgovarajućom porukom. Izraz `z.infer` u istom isječku iz sheme izvodi TypeScript tip, koji se dalje koristi u kodu koji podatke zapisuje u bazu, pa promjena sheme automatski povlači provjeru na svim mjestima gdje se taj tip koristi.

Osnovna provjera ispravnosti provodi se i u pregledniku, atributima HTML elemenata kao što su `required`, `type="email"` i `maxlength`, radi trenutne povratne informacije korisniku. Ta provjera služi isključivo kao pomoć pri unosu; mjerodavna je provjera na poslužitelju.

### 3.2.7. next-intl (višejezičnost)

Aplikacija je namijenjena i domaćim i stranim korisnicima, pa je podrška za više jezika bila zahtjev od početka razvoja. Sučelje je dostupno na hrvatskom i engleskom jeziku, uz engleski kao zadani.

Za višejezičnost je korištena knjižnica next-intl, prilagođena App Routeru okvira Next.js. Prijevodi su zapisani u datotekama `messages/en.json` i `messages/hr.json` kao ugniježđeni objekti, u kojima se tekstovi dohvaćaju ključem. Konfiguracija je izdvojena u direktorij `i18n`, u kojem datoteka `routing.ts` definira popis podržanih jezika i zadani jezik, a datoteka `request.ts` za svaki zahtjev određuje jezik i učitava odgovarajuću datoteku s prijevodima.

Odabrani je jezik dio adrese, kao prvi segment putanje — na primjer `/hr/browse` i `/en/browse`. Zbog toga je cijela aplikacija smještena u direktorij `app/[locale]`. Prednost takvog pristupa je što je svaka jezična verzija stranice dostupna na vlastitoj adresi, pa je moguće podijeliti poveznicu na određenom jeziku, a stranice mogu biti odvojeno indeksirane od strane pretraživača. Preusmjeravanje korisnika bez jezičnog segmenta u adresi obavlja međuprogram, stvoren funkcijom `createMiddleware`.

Knjižnica pruža i pomoćne funkcije za usmjeravanje — `Link`, `redirect`, `usePathname` i `useRouter` — koje trenutni jezik automatski dodaju u adresu, pa ga nije potrebno navoditi pri svakoj poveznici. Osim toga, ista knjižnica koristi se i za oblikovanje datuma, vremena i novčanih vrijednosti u skladu s odabranim jezikom, što je u aplikaciji s terminima i satnicama vodiča jednako važno kao i prijevod samog teksta.

U projektu je korištena verzija next-intl 4.7.

### 3.2.8. Resend (slanje e-pošte)

Slanje e-pošte iz web aplikacije zahtijeva uslugu koja se brine za dostavljivost poruka, budući da poruke poslane s nepoznatih poslužitelja često završavaju u neželjenoj pošti. Za tu je namjenu korišten Resend, usluga za programsko slanje e-pošte s jednostavnim HTTP API-jem.

U aplikaciji Resend se koristi za obavještavanje administratora o novoj prijavi za turističkog vodiča. Kada korisnik pošalje prijavu, ona se zapisuje u bazu podataka, a administratorima se šalje poruka s poveznicom na zaslon za pregled prijave.

Poruke za potvrdu registracije i ponovno postavljanje lozinke ne šalju se ovom uslugom, već ih šalje sama usluga Supabase Auth u okviru svojih tokova autentikacije.

Slanje je izdvojeno u funkciju `sendAdminEmail` u datoteci `lib/email/send-admin-email.ts`, koja poziva Resend API standardnom funkcijom `fetch`, bez dodatne ovisnosti u projektu. Funkcija se konfigurira trima varijablama okruženja: `RESEND_API_KEY` kao pristupnim ključem, `RESEND_FROM` kao adresom pošiljatelja i `ADMIN_EMAILS` kao popisom adresa primatelja odvojenih zarezom.

Pri izvedbi je posebna pažnja posvećena tome da slanje e-pošte ne smije spriječiti osnovnu funkcionalnost. Ako varijable okruženja nisu postavljene, funkcija ne prijavljuje pogrešku, već vraća rezultat s oznakom da je slanje preskočeno, pa se prijava uspješno pohranjuje i bez konfigurirane e-pošte. Isto vrijedi i za pogreške pri komunikaciji s uslugom, koje se hvataju i vraćaju kao opisni rezultat. Time slanje obavijesti ostaje neobavezan, dodatni korak, a razvoj aplikacije moguć je i bez pristupnog ključa usluge.

## 3.3. Pregled korištenih verzija

Tablica 3.2 sadrži popis glavnih tehnologija i njihovih verzija korištenih pri izradi aplikacije.

| Tehnologija | Verzija | Namjena |
| --- | --- | --- |
| Next.js | 16.1 | razvojni okvir, usmjeravanje, renderiranje na poslužitelju |
| React | 19.2 | izrada korisničkog sučelja |
| TypeScript | 5.9 | programski jezik |
| Tailwind CSS | 4.1 | oblikovanje sučelja |
| PostgreSQL | 17 | relacijska baza podataka |
| @supabase/supabase-js | 2.89 | pristup Supabase uslugama |
| @supabase/ssr | 0.8 | upravljanje sesijom putem kolačića |
| next-intl | 4.7 | višejezičnost |
| Zod | 3.25 | provjera ispravnosti podataka |
| Node.js | 25.9 | izvršno okruženje |
| npm | 11.1 | upravitelj paketima |

*Tablica 3.2. Popis glavnih tehnologija i verzija (Autor)*
