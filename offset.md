# Crazy Taxi (PC Steam / 2002) – Modder Offset- & Adress-Referenz
**Dokumentation aller relevanten Speicheradressen, Strukturen, Hooks und Offsets aus `SRC_LyrasTextureMod/src`**

Diese Datei dient als vollständige technische Referenz für Entwickler und Modder von *Crazy Taxi* (PC Steam / 2002 Release, 32-Bit x86, Base Address: `0x00400000`). Sie dokumentiert alle im Source Code von `SRC_LyrasTextureMod/src` verwendeten Adressen, Speicherlayouts, Bitmasken, Funktions-Hooks und Dateiformate.

---

## Inhaltsverzeichnis
1. [Globale Engine-Adressen & Pointer-Chains](#1-globale-engine-adressen--pointer-chains)
2. [Master Texture Descriptor Array (0x01B09938)](#2-master-texture-descriptor-array-0x01b09938)
3. [Funktions-Hooks & Native Codestellen](#3-funktions-hooks--native-codestellen)
4. [Sega Container Tabellen (26 statische Tabellen im EXE)](#4-sega-container-tabellen-26-statische-tabellen-im-exe)
5. [Sega Container Entry Struktur (16 Bytes) & Bitmasken](#5-sega-container-entry-struktur-16-bytes--bitmasken)
6. [Sega Dreamcast/Naomi Texture Memory Pool](#6-sega-dreamcastnaomi-texture-memory-pool)
7. [Direct3D 9 Device Auflösung & IAT Hook](#7-direct3d-9-device-auflösung--iat-hook)
8. [Mod-Eigene Binärformate (LTM1 & LTMC)](#8-mod-eigene-binärformate-ltm1--ltmc)
9. [Übersicht aller relevanten Codestellen in `src/`](#9-übersicht-aller-relevanten-codestellen-in-src)

---

## 1. Globale Engine-Adressen & Pointer-Chains

| Adresse | Typ | Name im Code | Was dort gespeichert ist / Zweck |
|---|---|---|---|
| `0x00400000` | ImageBase | Base Address | Basis-Ladeadresse der `Crazy Taxi.exe` (Win32 PE x86). |
| `0x01B09938` | `MasterEntry[8192]` | `masterBase` | Globales Master Texture Descriptor Array. Enthält Deskriptoren für alle im Spiel aktiven Texturen (Models + Stage). |
| `0x01B7A838` | `uint32_t*` (Pointer) | `activeStageTable` | Zeigt auf die Startadresse der Sega-Tabelle der aktuell geladenen Stage (z. B. `0x01364620` für `texDC1`, `0x01365B30` für `texDC2`, `0x01366F80` für `texDC3`). |
| `0x01B7A6E0` | `uint32_t*` (Index) | `baseIdx` | Enthält den Basis-Index in der Master-Tabelle für Modell-Texturen (`texDC0`). Formel: `masterId = tableIndex + baseIdx`. |
| `0x01B7AC00` | `uintptr_t*` (Pointer) | `pSegaRenderer` | Zeiger auf die zentrale Sega-Renderer-Struktur. Bei Offset `+0x18` liegt der primäre `IDirect3DDevice9*` COM-Zeiger. |
| `0x01B7AB04` | `uintptr_t*` (Pointer) | `pContainer` | Zeiger auf D3D Container-Struktur (Fallback). Bei Offset `+0x08` liegt ein alternativer `IDirect3DDevice9*` Zeiger. |
| `0x005342B4` | `void**` (IAT Entry) | `IAT_D3DXCreateTexture` | Import Address Table Eintrag für `d3dx9_43.dll!D3DXCreateTextureFromFileInMemoryEx`. Wird für Menü- und JPK-Texturen gepatcht. |

---

## 2. Master Texture Descriptor Array (`0x01B09938`)

Die Master-Tabelle verwaltet sämtliche Texturen der 3D-Welt. Sie besitzt exakt **8.192 (`0x2000`) Slots**. Jeder Eintrag ist **24 Bytes (`0x18`)** groß.

### 2.1 Adressberechnung
$$\text{Adresse des Eintrags } i = \text{0x01B09938} + (i \times 24)$$

### 2.2 Speicherlayout eines Eintrags (24 Bytes)
| Byte-Offset | Datentyp | Feld | Beschreibung |
|---|---|---|---|
| `+0x00` | `void*` (4 Bytes) | `pTexObj` | Zeiger auf das interne Sega Texture Object Wrapper. Wenn `nullptr`, ist der Slot unbenutzt. |
| `+0x04` | `uint32_t` (4 Bytes) | `flags` | Interne Engine-Flags (Render-Status, Format-Metadaten). |
| `+0x08` | `float` (4 Bytes IEEE 754) | `width` | Originale Texturbreite in Pixeln (z. B. `128.0f`, `256.0f`). |
| `+0x0C` | `float` (4 Bytes IEEE 754) | `height` | Originale Texturhöhe in Pixeln (z. B. `128.0f`, `256.0f`). |
| `+0x10` | `uint32_t` (4 Bytes) | `pData` | Speicherzeiger in den Sega Memory Pool (`0x0CB40000 + relOffset`). |
| `+0x14` | `uint32_t` (4 Bytes) | `reserved` | Status-Flags und interne Referenzen. |

### 2.3 Substruktur `pTexObj` (Sega Texture Object)
Folgt man dem Zeiger `pTexObj` (`+0x00`), liegt im Speicher:
| Byte-Offset | Datentyp | Feld | Beschreibung |
|---|---|---|---|
| `+0x00` | `uint32_t` | `refCount` | Referenzzähler des Objekts. |
| `+0x0C` | `IDirect3DTexture9*` | `pD3DTexture` | **Zentraler Modding-Punkt**: Der aktive Direct3D 9 Textur-Zeiger. Wird an `SetTexture(0, ...)` übergeben. Durch Überschreiben dieses Zeigers wird die Textur live im Spiel ersetzt! |

### 2.4 Slot-Partitionierung
- **Slots `0` bis `1999` (`< 0x7D0`)**: Dynamische 3D-Objekt- & Fahrzeugtexturen (`texDC0`: Taxis, Fahrer wie Axel/B.D. Joe, Passanten, Reifen, Ampeln).
  - *Wichtig*: Slot $i$ entspricht **nicht** direkt dem Index $i$ in `texDC0`. Die Zuordnung erfolgt über `pData - 0x0CB40000` und die Dimensionsvalidierung (`width` / `height`).
- **Slots `2000+` (`>= 0x7D0`)**: 3D-Stage- & Welttexturen (Straßen, Gebäude, Berge, Bäume).
  - Chunk-Index in der Stage-Datei: $\text{chunkIndex} = \text{slotId} - \text{0x7D0}$.

---

## 3. Funktions-Hooks & Native Codestellen

| Adresse | Aufrufkonvention | Funktion | Parameter / Register | Beschreibung / Zweck für Modder |
|---|---|---|---|---|
| `0x00492230` | `__cdecl` / Custom Register | `LoadModelTexture` | Stack: `tableIndex` (`[esp+4]`)<br>Reg: `edx` = `tablePtr` | Wird aufgerufen, wenn 3D-Fahrzeuge, Fahrer und Props aus `texDC0.bin` in die Master-Tabelle geladen werden. Eignet sich ideal zum Injizieren eigener HD-Auto- und Charakter-Skins. |
| `0x0048B7A0` | Custom Register | `LoadStageTexture` | Reg: `eax` = `entryPtr`<br>Reg: `ecx` = `id` (Master Slot ID) | Wird aufgerufen, wenn 3D-Welt- und Stage-Geometrie-Texturen geladen werden. Parameter `id` ist die Slot-ID ($\ge \text{0x7D0}$). Eignet sich für HD-Welt- und Straßen-Mods. |
| `0x00481200` | Custom Register | `SegaRenderer::SetTexture` | Reg: `eax` = `pTexObj` | Wird unmittelbar vor dem Direct3D 9 Aufruf `SetTexture(0, pTexture)` ausgeführt. Ermöglicht Live-Swapping des `pD3DTexture`-Zeigers (`pTexObj + 0x0C`), Sampler-State-Optimierungen (Anisotropes Filtern, Mipmaps) und Hotkey-Polling. |
| `0x0048CBD0` | Native EXE Routine | Sega Untwiddle Decoder | Eingabe: `x`, `y` Koordinaten | Native Entschlüsselung des Sega Dreamcast / Naomi PowerVR2 Morton Bit-Interleavings ($Y$ auf geraden Bits, $X$ auf ungeraden Bits). |
| `0x0048ED08` | Native EXE Routine | Sega VQ Decoder | 2048-Byte Codebook + 2x2 Texel Blocks | Dekodiert Vector-Quantized Texturchunks im Originalspiel. |

### Assembly Hook Details
- **`hkLoadModelTexture` (an `0x00492230`)**:
  - Übergibt `tablePtr` (`edx`) und `tableIndex` an den Post-Load-Handler.
  - Sichere `__declspec(naked)` Trampolin-Struktur mit Stack-Restaurierung.
- **`hkLoadStageTexture` (an `0x0048B7A0`)**:
  - Erhält `entryPtr` in `eax` und `id` in `ecx`.
- **`hkSegaSetTexture` (an `0x00481200`)**:
  - Erhält `pTexObj` in `eax`. Springt nach Ausführung via `jmp` zum Originalcode weiter.

---

## 4. Sega Container Tabellen (26 statische Tabellen im EXE)

Im `.data` / `.rdata`-Bereich der `Crazy Taxi.exe` befinden sich 26 statisch kompilierte Tabellen, die die Chunks der jeweiligen `.bin`-Dateien aus `data_little/` beschreiben:

| Tabellen-Adresse in EXE | CRC32 Archive-ID | Name | Kategorie | Inhalt / Verwendung |
|---|---|---|---|---|
| `0x0135EFD0` | `0x8E8E5F62` | `sprDC0` | `2D_SPRITE` | HUD, Tachometer, Ganganzeige, Geschwindigkeitsanzeige |
| `0x0135F790` | `0xB16EA5E6` | `sprCENG` | `2D_SPRITE` | Englische Untertitel und Fahrgast-Stempel |
| `0x0135F8D0` | `0xBE797BD3` | `sprCJAP` | `2D_SPRITE` | Japanische Stempel und Texte |
| `0x0135FA10` | `0xBB5127CE` | `sprCFRE` | `2D_SPRITE` | Französische Stempel |
| `0x0135FAF0` | `0xFC26A882` | `sprGAME` | `2D_SPRITE` | Navigations-Pfeile, Geld-Zähler, Highscore, Ranglisten-Icons |
| `0x01360890` | `0x3CC34CA8` | `sprCGER` | `2D_SPRITE` | Deutsche Stempel |
| `0x01360910` | `0x94E7E0CE` | `sprCSPA` | `2D_SPRITE` | Spanische Stempel |
| `0x01360960` | `0x65DF85B6` | `sprBOX` | `2D_SPRITE` | UI-Dialogboxen, Hintergrund-Rahmen |
| `0x01360B00` | `0xA208A39D` | `sprMENU` | `2D_SPRITE` | Titelbildschirm, Fahrerauswahl, Menü-Icons |
| `0x01360E70` | `0x5EA60CE0` | `sprMJAP` | `2D_SPRITE` | Japanische Menütexte |
| `0x01361480` | `0x51B1D2D5` | `sprMENG` | `2D_SPRITE` | Englische Menütexte |
| `0x01361BA0` | `0x5436974C` | `texDC0` | `3D_OBJECT` | **Haupt-Fahrzeuge** (Axel, B.D. Joe, Gena, Gus), Verkehr, Passanten, Requisiten |
| `0x01363710` | `0x5B8E50FD` | `sprMFRE` | `2D_SPRITE` | Französische Menütexte |
| `0x01363750` | `0xDC1C3B9B` | `sprMGER` | `2D_SPRITE` | Deutsche Menütexte |
| `0x01363790` | `0x743897FD` | `sprMSPA` | `2D_SPRITE` | Spanische Menütexte |
| `0x013637E0` | `0x77019AED` | `sprCOMM` | `2D_SPRITE` | Gemeinsame UI-Elemente, Buttons, Pfeile |
| `0x01363CA0` | `0xFE240B5B` | `sprPAL` | `2D_SPRITE` | PAL 50/60Hz Auswahlgrafiken |
| `0x01363F00` | `0xF3C25D97` | `sprPENG` | `2D_SPRITE` | Englisches Pause-Menü |
| `0x01364160` | `0xF9FDDFBF` | `sprPFRE` | `2D_SPRITE` | Französisches Pause-Menü |
| `0x013644A0` | `0x7E6FB4D9` | `sprPGER` | `2D_SPRITE` | Deutsches Pause-Menü |
| `0x01364500` | `0xD64B18BF` | `sprPSPA` | `2D_SPRITE` | Spanisches Pause-Menü |
| `0x01364560` | `0x3E0C32B1` | `sprGENG` | `2D_SPRITE` | Englischer Game-Over Bildschirm |
| `0x013645C0` | `0x311BEC84` | `sprGJAP` | `2D_SPRITE` | Japanischer Game-Over Bildschirm |
| `0x01364620` | `0x2331A7DA` | `texDC1` | `3D_STAGE` | **Stage 1 (Arcade / San Francisco)** |
| `0x01365B30` | `0xBA38F660` | `texDC2` | `3D_STAGE` | **Stage 2 (Original / Around the Bay)** |
| `0x01366F80` | `0xCD3FC6F6` | `texDC3` | `3D_STAGE` | **Crazy Box** Mini-Spiele & Challenges |

---

## 5. Sega Container Entry Struktur (16 Bytes) & Bitmasken

Jede der oben genannten 26 Tabellen ist ein Array von **16-Byte Einträgen**. Das Ende der Tabelle ist markiert durch ein Sentinel-Element (`dims == 0xFFFFFFFF && fmt == 0xFFFFFFFF`).

### 5.1 Byte-Layout eines Eintrags (16 Bytes)
```
+0x00: uint32_t dims      (Low 16-Bit: Breite, High 16-Bit: Höhe)
+0x04: uint32_t fmt       (Low Byte: Pixelformat, High Byte: Datenlayout)
+0x08: uint32_t pData     (Pointer in Sega-RAM: 0x0CB40000 + relOffset)
+0x0C: uint32_t pTex      (Pointer auf internes Texture-Objekt)
```

### 5.2 Bitmasken für `dims` (+0x00)
- **Breite (Width)**: `dims & 0xFFFF`
- **Höhe (Height)**: `(dims >> 16) & 0xFFFF`

### 5.3 Bitmasken für `fmt` (+0x04)

#### A. Pixelformat (`fmt & 0xFF`):
- `0x00` = `ARGB1555`: 1-Bit Punch-Through Alpha, 5-Bit R, 5-Bit G, 5-Bit B.
  - Modder-Regel: Alpha ist entweder 0 (transparent) oder 255 (opak).
- `0x01` = `RGB565`: 5-Bit R, 6-Bit G, 5-Bit B.
  - Modder-Regel: Streng 100% opak ($\text{Alpha} = 255$). Keine Transparenz erlaubt!
- `0x02` = `ARGB4444`: 4-Bit Alpha, 4-Bit R, 4-Bit G, 4-Bit B.
  - Modder-Regel: Weiche Alphagradienten (16 Stufen).

#### B. Speicher- & Kompressionslayout (`(fmt >> 8) & 0xFF`):
- `0x00`, `0x09`, `0x0B` = `LIN` (Linear 16bpp): Unkomprimierte Scanlines.
- `0x01` = `TWID` (Twiddled 16bpp): Morton-Bit Anordnung ohne Mipmaps.
- `0x02` = `TWID_MM` (Twiddled mit Mipmaps): Morton-Bit Anordnung mit Mipmap-Pyramide.
- `0x03`, `0x10` = `VQ` (Vector Quantized): 2048-Byte Codebook + 1 Byte pro 2x2 Texel-Block.
- `0x04`, `0x11` = `VQ_MM` (Vector Quantized mit Mipmaps).

---

## 6. Sega Dreamcast/Naomi Texture Memory Pool

Die PC-Portierung emuliert den Dreamcast/Naomi VRAM-Pool an festen virtuellen Adressen:
- **Speicherbereich**: `0x0CB40000` bis `0x0F000000`
- **Basis-Adresse**: `0x0CB40000`

### Relative Offset-Berechnung
Aus dem Pointer `pData` (im Master Table Entry `+0x10` oder Sega Table Entry `+0x08`) berechnet sich der Dateioffset in der jeweiligen `.bin`-Datei:
$$\text{relOffset} = \text{pData} - \text{0x0CB40000}$$

Dieser `relOffset` ist identisch mit dem globalen GBIX-Identifikator der Textur und wird in der Mod zum O(1)-Lookup verwendet.

---

## 7. Direct3D 9 Device Auflösung & IAT Hook

Crazy Taxi hält keine globale `g_pD3DDevice`-Variable, sondern kapselt das DirectX-Device tief im Sega-Renderer. Das Mod greift das Device über folgende zwei Zeigerketten ab:

### Primäre Kette (Sega Renderer):
```cpp
uintptr_t pSegaRenderer = *(uintptr_t*)0x01B7AC00;
if (pSegaRenderer) {
    IDirect3DDevice9* pDev = *(IDirect3DDevice9**)(pSegaRenderer + 0x18);
}
```

### Sekundäre Kette (D3D Container Fallback):
```cpp
uintptr_t pContainer = *(uintptr_t*)0x01B7AB04;
if (pContainer) {
    IDirect3DDevice9* pDev = *(IDirect3DDevice9**)(pContainer + 0x08);
}
```

### IAT-Patching (`0x005342B4`):
Für hochauflösende Menü-Texturen (aus `NewTexture/LITTLE_ENDIAN/*.jpk`) patcht das Mod den IAT-Eintrag der EXE direkt:
```cpp
VirtualProtect((LPVOID)0x005342B4, sizeof(void*), PAGE_EXECUTE_READWRITE, &oldProt);
*(uintptr_t*)0x005342B4 = (uintptr_t)&hkD3DXCreateTextureFromFileInMemoryEx;
VirtualProtect((LPVOID)0x005342B4, sizeof(void*), oldProt, &oldProt);
```

---

## 8. Mod-Eigene Binärformate (LTM1 & LTMC)

### 8.1 Textur-Manifest (`texture_manifest.bin` – Format `LTM1`)
Liegt in `mods/LyrasTextureMod/textures/texture_manifest.bin`. Ermöglicht Mikrosekunden-Lookups aller 2.000+ Texturen ohne JSON-Parsing.

#### Header (16 Bytes, `#pragma pack(push, 1)`):
```cpp
char     magic[4];        // "LTM1"
uint32_t version;         // 1
uint32_t entryCount;      // Anzahl der Textur-Einträge
uint32_t stringTableLen;  // Länge der String-Tabelle in Bytes
```

#### Record-Eintrag (40 Bytes pro Textur):
```cpp
uint32_t crc32;           // CRC32 der Original-Rohdaten
uint32_t gbix;            // Global Texture Index / Relativer Offset
uint32_t archiveId;       // CRC32 des Archivnamens (z. B. texDC0 = 0x5436974C)
uint32_t chunkIndex;      // Index des Chunks innerhalb der Tabelle
uint32_t dataOffset;      // Offset in der .bin oder .jpk Datei
uint32_t origWidth;       // Originale Breite (z. B. 128)
uint32_t origHeight;      // Originale Höhe (z. B. 128)
uint32_t origFormat;      // Internes Format-Enum
uint32_t filenameOffset;  // Byte-Offset des Namens in der String-Tabelle
uint32_t rawDataSize;     // Ursprüngliche PNG-Dateigröße (für Änderungserkennung)
```

### 8.2 Hochgeschwindigkeits-Cache (`*.cache` – Format `LTMC`)
Liegt in `mods/LyrasTextureMod/cache/*.cache`. Speichert vorgerenderte, resamplete 32-Bit ARGB Pixel für sofortiges Hochladen in VRAM via `LockRect`.

#### Cache Header (32 Bytes):
```cpp
char     magic[4];        // "LTMC"
uint32_t version;         // 1
uint32_t width;           // Finale Texturbreite (Power-of-Two, z. B. 1024)
uint32_t height;          // Finale Texturhöhe (Power-of-Two, z. B. 1024)
uint32_t d3dFormat;       // D3DFMT_A8R8G8B8 = 21
uint32_t dataSize;        // width * height * 4 Bytes
uint64_t sourcePngTime;   // Windows FileTime der Quell-PNG/JPG
```
Direkt nach dem Header folgen die `dataSize` unkomprimierten 32-Bit BGRA-Pixelbytes.

---

## 9. Übersicht aller relevanten Codestellen in `src/`

### `LyrasTextureMod_main.cpp`
- **Zeile 31–73**: `hkD3DXCreateTextureFromFileInMemoryEx` – Fängt JPK- und UI-Texturerstellungen über `d3dx9_43.dll` ab.
- **Zeile 78–103**: `hkLoadModelTexture` – Naked x86 Trampolin-Hook für Modell-Texturen an `0x00492230`.
- **Zeile 108–131**: `hkLoadStageTexture` – Naked x86 Trampolin-Hook für Stage-Texturen an `0x0048B7A0`.
- **Zeile 136–156**: `hkSegaSetTexture` – Hook an `0x00481200` vor Direct3D `SetTexture`.
- **Zeile 161–203**: DLL C-Exports (`GetTextureModEnabled`, `ReloadTextureMod`, `RestoreOriginalTextures`, etc.) für Mod-Menüs und UI.
- **Zeile 205–273**: `InstallHooks()` – MinHook-Initialisierung und IAT-Patch bei `0x005342B4`.

### `TextureEngine.h`
- **Zeile 9–42**: Definition von `ManifestHeader`, `ManifestEntryRecord` und `CacheHeader`.
- **Zeile 44–53**: `RuntimeTextureInfo` – Laufzeit-Deskriptor mit Pfad-, Zeitstempel- und Cache-Status.
- **Zeile 114–129**: O(1) Hash-Map Lookup-Deklarationen (`FindByCRC`, `FindByGBIX`, `FindByOffset`).

### `TextureEngine.cpp`
- **Zeile 58–85**: `s_SegaTableMap` – Deklaration aller 26 Sega-Container-Tabellenadressen und CRC32 IDs.
- **Zeile 101–329**: `ProgressScreen` – GDI-basierter nativer Fortschrittsbalken beim Vorab-Kompilieren von Texturen.
- **Zeile 350–442**: `ResolveImagePath` – Dynamische JPG/JPEG/PNG-Auflösung mit Priorisierung des neuesten Zeitstempels.
- **Zeile 790–958**: `ApplySmartFormatRules` – Intelligente Alpha-Restauration, Magenta Color-Keying (`RGB(255,0,255)`) und 1-Bit ARGB1555 Rekonstruktion aus `originals/`.
- **Zeile 960–1098**: `CompileImageToCache` – Power-of-Two Dimension-Snapping, Aspect-Ratio-Korrektur und Kompilierung in `.cache`.
- **Zeile 1228–1259**: `GetD3DDevice` – Zeigerketten-Auflösung von `IDirect3DDevice9*` über `0x01B7AC00` und `0x01B7AB04`.
- **Zeile 1261–1454**: `GetOrCreateD3DTexture` – Erzeugt Direct3D 9 Texturen mit Hardware-Autogen-Mipmaps (`D3DUSAGE_AUTOGENMIPMAP`) oder CPU 2x2 Box-Filter-Pyramide.
- **Zeile 1520–1602**: `HandlePostLoadModelTexture` – Ersetzt Fahrzeug- und Charaktertexturen im Modell-Hook mit strikter Dimensionsvalidierung (`origWidth` / `origHeight`).
- **Zeile 1607–1688**: `HandlePostLoadStageTexture` – Ersetzt Welt- und Stage-Texturen im Stage-Hook.
- **Zeile 1693–1765**: `HandlePreSetTexture` – Live-Ersetzung in `pTexObj + 0x0C`, Hotkey-Prüfung (`F9` / `F10`) und Sampler-State Setup.
- **Zeile 1770–1866**: `ScanAndReplaceAllMasterTextures` – Sichere Iteration über alle 8.192 Master-Slots an `0x01B09938`.
- **Zeile 1868–1883**: `RestoreAllVanillaTextures` – Stellt live alle ursprünglichen Vanilla-Texturen wieder her.







# Crazy Taxi (Steam PC Release) – Modder Offset & Memory Guide

Diese Dokumentation listet alle relevanten Speicheradressen, Offsets, Datenstrukturen und Hook-Positionen aus dem Quellcode von `CrazytaxiMOD/src` (`Framework_MOD` & `dinput8.dll`) für `Crazy Taxi.exe` (32-Bit x86, Base `0x00400000`).

---

## Inhaltsverzeichnis
1. [Spielstatus & Session-Management](#1-spielstatus--session-management)
2. [Spieler-Taxi Koordinaten & Physik](#2-spieler-taxi-koordinaten--physik)
3. [Fahrzeug-Rotation & 4x4 Transformations-Matrix](#3-fahrzeug-rotation--4x4-transformations-matrix)
4. [Kamera-System & 6-DOF](#4-kamera-system--6-dof)
5. [Input, Hardware-Tasten & Controller](#5-input-hardware-tasten--controller)
6. [Finanzen, Fahrgäste & Trinkgeld](#6-finanzen-fahrgäste--trinkgeld)
7. [Sega Entwickler-Cheats & Geheim-Modi](#7-sega-entwickler-cheats--geheim-modi)
8. [Chunk-Streaming, Sektoren & Distanz-Radien](#8-chunk-streaming-sektoren--distanz-radien)
9. [Kollisions- & Physik-Routinen](#9-kollisions---physik-routinen)
10. [Direct3D 9 Crash-Guards & Engine-Hooks](#10-direct3d-9-crash-guards--engine-hooks)
11. [Dreamcast Restoration (CT-DC) Patch-Stellen](#11-dreamcast-restoration-ct-dc-patch-stellen)

---

## 1. Spielstatus & Session-Management

| Name / Konstante | Adresse (Hex) | Typ | Wertebereich / Format | Beschreibung & Verwendung |
|---|---|---|---|---|
| `ADDR_GAME_FLAG` | `0x016A2CFC` | `int32_t` | `0`, `1`, `3` | **Master-Spielstatus:**<br>`3` = Aktive Fahrt / Gameplay-Runde gestartet.<br>`1` = 3D-Stadt / Szene im Speicher aktiv.<br>`0` = Hauptmenü, Menüs oder Attract AI Demo. |
| `ADDR_GAME_MODE` | `0x016A2818` | `int32_t` | `4`, `14` (`0x0E`) | **Aktiver Spielmodus:**<br>`4` = Arcade Mode.<br>`14` (`0x0E`) = Original City / Crazy Box. |
| Sub-State Session | `0x016A2804` | `int32_t` | `3` = Session | Interner Sega Session-Tracker. Zeigt an, ob die Runde aktiv gesteuert wird. |
| `ADDR_GAME_TIMER` | `0x016A41A4` | `uint32_t` | Frames (60 fps) | **In-Game Runden-Timer:**<br>Wird in 60Hz-Frames gemessen. Beispiel:<br>`3000` = 50 Sekunden<br>`36000` = 10 Minuten<br>`356400` = 99 Minuten (Maximalwert des Mods). |
| `ADDR_FARE_CUTSCENE` | `0x016F2164` | `int32_t` | `0` oder `> 0` | Status der Passagier-Cutscene. Wenn `> 0`, steigt gerade ein Kunde ein oder aus (Kamera schwenkt automatisch). |
| `ADDR_PASSENGER_OBJ` | `0x016F21B0` | `void*` | Zeiger | Speicheradresse des aktuell im Taxi sitzenden Passagier-Objekts (`nullptr` wenn leer). |
| `ADDR_VEHICLE_ACTIVE_INDEX` | `0x01661570` | `int32_t` | `1` = Spieler 1 | Index des Spieler-Fahrzeugs in der Sega Fahrzeugtabelle. |
| `ADDR_VEHICLE_STATE` | `0x01661474` | `int32_t` | Bitmaske / State | **Fahrzeug-Verhalten:**<br>`8` = Attract AI Demonstration (Computer steuert Taxi).<br>`< 8` = Spieler hat volle Steuerung.<br>`0` = Normales Fahren.<br>`0x0A` / `0x0B` = Ein-/Aussteige-Transition. |

---

## 2. Spieler-Taxi Koordinaten & Physik

| Name / Konstante | Adresse (Hex) | Typ | Einheit / Besonderheit | Beschreibung & Verwendung |
|---|---|---|---|---|
| `ADDR_PLAYER_X` | `0x01661574` | `float` | Weltkoordinate | **Ost/West-Achse** des Taxis. Größere Werte = weiter östlich. |
| `ADDR_PLAYER_Y` | `0x01661578` | `float` | Weltkoordinate | **Höhen-Achse (Elevation):**<br>⚠️ **WICHTIG:** In Crazy Taxi ist **-Y HÖHER (Himmel)** und **+Y TIEFER (Erde/Boden)**! Zum Steigen muss von Y subtrahiert werden! |
| `ADDR_PLAYER_Z` | `0x0166157C` | `float` | Weltkoordinate | **Nord/Süd-Achse** des Taxis. Größere Werte = weiter südlich. |
| `ADDR_PLAYER_SPEED` | `0x0166158C` | `float` | Meilen/Stunde (MPH) | Native Tacho-Geschwindigkeit des Fahrzeugs. |
| `ADDR_PLAYER_FALL_SPD` | `0x016614B0` | `float` | Velocity | Vertikale Fallgeschwindigkeit / Gravitations-Impuls. Im Fly Mode auf `0.0f` gelockt. |
| `ADDR_PLAYER_DELTA_X` | `0x016614AC` | `float` | Schrittweite Delta | Physik-Schrittweite in X-Richtung pro Frame. |
| `ADDR_PLAYER_DELTA_Z` | `0x016614B4` | `float` | Schrittweite Delta | Physik-Schrittweite in Z-Richtung pro Frame. |
| `ADDR_GROUND_COLLISION`| `0x01661596` | `uint8_t` | Bool (`1` / `0`) | **Bodenkontakt:**<br>`1` = Reifen haben Kontakt mit Straße/Untergrund.<br>`0` = Taxi ist in der Luft (Sprung oder Fly Mode). |
| `ADDR_SPAWN_X` | `0x01661FA8` | `float` | Referenz X | Chassis-Integrator Spawn- und Referenzkoordinate X. |
| `ADDR_SPAWN_Y` | `0x01661FAC` | `float` | Referenz Y | Chassis-Integrator Spawn- und Referenzkoordinate Y. |
| `ADDR_SPAWN_Z` | `0x01661FB0` | `float` | Referenz Z | Chassis-Integrator Spawn- und Referenzkoordinate Z. |
| `ADDR_GRAVITY_CONST` | `0x0166148C` | `float` | Standard `5.0f` | Lokale Gravitationskonstante des Fahrzeugs. |
| `ADDR_GRAVITY_CONST_2`| `0x01661490` | `float` | Standard `5.0f` | Sekundäre Gravitationskonstante. |
| `ADDR_GRAVITY_RDATA` | `0x0059FD4C` | `float` | Standard `5.0f` | Master-Gravitationswert in `.rdata` (schreibgeschützt, benötigt `VirtualProtect`). |

---

## 3. Fahrzeug-Rotation & 4x4 Transformations-Matrix

Sega speichert die Winkel als **BAM (Binary Angular Measurement)**:
- Ein 16-Bit Vorzeichen-Wert (`int16_t`): `0..65535` entspricht `0°..360°`.
- Formel zur Umrechnung in Grad: `deg = (float)bam * (360.0f / 65536.0f);`
- Formel von Grad nach BAM: `bam = (int16_t)(deg * (65536.0f / 360.0f));`

| Name / Konstante | Adresse (Hex) | Typ | Beschreibung & Verwendung |
|---|---|---|---|
| `ADDR_VEHICLE_YAW_BAM` | `0x01661478` | `int16_t` | **Gier-Winkel (Yaw / Heading):** Himmelsrichtung des Taxis (`0` = Nord, `16384` = Ost, `32768` = Süd, `49152` = West). |
| `ADDR_VEHICLE_PITCH_BAM`| `0x0166147A`| `int16_t` | **Nick-Winkel (Pitch):** Neigung nach oben/unten bei Steigungen oder Sprüngen. |
| `ADDR_VEHICLE_ROLL_BAM` | `0x0166147C`| `int16_t` | **Roll-Winkel (Roll / Banking):** Seitenneigung in Kurven. |
| Pitch 32-Bit Akkumulator| `0x016614C0`| `int32_t` | 32-Bit BAM Integrationspuffer für Pitch. |
| Roll 32-Bit Akkumulator | `0x016614C8`| `int32_t` | 32-Bit BAM Integrationspuffer für Roll. |

### 4x4 Welt-Transformationsmatrix (`0x01661530`)
Definiert die räumliche Ausrichtung und Position des Spieler-Cabs in DirectX 9:
```text
Offset  | Vektor-Komponente | Typ   | Speicheradresse | Bedeutung
--------+-------------------+-------+-----------------+---------------------------
+0x00   | Right X           | float | 0x01661530      | Lokaler X-Vektor (Rechts)
+0x04   | Right Y           | float | 0x01661534      | 
+0x08   | Right Z           | float | 0x01661538      | 
+0x0C   | 0.0f              | float | 0x0166153C      | W-Komponente
+0x10   | Up X              | float | 0x01661540      | Lokaler Y-Vektor (Oben)
+0x14   | Up Y              | float | 0x01661544      | 
+0x18   | Up Z              | float | 0x01661548      | 
+0x1C   | 0.0f              | float | 0x0166154C      | W-Komponente
+0x20   | Forward X         | float | 0x01661550      | Lokaler Z-Vektor (Vorwärts / Fahrtrichtung)
+0x24   | Forward Y         | float | 0x01661554      | 
+0x28   | Forward Z         | float | 0x01661558      | 
+0x2C   | 0.0f              | float | 0x0166155C      | W-Komponente
+0x44   | Position X        | float | 0x01661574      | ADDR_PLAYER_X
+0x48   | Position Y        | float | 0x01661578      | ADDR_PLAYER_Y
+0x4C   | Position Z        | float | 0x0166157C      | ADDR_PLAYER_Z
+0x50   | 1.0f              | float | 0x01661580      | Homogene Koordinate
```

---

## 4. Kamera-System & 6-DOF

| Name / Konstante | Adresse (Hex) | Typ | Beschreibung & Verwendung |
|---|---|---|---|
| `ADDR_CAM_EYE_X` | `0x01661494` | `float` | Kameraposition X im 3D-Raum (Augpunkt / Eye). |
| `ADDR_CAM_EYE_Y` | `0x01661498` | `float` | Kameraposition Y im 3D-Raum. |
| `ADDR_CAM_EYE_Z` | `0x0166149C` | `float` | Kameraposition Z im 3D-Raum. |
| `ADDR_CAM_TARGET_X` | `0x016614F8` | `float` | Kamera-Fokuspunkt X (Zielpunkt / LookAt). |
| `ADDR_CAM_TARGET_Y` | `0x016614FC` | `float` | Kamera-Fokuspunkt Y. |
| `ADDR_CAM_TARGET_Z` | `0x01661500` | `float` | Kamera-Fokuspunkt Z. |
| `ADDR_CAM_ROLL` | `0x016614C8` | `int16_t` | Kamera-Rollwinkel in Sega BAM. |
| `ADDR_FAR_Z_RDATA` | `0x005A0150` | `float` | **Sichtweite (Far-Z Clipping Plane):** Standard `15000.0f`. Kann bis zu `1500000.0f` (100x) skaliert werden. |
| `ADDR_CAM_UPDATE_CALL` | `0x0051F582` | Code-Call | Hook-Aufruf (`call 0x0049B200`), an dem Sega die Kamera berechnet. |
| `ADDR_CAM_LOOKAT_FN` | `0x0049B200` | Funktion | Native Sega D3D `D3DXMatrixLookAtLH`-Berechnungsroutine. |

---

## 5. Input, Hardware-Tasten & Controller

| Name / Konstante | Adresse (Hex) | Typ | Beschreibung & Verwendung |
|---|---|---|---|
| `ADDR_INPUT_BUTTONS` | `0x016A2848` | `uint32_t` | Roher Hardware-Bitmaskenpuffer der Tasten. |
| `ADDR_INPUT_BUTTONS_2` | `0x016A287C` | `uint32_t` | Verzögerter/gefilterter Puffer (von der Fahrphysik genutzt). |
| `ADDR_INPUT_BUFFER_DELTA`| `+0x34` | Offset | Offset zwischen Rohpuffer und Spieler-1-Fahrphysik-Puffer. |
| `ADDR_INPUT_STEER_AXIS` | `0x016A2858` | `int16_t` | Lenkachse Analog-Stick: `-32767` (Voll links) bis `+32767` (Voll rechts). |
| `ADDR_INPUT_ACCEL_AXIS` | `0x016A285A` | `uint16_t` | Gaspedal / Trigger: `0` (Losgelassen) bis `65535` (Vollgas). |
| `ADDR_INPUT_BRAKE_AXIS` | `0x016A285C` | `uint16_t` | Bremspedal / Trigger: `0` bis `65535`. |
| `ADDR_INPUT_BTN_ACCEL` | `0x016A2863` | `uint8_t` | Gas-Button (`1` = gedrückt, `0` = frei). |
| `ADDR_INPUT_BTN_BRAKE` | `0x016A2864` | `uint8_t` | Brems-Button (`1` = gedrückt, `0` = frei). |
| `ADDR_INPUT_BTN_GEAR_D`| `0x016A2865` | `uint8_t` | Gang Drive 'D' Taste gedrückt. |
| `ADDR_INPUT_BTN_GEAR_R`| `0x016A2866` | `uint8_t` | Gang Reverse 'R' Taste gedrückt. |
| `ADDR_INPUT_EDGE_DRIVE`| `0x016A2869` | `uint8_t` | Steigende Flanke (Rising Edge) für Vorwärtsgang-Schaltung. |
| `ADDR_INPUT_EDGE_REV` | `0x016A286A` | `uint8_t` | Steigende Flanke für Rückwärtsgang-Schaltung. |
| `ADDR_INPUT_GEAR_STATE`| `0x016A2873` | `uint8_t` | **Aktiver Gang:**<br>`0` oder `2` = Drive (Vorwärts)<br>`1` = Reverse (Rückwärts). |
| `ADDR_MAIN_INPUT_LOOP` | `0x004EA3A8` | Code-Call | `call 0x004F2ED0`: Hauptschleifen-Input-Commit. |
| Sega Keyboard VTable | `0x0059E8C0` | Zeiger-Array| DirectInput Keyboard VTable (Methode 7 = `PollKeyboard` bei `0x00486390`). |

---

## 6. Finanzen, Fahrgäste & Trinkgeld

| Name / Konstante | Adresse (Hex) | Typ | Beschreibung & Verwendung |
|---|---|---|---|
| `ADDR_TOTAL_MONEY` | `0x016F10E0` | `int32_t` | **Gesamtguthaben in Cents:** `$1.00` = `100`, `$1250.50` = `125050`. |
| `ADDR_CURRENT_FARE_TIPS`| `0x016A41C8`| `int32_t` | Trinkgeld-Pool der laufenden Fahrt in Cents (wird beim Absetzen gutgeschrieben). |
| `ADDR_STUNT_TIP_ADD` | `0x004A8DE7` | Code | Instruktion: `add [0x16a41c8], ecx`. Hook-Stelle für Stunt-Trinkgeld-Multiplikatoren! |
| `ADDR_PASSENGER_PICKUP_CALL`| `0x004B862D`| Code | Aufruf `call 0x004C1810`. Hook-Stelle für Fly Mode zur Vermeidung ungewollter Fahrgastannahme. |
| `ADDR_PASSENGER_COPY_FN` | `0x004C1810` | Funktion | Native Sega Routine zum Zuweisen des Fahrgasts an das Taxi. |
| `ADDR_PASSENGER_SKIP_TARGET`| `0x004B8689`| Code-Adresse| **Sicheres Sprungziel beim Überspringen:** Setzt den Code nach dem Kundenaufruf fort, ohne Stack oder Register zu beschädigen. |

---

## 7. Sega Entwickler-Cheats & Geheim-Modi

| Name / Konstante | Adresse (Hex) | Typ | Bitmaske / Wert | Beschreibung & Verwendung |
|---|---|---|---|---|
| `ADDR_SEGA_UNLOCK_ALL` | `0x0164FA58` | `uint8_t` | `0x3F` | Schaltet alle 8 Fahrzeuge (4 Cabs + 4 Crazy Bikes) und alle Crazy Box Minispiele frei. |
| `ADDR_SEGA_UNLOCK_MASK`| `0x016AA3C0`| `uint32_t`| `0` | **Wichtig:** Auf `0` setzen, um die Endlosschleife des Sega "Unlocked"-Dialogbanners zu stoppen! |
| `ADDR_SEGA_CHAR_SELECT`| `0x016A9B30`| `int32_t` | `0..7` | **Fahrzeug-ID:**<br>`0` = Axel Cab, `1` = BD Joe Cab, `2` = Gena Cab, `3` = Gus Cab<br>`4` = Axel Bike, `5` = BD Joe Bike, `6` = Gena Bike, `7` = Gus Bike. |
| `ADDR_SEGA_ANOTHER_DAY`| `0x01662304`| `int32_t` | `1` / `0` | **Another Day Modus:** `1` aktiviert veränderte Fahrgast-Positionen und Routen. |
| `ADDR_SEGA_NO_ARROWS` | `0x016EF0BC`| `int32_t` | `1` / `0` | **No Arrows:** `1` deaktiviert den grünen Richtungs-Pfeil am oberen Bildschirmrand. |
| `ADDR_SEGA_NO_DEST_MARK`| `0x016EEEA0`| `int32_t`| `1` / `0` | **No Destination Mark:** `1` entfernt die grünen/roten Bodenmarkierungen an Zielzonen. |
| `ADDR_SEGA_BIKE_MODE` | `0x016AA3C4`| `int32_t` | Bit `0x20` | Zeigt an, ob das aktuelle Fahrzeug ein Fahrrad ist. |

---

## 8. Chunk-Streaming, Sektoren & Distanz-Radien

Sega lädt die Map in **Chunks** (Array 1) und **Sektoren** (Array 2) über eine feste 1152-Slot-Tabelle:
- `0x0169AF00`: Sega 1152-Slot Chunk/Texture Zuordnungstabelle (`0x480` Einträge à `0x18` Bytes).
- `0x0169904C`: `int32_t` (236 Chunks in Arcade).
- `0x01699478`: `int32_t` (164 Sektoren in Arcade).

| Name / Konstante | Adresse (Hex) | Typ | Default | Beschreibung |
|---|---|---|---|---|
| `ADDR_CHUNK_DIST_CAMERA` | `0x005A10A8` | `float` | `850.0f` | Kamera-Chunk Culling Distanz in `.rdata`. |
| `ADDR_CHUNK_DIST_FAR` | `0x0059F9F8` | `float` | `450.0f` | Entfernte Chunks Culling Distanz. |
| `ADDR_CHUNK_DIST_SEC_CAM`| `0x005A07D8` | `float` | `1700.0f` | Sekundäre Kamera-Chunk Distanz. |
| `ADDR_CHUNK_DIST_SEC_FAR`| `0x005A10A0` | `float` | `900.0f` | Sekundäre Fern-Chunk Distanz. |
| `ADDR_SECTOR_STREAM_RAD` | `0x005A0908` | `float` | `1500.0f` | Sektor-Streamer Radius (Mode 0). |
| `ADDR_PROP_STREAM_RAD` | `0x005A07CC` | `float` | `1696.0f` | Dynamische Requisiten & Fußgänger Streaming-Radius. |
| `ADDR_SPAWN_DIST_TRAFFIC`| `0x005A04EC` | `float` | `1800.0f` | KI-Verkehr Spawn-Distanz in `.rdata`. |
| `ADDR_SPAWN_DIST_PED` | `0x005A04E8` | `float` | `2000.0f` | Fußgänger Spawn-Distanz in `.rdata`. |
| `ADDR_STREAM_SECTOR_RAD_1`| `0x0059F9E4` | `float` | `1000.0f` | Gameplay Sektor-Radius 1. |
| `ADDR_STREAM_SECTOR_RAD_2`| `0x005A0904` | `float` | `800.0f` | Gameplay Sektor-Radius 2. |
| `ADDR_STREAM_SECTOR_RAD_3`| `0x005A0900` | `float` | `600.0f` | Gameplay Sektor-Radius 3. |
| `ADDR_STREAM_SECTOR_RAD_4`| `0x005A00F0` | `float` | `400.0f` | Gameplay Sektor-Radius 4. |
| `ADDR_LOAD_CHUNKS_AROUND` | `0x00504090` | Funktion | `__cdecl` | **Sega Master Proximity Evaluator:** `void(float x, float y, float z, float rad)`. Berechnet Entfernungen und priorisiert Chunks in der 1152-Tabelle. |
| `ADDR_CHUNK_EVICT_FN` | `0x005051D0` | Funktion | `__cdecl` | **Sega Streaming State Machine & Texture Binder:** Lädt wartende Chunks, ruft `0x00499240` auf (bindet Welt-Texturen!) und spawnt Props (`0x005045E0`). Darf niemals abgebrochen werden! |

---

## 9. Kollisions- & Physik-Routinen

| Name / Konstante | Adresse (Hex) | Typ / Konvention | Beschreibung |
|---|---|---|---|
| `ADDR_COLLISION_WORLD` | `0x004DC580` | `__cdecl void()` | **Master Welt- & Geländekollision:** Führt auch die Fahrzeug-Renderpässe aus (`0x00497160`). Muss immer ausgeführt werden! |
| `ADDR_COLLISION_TRAFFIC_0` | `0x004DCF10` | `__cdecl void()` | Mode 0 Sektor- und Chunk-Streamer. |
| `ADDR_COLLISION_TRAFFIC_1` | `0x004DCA60` | `__cdecl void(float)` | Mode 1 Aktiver Gameplay Sektor-Streamer. |
| `ADDR_COLLISION_TRAFFIC_2` | `0x004DC660` | `__cdecl void()` | Mode 2 Sektor-Streamer. |
| `ADDR_COLLISION_INTERSECT` | `0x0050BED0` | Custom Regs (`esi`, `edx`) | **Echte Fahrzeug-zu-Fahrzeug-Kollision:** Prüft Trefferboxen. Wenn `eax = 0` zurückgegeben wird, gleitet das Taxi widerstandslos durch den Verkehr. |
| `ADDR_VEHICLE_UPDATE_FN` | `0x0051D940` | `__cdecl void()` | Haupt-Fahrphysik Routine pro Frame. |
| `ADDR_VEHICLE_UPDATE_CALL_1` | `0x0051139B` | Code-Call | Primäre Hook-Stelle für Physik-Vor-/Nachbereitung (`PreVehiclePhysics` / `PostVehiclePhysics`). |
| `ADDR_VEHICLE_UPDATE_CALL_2` | `0x00511F86` | Code-Call | Sekundäre Physik-Aufrufstelle. |

---

## 10. Direct3D 9 Crash-Guards & Engine-Hooks

Diese Naked-Detours verhindern `0xC0000005 (Access Violation)` Crashes auf modernem Windows 10/11:

| Ziel-Adresse | Routine | Zweck des Schutzes |
|---|---|---|
| `0x00481100` | `hkClearD3DStateNaked` | Fängt `ClearD3DState` ab, falls Device-Pointer `[esi+0x18] == NULL`. |
| `0x0052227E` | `hkCreateVertexDeclNaked` | Sichert `CreateVertexDeclaration` gegen ungültige Schemas ab. |
| `0x00521FD4` | `hkCreateVertexShaderNaked` | Verhindert Absturz beim Erstellen von Vertex-Shadern. |
| `0x00521F74` | `hkCreatePixelShaderNaked` | Verhindert Absturz beim Erstellen von Pixel-Shadern. |
| `0x00521D60` | `hkCreateVertexBufferNaked` | Fängt Fehler beim Anlegen von Vertex-Puffern ab. |
| `0x00521E90` | `hkCreateIndexBufferNaked` | Fängt Fehler beim Anlegen von Index-Puffern ab. |
| `0x0049F967` | `hkMeshBufferCopyNaked` | Verhindert Speicherüberschreibung bei `NULL`-Meshpuffern. |
| `0x00481BB0` | `hkSegaCreateTextureNaked` | Schützt Segas Texture-Erzeugung vor ungültigen Dimensionen. |
| `0x004826DD` | `hkRendererInitNaked` | Stellt sicher, dass das Direct3D-Device nach der Initialisierung registriert ist. |
| `0x0053432C` | SteamAPI `RestartApp` Stub | Verhindert das Zwangs-Beenden ohne laufenden Steam-Client. |

---

## 11. Dreamcast Restoration (CT-DC) Patch-Stellen

| Feature | Adresse (Hex) | Original-Bytes | Patch-Bytes | Zweck |
|---|---|---|---|---|
| **Original-Markennamen** | `0x013B9F0C` | Pointer-Tabelle | Eigene Pointer | Stellt "Pizza Hut", "FILA", "The Original Levi's Store", "Tower Records" und "Kentucky Fried Chicken" wieder her. |
| **FILA Fahrziel** | `0x004FDBF3` | `75` (`jne`) | `EB` (`jmp`) | Re-aktiviert FILA als gültiges Fahrgastziel. |
| **Pizza Hut Shader** | `0x00491F68` etc. | Texture-IDs | `FFFFFFFF` | Verhindert das Ersetzen der Dreamcast Pizza Hut Texturen im Shader. |
| **Welt-Texturen Uncheck** | `0x0048BA38` | `3D 80 AC BF 0C` | `E9 5E 06 00 00` | Überspringt Segas Zensur-Prüfung und springt direkt zu `0x0048C09B`. |
| **UI Menü-Thumbnails** | `0x0048C30F` | `83 F8 03 75 6A` | `E9 16 03 00 00` | Springt direkt zu `0x0048C62A` für originale Dreamcast UI-Symbole. |
| **Passagier-Sprachausgabe** | `0x004C9C2A` | `83 F8` (`cmp eax, 8`) | `EB 15` (`jmp`) | Schaltet die originalen Sprachaufnahmen ("Take me to Pizza Hut!") wieder frei. |
