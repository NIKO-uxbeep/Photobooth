# Polaroid App

Een mobiele fotobooth met wisselbare thema's. Tik op **Start** om de camera te openen; de app telt af voor elk van de drie automatische opnames. Daarna verschijnt op een apart scherm een downloadbare PNG-collage in Instagram Story-formaat (1080 x 1920), met drie foto's als speelse, schuin geplaatste polaroids met tape en krijtdoodles op een echte foto van een kerstboom met rode en gouden kerstballen, met glinstering en sneeuw. Met **Opnieuw** wis je het resultaat en ga je terug naar het startscherm. Er is geen database, upload-endpoint of account.

## Thema's

De app heeft een **Kerst**- en een **Babyshower (jongen)**-thema, elk met eigen kleuren, teksten, decoratie, collage-achtergrond en muziek. Wisselen gaat via een verborgen menu: houd op de startpagina de tekst "Foto's blijven op dit apparaat" onderaan ongeveer 1,5 seconde ingedrukt. De keuze wordt op het apparaat onthouden.

## Lokaal starten

```powershell
npm install
npm run dev
```

Open `http://localhost:8080`. Cameratoegang op een telefoon vereist HTTPS; alleen localhost is uitgezonderd.

## Controleren en bouwen

```powershell
npm run check
npm run build
docker build -t polaroid-app .
docker run --rm -p 8080:8080 polaroid-app
```

De container serveert de statische client via poort 8080. De uiteindelijke omgeving moet HTTPS aanbieden voor live cameratoegang.

## Privacy

De browser vraagt alleen na een gebruikersactie toegang tot de camera. Foto's worden in de browser verwerkt en niet naar een server verstuurd. De download- of deelactie wordt door de gebruiker gestart; de browser of telefoon bepaalt waar het bestand terechtkomt.

## Beeldbronnen

De kerstcollage gebruikt een foto van een [kerstboom met rode en gouden kerstballen](https://unsplash.com/photos/a-christmas-tree-with-red-and-gold-ornaments-EoDkLL6SKkE) van Unsplash ([licentie](https://unsplash.com/license)), lokaal meegeleverd in de app. De babyshowercollage wordt volledig in de app getekend.