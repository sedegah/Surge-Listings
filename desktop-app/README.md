# Surge Listings — Windows Desktop Application

Standalone Windows Desktop Application for the **Surge Listings** platform, built using Electron and packaged with electron-builder.

## Architecture & Isolation

- **Fully Isolated:** All desktop configuration, dependencies, icons, and build scripts are contained within `desktop-app/`.
- **Zero Website Impact:** The existing website code, backend database, Cloudflare Workers API, and Vercel hosting remain 100% untouched and independent.
- **Live Cloud Loading:** The application loads the production platform (`https://surge-listings.vercel.app/login`) in a secure, chromeless desktop window.
- **Offline Guard:** In the event of network disruption, a native offline screen provides diagnostics and automatic reconnection.

## Security Controls

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- Strict domain restriction to `surge-listings.vercel.app`
- All external links are opened safely in the user's default web browser

## Development & Testing

From within the `desktop-app/` directory:

```powershell
cd desktop-app
npm install
npm start
```

## Packaging & Installer Generation

To build the standalone Windows NSIS Installer (`Surge-Listings-Setup.exe`):

```powershell
cd desktop-app
npm run dist
```

The compiled installer will be generated in `desktop-app/dist/Surge-Listings-Setup.exe`.

