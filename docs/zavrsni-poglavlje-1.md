# 1. UVOD

Web aplikacijama se pristupa putem internetskog preglednika, bez instalacije na korisnikovom uređaju, pa su dostupne na svim uređajima s mrežnom vezom. Zato se danas velik dio turističke ponude, od smještaja do ulaznica i vođenih tura, rezervira upravo tako. U ovom je radu opisan razvoj web aplikacije koja putnika povezuje s lokalnim vodičem, pri čemu se ne rezervira unaprijed pripremljena tura, nego blok vremena samog vodiča.

## 1.1. Motivacija i opis problema

Turistička ponuda većih gradova iscrpljuje se brže od vremena koje posjetitelji u njima provedu. U Zagrebu se sve atrakcije koje se redovito pojavljuju u vodičima mogu obići u jednom do dva dana. Posjetitelj koji ostaje dulje nakon toga nema jasan sljedeći korak, iako grad ima još sadržaja. Taj sadržaj nije zapisan u ponudi, nego ga poznaju ljudi koji u gradu žive.

Postojeće platforme to znanje prenose samo ako se može zapakirati u proizvod, odnosno u turu s poznatom rutom, trajanjem i cijenom po osobi. Iz toga slijede tri problema. Vodič koji nije osmislio turu na takvim platformama nije vidljiv, iako je on ono što putnik traži. Fiksna ruta i trajanje uklanjaju prilagodbu interesima putnika, a pretraga je oblikovana nad svojstvima ponude, pa putnik ne može tražiti osobu koja govori njegov jezik i slobodna je u vrijeme kada je on u gradu. Uz to, platforme koje provjeravaju vodiče rade to kroz agencijsko posredovanje, dok otvorenije platforme ne provjeravaju ni identitet ni je li profil još aktivan. Ti su nedostaci detaljno analizirani u poglavlju 2.

## 1.2. Cilj i doprinos rada

Cilj rada je izraditi web aplikaciju u kojoj je predmet rezervacije vrijeme lokalnog vodiča. Nositelj ponude je vodič, a ne tura, pa satnica, područja interesa, jezici i najveća veličina grupe pripadaju njegovu profilu. Putnik rezervira slobodan termin koji je vodič sam otvorio, a cijena se izračunava kao satnica pomnožena s trajanjem termina. Broj osoba pritom je samo gornja granica i ne množi cijenu. Pregledavanje vodiča je besplatno i ne zahtijeva registraciju, koja je potrebna samo za slanje zahtjeva za rezervaciju. Aplikacija ne posreduje u plaćanju, nego iznos samo prikazuje.

Rezultat rada je aplikacija koja pokriva cijeli tok, od prijave za vodiča i njezine administratorske obrade, preko pretraživanja vodiča i slanja zahtjeva za rezervaciju, do potvrde vodiča i ocjene nakon susreta. Aplikacija je izrađena u razvojnom okviru Next.js uz knjižnicu React i programski jezik TypeScript, a za bazu podataka, autentikaciju i pohranu datoteka korištena je platforma Supabase. Pristup podacima nije riješen samo u kodu aplikacije, nego politikama sigurnosti na razini redova u bazi podataka PostgreSQL.

## 1.3. Struktura rada

U drugom poglavlju analizirane su četiri postojeće platforme te su iz njihovih nedostataka izvedeni zahtjevi na sustav i korisničke role. Treće poglavlje opisuje korištene alate i tehnologije. Četvrto poglavlje prikazuje arhitekturu sustava, model podataka i ER dijagram baze. Peto poglavlje opisuje implementaciju aplikacije po dijelovima sučelja i najveći je dio rada. U šestom je poglavlju opisano testiranje i objava aplikacije, a u sedmom je dan zaključak.
