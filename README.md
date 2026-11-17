# Fotostrip

Een mobiele webapp die drie live camerabeelden lokaal samenstelt tot een PNG-fotostrip. De app heeft geen database, upload-endpoint of account. Opnames blijven alleen in het geheugen van de geopende pagina en verdwijnen wanneer die wordt gesloten of ververst.

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
docker build -t fotostrip .
docker run --rm -p 8080:8080 fotostrip
```

De container serveert de statische client via poort 8080. De uiteindelijke omgeving moet HTTPS aanbieden voor live cameratoegang.

## Privacy

De browser vraagt alleen na een gebruikersactie toegang tot de camera. Foto's worden in de browser verwerkt en niet naar een server verstuurd. De download- of deelactie wordt door de gebruiker gestart; de browser of telefoon bepaalt waar het bestand terechtkomt.