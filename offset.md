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
10. [Crazy Taxi Engine- & Gameplay-Offsets](#crazy-taxi-steam-pc-release--modder-offset--memory-guide)
11. [Korrigierte & Neu Entdeckte Offsets (IDA Verified)](#12-korrigierte--neu-entdeckte-offsets-ida-verified)
    - [12.8 CRI ADXF, XECI VFS & CRS Mutex (0x004209D0 - 0x0042A130)](#128-entdeckungen--korrekturen-aus-batch-6-400er-batch-rebuild-0x004209d0--0x0042a130)
    - [12.9 CRI ADX Voice & Sofdec Video/Audio Demuxer (0x0042A180 - 0x00439190)](#129-entdeckungen--erweiterungen-cri-adx-voice--sofdec-videoaudio-demuxer-0x0042a180--0x00439190)
    - [12.10 Vollständige Funktions- & Adressmatrix des Rust Clean-Room Rebuilds](#1210-vollständige-funktions--und-adressmatrix-des-rust-clean-room-rebuilds)

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
| `0x01B7A74C` | `SegaRenderPipelineContext*` | `pRenderPipelineContext` | Zeiger auf Sega 3D Render Pipeline Context. Enthält World- (`+0x2B0`), View- (`+0x2F0`), Projektions-Matrix (`+0x330`) sowie Pipeline-Dirty-Flags (`+0x3A8`). |
| `0x01B7B238` | `std::_Tree*` (Red-Black Tree) | `g_SoundCueMap` | Zentraler Audio-Cue Deskriptor Baum für SFX- und Dialog-Cues (verwaltet von `0x00409FF0` - `0x0040A970`). |
| `0x01B7B23C` | `uint32_t` | `g_SoundCueCount` | Anzahl aktuell im Audio-Cue-Baum registrierter Sound-Cues. |
| `0x01B7AE14` | `std::_Tree*` (Red-Black Tree) | `g_AfsPartitionTable` | Zentraler CRI AFS Partitions-Baum für Datei- und Archiv-Deskriptoren (`BINC1.AFS`, `LandDC1.AFS` etc.). |
| `0x01B7AE24` | `std::_Tree*` (Red-Black Tree) | `g_AfsStreamBufferPool` | Rot-Schwarz-Baum zur Verwaltung allokierter CRI AFS Streaming-Puffer. |
| `0x0134EBB8` | `float` | `g_FrameDeltaTime` | Delta-Zeit in Sekunden pro Frame (Standard `0.0166667f` bei 60Hz). |
| `0x0164FA58` | `uint8_t` | `g_SegaUnlockAll` | Bitmaske `0x3F`: Schaltet alle 8 Fahrzeuge (4 Cabs + 4 Bikes) und Crazy Box Minispiele frei. |
| `0x016AA3C0` | `uint32_t` | `g_SegaUnlockMask` | Freischalt-Banner Bitmaske. Auf `0` setzen, um die Endlosschleife des "Unlocked"-Dialogs zu beenden. |
| `0x016AA3C4` | `int32_t` | `g_SegaBikeMode` | Bit `0x20` aktiv, wenn das aktuelle Fahrzeug ein Fahrrad (Crazy Bike) ist. |
| `0x016A9B30` | `int32_t` | `g_SegaCharSelect` | Aktive Fahrer-/Fahrzeugauswahl (`0..7`: 0–3 Cabs, 4–7 Bikes). |
| `0x01662304` | `int32_t` | `g_SegaAnotherDay` | `1` = Another Day Modus aktiviert (veränderte Fahrgast-Spawns und alternative Routen). |
| `0x016A2CFC` | `int32_t` | `g_GameFlag` | Haupt-Spielstatus (0 = Menü/Attract, 1 = WorldLoaded, 2 = Fade, 3 = ActiveGameplay, 7 = QuitToMenu). |
| `0x016A2804` | `int32_t` | `g_SessionState` | Sitzungszustand / JumpTable-Index (0..15) im 3D-WorldLoaded Status. |
| `0x016A2818` | `int32_t` | `g_GameMode` | Spielmodus (4 = Arcade Stage 1, 14 = Original Stage 2, 15 = CrazyBox Stage 3). |
| `0x016A28E4` | `int32_t` | `g_SessionRuleSubMode` | Spielregeln-Submodus (z. B. 2 = Arcade/Original Standardregeln). |
| `0x016A28F0` | `int32_t` | `g_SessionParamFlags` | Sekundäre Sitzungsflags / Navigationsrouting-Parameter. |
| `0x016A41A4` | `uint32_t` | `g_GameTimer` | In-Game Runden-Timer in 60Hz Frames (Standard 3000 = 50s, 36000 = 10 Min). |
| `0x016A4194` | `int32_t` | `g_PreRaceCountdownFrames` | Pre-Race Countdown Frames (Starts > 0, bei 60 Ready/Go, bei 0 Start). |
| `0x016A4198` | `int32_t` | `g_RaceStateFlag` | Renn- und Countdown-Status (0 = Inaktiv, 1 = Aktiv/Countdown läuft, 2 = Beendet). |
| `0x016A4190` | `int32_t` | `g_SessionRacePhase` | Sitzungsphase / Runden-Ablaufschritt (0 = Start, 1 = Rennen läuft, 2 = Zeit abgelaufen). |
| `0x016EF0BC` | `int32_t` | `g_SegaNoArrows` | `1` = Deaktiviert den grünen 3D-HUD-Richtungspfeil am oberen Bildschirmrand. |
| `0x016EEEA0` | `int32_t` | `g_SegaNoDestMark` | `1` = Entfernt die Bodenmarkierungsringe an den Fahrgast-Zielzonen. |
| `0x016F21D0` | `PassengerStateCopy` | `g_PassengerStateCopy` | Gespiegelte Passagierzustands-Kopie im Taxi (`+0x00`: State, `+0x04`: SubState, `+0x08`: PosX, `+0x0C`: PosY, `+0x10`: PosZ). |
| `0x0169AF00` | `ChunkSlot[1152]` | `g_ChunkMappingTable` | Sega 1152-Slot Chunk/Texture Zuordnungstabelle (`0x480` Einträge à `0x18` Bytes). |
| `0x0169904C` | `uint32_t` | `g_StageChunkCount` | Chunks der aktiven Stage (Arcade: 255, Original: 236, Crazy Box: 130). |
| `0x01699478` | `uint32_t` | `g_StageSectorCount` | Sektoren der aktiven Stage (Arcade: 240, Original: 164, Crazy Box: 0). |
| `0x0146D2CC` | `uint32_t` | `g_SvmVoiceSlotCount` | CRI SVM globale Voice-Slot-Anzahl (verwaltet über `0x00420A90`). |
| `0x0146D2D0` | `uint32_t` | `g_SvmVoiceBufferSize` | CRI SVM globale Voice-Puffergröße in Bytes. |
| `0x01EC9640` | `uint8_t[832]` | `g_AdxfActiveStreams` | CRI ADXF Puffer für 16 aktive Audio-Stream-Deskriptoren (à 52 Bytes). |
| `0x01EC9240` | `uint8_t[1024]` | `g_AdxfFileStatus` | CRI ADXF Dateistatus- und Handle-Deskriptoren. |
| `0x01EC90E0` | `uint8_t[256]` | `g_AdxfSectorIndices` | CRI ADXF Ringpuffer Sektor-Indizes. |
| `0x01EB0AE4` | `void*` (List Head) | `g_AfsPendingReadQueue` | Verkettete Lesewarteschlange für asynchrone CRI AFS Sektor-Reads. |
| `0x01B7AE14` | `std::_Tree*` (RB-Tree) | `g_AfsPartitionMap` | Rot-Schwarz-Baum zur Verwaltung aller gemounteten AFS-Partitionen. |
| `0x01B7A6A8` | `uintptr_t` | `g_SegaEmulatedRamBase` | Basisadresse des emulierten Dreamcast/Naomi VRAM-Pools. |
| `0x0135530C` | `float` | `flt_135530C` | $1.0 / \sin(\text{speed\_bam})$ (Perspektivische Tunnelblick-Verzerrung bei hoher Geschwindigkeit). |
| `0x013553A0` | `float` | `flt_13553A0` | $1.0 / \tan(\text{speed\_bam})$ (Perspektivische Tunnelblick-Verzerrung). |
| `0x016F8EAC` | `Transform4x4*` | `g_ViewMatrixStack` | 4x4 Matrizen-Stack für hierarchische Transformationen (`MatrixStack_Push`). |
| `0x01BBC4F4` | `uint32_t` | `g_RenderQueueOpaque` | Kopf der Render-Warteschlange für opake Geometrie (Chassis, Räder, Props). |
| `0x01BBC44C` | `uint32_t` | `g_RenderQueueAlpha` | Kopf der Render-Warteschlange für transparente/alphageblendete Geometrie (Scheiben, Partikel). |
| `0x016F22B8` | `Customer*` | `g_ActiveCustomerSlot` | Zeiger auf den aktuellen Fahrgast-Slot im Spielerfahrzeug. |
| `0x016F1F68` | `Vector3` | `g_PlayerHeadingVector` | Normalisierter Vorwärtsvektor des Taxis. |
| `0x016F1FB4` | `Vector3` | `g_TargetDirectionVector`| Richtungsvektor zur aktiven Fahrgast-Zielzone. |
| `0x01EB0ACC` | `uint32_t` | `g_GameLanguageLCID` | Windows Sprach-LCID (Standard: `1033` = `0x0409` Englisch, `1031` = Deutsch, `1036` = Französisch, `1040` = Italienisch, `1041` = Japanisch, `3082` = Spanisch). |
| `0x01EB08C2` | `wchar_t[260]` | `g_GameInstallPathW` | Unicode-Puffer für den Basispfad der `Crazy Taxi.exe`. |

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
| `0x00492780` | `__cdecl` | `LoadSegaTextureContainer` | `(entryPtr, baseIdx)` | Parst 16-Byte Einträge der statischen Container-Tabellen und belegt Slots in der Master-Tabelle. |
| `0x00499240` | `__cdecl` | `BindWorldTextures` | `(texIndices, container, baseIdx)` | Bindet sichtbare Mesh-Sektor-Texturen während des Sektor-Streamings. |
| `0x0047E8B0` | `__cdecl` | `SegaRenderer::ResetVTable` | Device Pointer | Setzt den Zustand der virtuellen Sega-Renderer-Tabelle zurück. |
| `0x0047EA50` | `__cdecl` | `SegaRenderer::SetupViewportAndScissor`| RenderContext | Initialisiert 3D Viewport und 2D Scissor-Rechteck für DirectX 9. |
| `0x00481220` | `__cdecl` | `SegaRenderer::SetTexture_Stage` | `(stage, textureId)` | Bindet Texturen auf spezifische Direct3D Multi-Texture-Stages (0..15). |
| `0x00482600` | `__cdecl` | `SegaRenderer::InitDeviceParameters` | Device Settings | Konfiguriert D3D9 Sampler-States, Z-Buffer und Alpha-Blending Modi. |
| `0x00482A70` | `__cdecl` | `SegaRenderer::IsDeviceReady` | Device Pointer | Prüft TestCooperativeLevel und Bereitstellung des Grafikgeräts. |
| `0x0048B800` | `__cdecl` | `LoadStageTexture_Body` | `(slot, pData)` | Lädt und dekomprimiert Stage-Texturdaten direkt in den VRAM-Puffer. |
| `0x004955C0` | `__cdecl` | `SetLightDirection` | `Vector3 dir` | Setzt den globalen 3D-Lichtrichtungsvektor für Fahrzeug- und Charakter-Shading. |
| `0x004949A0` | `__cdecl` | `GroundCollision_SetTrue` | Keine | Setzt `g_GroundCollision` (`0x01661596`) auf 1 (Reifenkontakt mit Fahrbahn). |
| `0x00497160` | `__cdecl` | `VehicleRenderPasses` | `int alphaPass` | Verwaltet opake (`0x01BBC4F4`) und alpha-geblendete (`0x01BBC44C`) Zeichenpässe für Cab und Räder. |
| `0x004A3900` | `__cdecl` | `Session_ApplyState` | `(flag, session, mode)` | Schreibt zentrale Zustands-DWORDs nach `0x016A2CFC`, `0x016A2804`, `0x016A2818`. |
| `0x004B82F0` | `__cdecl` | `Passenger_UpdatePickupRide` | `(player, dist)` | Master-Routine für Passagier-Interaktion, Boarding, Fahrtzeit und Drop-Off. |
| `0x004C1A70` | `__cdecl` | `Passenger_AssignToVehicle` | `(customerId, player)` | Weist einen wartenden Fahrgast dem Spieler-Taxi zu und startet die Boarding-Cutscene. |
| `0x004D53D0` | `__cdecl` | `Money_GetTotal` | Keine | Liefert Gesamteinnahmen in Cents (`0x016F10E0`) für HUD-Animationen. |
| `0x004D9020` | `__cdecl` | `HUD_RenderNavigationMarks` | Cheats-Kontext | Rendert 3D-Pfeil und Zielmarkierungen unter Berücksichtigung von Sega-Cheat-Flags. |
| `0x004EA2D0` | `__cdecl` | `Main_GameLoop` | `float dt` | Zentrale Spielschleife: Input Commit, Zustandsweiche, Physik, Weltkollision, Streaming. |
| `0x004EAB50` | `__cdecl` | `CheckUnlockMinigamesAndVehicles`| `int clearedCount` | Prüft Crazy Box Abschlüsse (4 Tiers) und schaltet Bike Mode frei (bei 80 Kriterien). |
| `0x004F2D00` | `__cdecl` | `ResetGameSessionState` | Keine | Setzt Session, Banner und Rundentimer auf Ausgangswerte zurück. |
| `0x004F2ED0` | `__cdecl` | `MainInputCommitLoop` | `uint32_t flag` | Überträgt Controller-Puffer und prüft Controller-Reset-Combos (`0x606 == 1542`). |
| `0x005045E0` | `__cdecl` | `SpawnProps` | Chunk Context | Spawnt dynamische Requisiten (Hydranten, Telefonzellen) und Fußgänger für geladene Chunks. |

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
12. [Korrigierte & Neu Entdeckte Offsets (IDA Verified)](#12-korrigierte--neu-entdeckte-offsets-ida-verified)
    - [12.1 MSVC C++ Runtime Korrektur (0x00401000 - 0x004015D0)](#121-korrektur-der-funktionen-sub_401000--sub_4015d0-msvc-c-runtime)
    - [12.2 Stage-Metriken & Chunk-Anzahlen (0x005049F0)](#122-stage-metriken--chunk-anzahlen-stage_selectstage-bei-0x005049f0)
    - [12.3 Fahrzeug- und Kamera-Mathematik](#123-fahrzeug--und-kamera-mathematik)
    - [12.4 CRI Middleware, Sega Ninja Math & Physik (Batch 2)](#124-entdeckungen--korrekturen-aus-batch-2-cri-middleware-sega-ninja-math-physik)
    - [12.5 AFS Streaming, VRAM Mapping & QPC Timing (Batch 3: 0x00401620 - 0x00405AF0)](#125-entdeckungen--korrekturen-aus-batch-3-0x00401620--0x00405af0-afs-streaming-vram-mapping-qpc-timing)
    - [12.6 Sega Matrix Context & Sound Cue Registry (Batch 4: 0x00405D60 - 0x00414310)](#126-entdeckungen--korrekturen-aus-batch-4-300er-batch-rebuild-0x00405d60--0x00414310)
    - [12.7 TinyXML, Registry, Threading & DirectSound 5.1 (Batch 5: 0x00414400 - 0x004209C0)](#127-entdeckungen--korrekturen-aus-batch-5-400er-batch-rebuild-0x00414400--0x004209c0)
    - [12.8 CRI ADXF, XECI VFS & CRS Mutex (Batch 6: 0x004209D0 - 0x0042A130)](#128-entdeckungen--korrekturen-aus-batch-6-400er-batch-rebuild-0x004209d0--0x0042a130)
    - [12.9 CRI ADX Voice & Sofdec Video/Audio Demuxer (Batch 7: 0x0042A180 - 0x00439190)](#129-entdeckungen--erweiterungen-cri-adx-voice--sofdec-videoaudio-demuxer-0x0042a180--0x00439190)
    - [12.10 Vollständige Funktions- & Adressmatrix des Rust Clean-Room Rebuilds](#1210-vollständige-funktions--und-adressmatrix-des-rust-clean-room-rebuilds)

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

---

## 12. Korrigierte & Neu Entdeckte Offsets (IDA Verified)

In Phase 3 (Batch 1) durchgeführte Tiefenanalyse und Dekompilierung in IDA Pro Hex-Rays:

### 12.1 Korrektur der Funktionen `sub_401000` – `sub_4015D0` (MSVC C++ Runtime)
Entgegen alter Vorannahmen in den Todo-Katalogen handelt es sich bei den ersten Routinen im `.text`-Segment nicht um Win32- oder Audio-Parser, sondern um die MSVC C++ Standard-Laufzeitbibliothek:
- `0x00401000`: `std::bad_alloc::~bad_alloc()` Destruktor
- `0x00401010`: `std::bad_alloc::scalar_deleting_destructor`
- `0x00401040`: `std::string::basic_string(const char* s)` mit 15-Byte SSO-Puffer
- `0x00401080`: `std::string::tidy()` (Gibt Heap-Puffer frei, setzt Kapazität auf 15 zurück)
- `0x004010B0`: `std::string::operator=(string&&)` / Move-Zuweisung
- `0x00401120`: `std::string::assign(const string& str, size_t pos, size_t count)`
- `0x00401210`: `std::string::erase(size_t pos, size_t count)`
- `0x004012A0`: `std::string::c_str()` (Prüft Kapazität: `>= 16` liefert Pointer, sonst Inline-Puffer)
- `0x004012B0`: `std::string::assign(const char* s, size_t count)`
- `0x004013B0`: `std::string::reserve(size_t new_cap)`
- `0x00401460`: `std::string::_Grow(size_t new_cap)`
- `0x004015D0`: `operator new(size_t)` mit `_CxxThrowException(&bad_alloc)`

### 12.2 Stage-Metriken & Chunk-Anzahlen (`Stage_SelectStage` bei `0x005049F0`)
- **Stage 0 / Arcade (BINC1.AFS):** Chunk-Count `g_ArcadeChunkCount` (`0x0169904C`) ist **255** (nicht 236), Sector-Count `g_ArcadeSectorCount` (`0x01699478`) ist **240**. Aktive Tabelle: `tbl_texDC1` (`0x01364620`).
- **Stage 1 / Original (BINC2.AFS):** Chunk-Count ist **236**, Sector-Count ist **164**. Aktive Tabelle: `tbl_texDC2` (`0x01365B30`).
- **Stage 2 / Crazy Box (BINC3.AFS):** Chunk-Count ist **130**, Sector-Count ist **0**. Aktive Tabelle: `tbl_texDC3` (`0x01366F80`).

### 12.3 Fahrzeug- und Kamera-Mathematik
- **`CamLookAt` (`0x0049B200`):** Roll-Winkel wird über `(roll_bam & 0xFFFF) * 2 * PI / 65536.0` in Bogenmaß konvertiert. Verhindert Singularität bei `eye == target` durch `target.z -= 0.001`. Ruft `D3DXMatrixLookAtRH` auf und sichert Matrix auf dem View-Matrix-Stack (`dword_16F8EAC`).
- **`Vehicle_GetSpeed` (`0x004B9220`):** Konvertiert Geschwindigkeit in BAM `((speed * 0.5 * 65536 / 360) + 0.5) - 1`. Speichert $1/\sin(\text{fov})$ bei `0x0135530C` und $1/\tan(\text{fov})$ bei `0x013553A0` für die perspektivische Tunnelblick-Verzerrung bei hoher Geschwindigkeit.
- **`CollisionIntersect` (`0x0050BED0`):** Prüft Bounding-Sphere ($R^2 < dx^2 + dz^2$) und führt konvexen 4-Punkte-Halbebenen-Kreuzprodukttest durch. Berechnet präzise Geländehöhe: $Y = -(N_z z + N_x x + D) / N_y$.
- **`Stunt_AddTip` (`0x004A8DB0`):** Berechnet Trinkgeld-Inkrement mit `25 * multiplier * combo_count` in Cents und addiert auf `g_CurrentFareTips` (`0x016A41C8`).
- **`PassengerCopy` (`0x004C1810`):** Kopiert nicht nur `g_VehicleState` (`0x016F21D0`) und Positionen (`0x016F21D8` – `0x016F21E0`), sondern auch BAM-Rotationswerte nach `0x016F21B8` / `0x016F21BC` und Translations-Offsets nach `0x016F21C4` – `0x016F21CC`.
- **`SegaUntwiddleDecoder` (`0x0048CBD0`):** Reines 16-Schritt Morton Bit-Deinterleaving (gerade Bits auf X, ungerade Bits auf Y).
- **`SegaVQDecoder` (`0x0048DDB0`):** 2048-Byte VQ-Codebook gefolgt von 2x2 Texel-Block-Indizes. Beinhaltet Dreamcast-typische ARGB1555-, RGB565-, ARGB4444- und YUV-Dekodierung.

### 12.4 Entdeckungen & Korrekturen aus Batch 2 (CRI Middleware, Sega Ninja Math, Physik)
In Phase 3 (Batch 2) wurden weitere 48 Funktionen in IDA Pro Hex-Rays tiefenanalysiert:

1. **Korrektur Bereich `0x004201D0` – `0x00420450` (CRI Middleware Sound, nicht Vektormathe):**
   - `0x004201D0`: `Sound_SetChannelVolume(channel, bus, db_volume)` – Setzt Lautstärke in Dezibel (`-96.33` bis `0.0` dB) für 32 Kanäle und 6 Audio-Busse unter Mutex-Schutz.
   - `0x004202F0` / `0x00420330`: CRI Critical Section Initialisierer & Destruktor mit Fehlerprüfung (`"E2006101800 : Failed to create critical section."`).
   - `0x00420370` / `0x00420390`: CRI Thread-Sperre / Entsperrung (`"E2006022401 : The function has been executed before initialization"`).
   - `0x004203F0` / `0x00420450`: CRI Logging- & Fehler-Formatierer (`vsprintf_s` in 256-Byte Puffer).

2. **Sega Ninja 3D Math Engine:**
   - `0x0048B4E0` (`nlVectorNormalize`): 3D-Vektor-Normalisierung und Skalierung auf Wunschlänge.
   - `0x0049C1D0` (`nlAtan2`): Berechnet Arkustangens aus $(Y, X)$, normalisiert auf $[0..2\pi)$ und skaliert in Segas 16-Bit BAM-Winkelformat (`0..65535`).
   - `0x0049B920` (`MatrixStack_Push`): 4x4 Matrizen-Stack (`dword_16F8EAC`) für hierarchische Transformationen.
   - `0x004D0060` (`SlopeTangentProjection`): Berechnet aus der Fahrbahn-Normalen $(N_x, N_y, N_z)$ den tangentialen Neigungsvektor senkrecht zur Normalen.
   - `0x00500AE0` (`Matrix4x4_ExtractEulerBAM`): Zerlegt eine 4x4 Transformationsmatrix in Euler-Winkel (Pitch-, Yaw- und Roll-BAM) unter Einsatz von `nlAtan2` und `nlSqrt`.

3. **Gameplay, Fahrgäste & Kamera-Effekte:**
   - `0x004B0190`: `Customer_DetachFromVehicle` – Gibt den Fahrgast-Slot in `dword_16F22B8` frei.
   - `0x004B03D0`: `CustomerTargetDotProduct` – 3D-Skalarprodukt zwischen Taxi-Vorwärtsvektor (`0x016F1F68`) und Zielzonen-Richtung (`0x016F1FB4`).
   - `0x004B0550`: `Customer_SelectVoiceCueAndAnim` – Stimm- und Animations-Auswahl über LCG PRNG (`seed = 1103515245 * seed + 12345`).
   - `0x004B0950`: `Customer_UpdateCutsceneCameraAndTimer` – Kamera-Nachführung und pulsierendes Timer-Badge im HUD.
   - `0x004B3D00`: `Customer_RideAnimationAndTimerStep` – Überwacht `g_GameTimer` (`0x016A41A4`) und löst Countdown-Signalton (`0x004D2D20`) aus.
   - `0x004A8050`: `AFS_EventNotify` – Thread-sicherer Ereignis-Melder für AFS-Dateien.

4. **Kollision, Menüs & Cheats:**
   - `0x004C57C0`: `RoadSurfaceRaycastTest` – Prüft Straßenneigung über Testpunkte bei $(-15, 7.5, -7.5)$ und $(15, 7.5, -7.5)$.
   - `0x004D06A0`: `HUD_RenderCenteredTextString` – Zentriert Arcade-Schriftzüge auf 640px Bildschirmbreite (`320.0 - width * 0.5`).
   - `0x004E0300`: `CameraShakeStep` – Gedämpfte Feder-Schwingung (`* 0.9`, Schritt `0x4000` BAM) bei Kollisionen.
   - `0x004E5050`: `DynamicProp_AirbornePhysicsStep` – Flugphysik für abgerissene Hydranten, Telefonzellen und Schilder mit Luftwiderstandsdämpfung (`* 0.995`).
   - `0x004E6A80`: `Sega_EvaluateAnotherDayCheat` – Tastenfolge für den "Another Day" Modus (`0x10000`, `0x20000`, `0x8` und Bestätigung).
   - `0x004ED560`: `CheckUnlockNotificationQueue` – Verarbeitet Freischalt-Banner und verhindert Endlos-Popups.
   - `0x004F0DA0`: `SaveGame_ScanSlotsDirectory` – Sucht Spielstände unter `Documents\SEGA\Dreamcast Collection\Crazy Taxi\CRAZYTAXI_DC`.
   - `0x004F9840`: `UI_RenderCharacterBikeSelect` – Menü-Darstellung für Fahrer- und Bike-Auswahl.
   - `0x005002B0`: `Traffic_FindClosestRoadWaypoint` – Räumliche 3D-Distanzsuche nach dem nächsten Straßenknotenpunkt.
   - `0x00500E20`: `CrazyBox_MiniGameTimerAlertStep` – Warnsignale für Crazy Box Minispiele 1 bis 31.

5. **Fahrzeugdynamik & Fahrwerk:**
   - `0x00510400`: `SolveRigidBodyImpulse` – Exakte Impuls- und Drehimpuls-Kollisionsauflösung zwischen zwei Fahrzeugen.
   - `0x0051139B`: `OrchestrateVehicleAndTrafficFrame` – Haupt-Taktgeber für Fahrzeugphysik und Verkehrs-Streaming.
   - `0x00511F86`: `MasterFramePhysicsCallback` – Wasser-Tiefenprüfung (`Y < -1237.0` löst Bucht-Ertrinkungssequenz aus).
   - `0x00515CD0`: `Vehicle_ComputeTireForcesAndSlip` – Reifenschlupfwinkel- und Reibwert-Berechnung.
   - `0x00516460`: `Vehicle_Solve4WheelSuspensionAndForces` – 4-Rad Einzelradaufhängung, Federwege, Dämpfer und Wankkräfte.
   - `0x00517D70`: `Vehicle_RenderChassisAndWheels` – Rendert Karosserie, Fahrer und alle 4 Räder inklusive Radumdrehung und Lenkeinschlag.

---

### 12.5 Entdeckungen & Korrekturen aus Batch 3 (`0x00401620` – `0x00405AF0`: AFS Streaming, VRAM Mapping, QPC Timing)

In Phase 3 (Batch 3) wurden 100 Funktionen aus dem Bereich `0x00401620` – `0x00405AF0` tiefenanalysiert und in IDA Pro benannt:

1. **Sega Naomi/PowerVR2 VRAM Pointer Translation (`0x004028F0`):**
   - Routine `SegaMemory_TranslateVramPointer`: Translatiert Hardware-VRAM-Adressen der Naomi-Architektur (`0x0C30B000` – `0x0D30B000`, 16 MB Adressfenster) in den PC-RAM-Pool.
   - Formel: `PC_Addr = g_SegaEmulatedRamBase (0x01B7A6A8) + (address & 0x0FFFFFFF) - 0x0C30B000`.
   - Adressbereich außerhalb dieses Fensters wird unverändert durchgereicht.

2. **CRI AFS Container- & Partitions-Streaming-Architektur (`0x00403E30` – `0x00404EE0`):**
   - `0x00403E30`: `AFS_OpenArchive(filename, ptid)` – Bindet Archive (`BINC1.AFS`, `BINC2.AFS`, `BINC3.AFS`), prüft Partitionsliste `dword_1B7AE14`.
   - `0x00403F10`: `AFS_GetPartitionEntry(file_idx, ptid)` – Liest Offset und Dateigröße für Datei `file_idx` aus Partitionstabelle `v5[4] + 28`. Fehlermeldung: `"ADXF: file partition information ( ptid =%d ) does not exist"`.
   - `0x00403FB0`: `AFS_CloseAllArchives()` – Iteriert den globalen Partitions-Baum und entlädt alle reservierten Puffer.
   - `0x00404060`: `AFS_LoadPartition(filename, ptid)` – Binärer Partitions-Loader (`fopen("rb")`, `fseek(SEEK_END)`, `fread`). Loggt `"ADXF: ADXF_LoadPartition success on %s ( ptid = %d )"` bzw. Fehler.
   - `0x00404370` / `0x004043B0` / `0x00404430`: Verwaltung der Partitions-Tabelle (`dword_1B7AE14` als Rot-Schwarz-Baum).
   - `0x00404D40`: `AFS_PendingReadQueue_Clear()` – Leert die verkettete Lesewarteschlange `dword_1EB0AE4`.
   - `0x00404D80`: `AFS_FileHandle_Create()` – Allokiert 164-Byte Datei-Handle-Deskriptor mit Standard-Einstellungen aus `unk_59E4A0`.

3. **High-Precision Platform Timing Subsystem (`0x00405320`, `0x00405370`):**
   - Basiert auf Win32 `QueryPerformanceCounter` & `QueryPerformanceFrequency`.
   - `0x00405320`: `PlatformTimer_Update(state)` – Berechnet verstrichene Zeit in Millisekunden: `delta_ms = (QPC - base_ticks) / frequency * 1000.0`. Speichert Wert bei Offset `+0x28` (`double`).
   - `0x00405370`: `PlatformTimer_HasElapsed(state, timeout_ms)` – Prüft, ob Zeitdifferenz seit letztem Reset `timeout_ms` überschreitet.

4. **Audio BGM Stream Subsystem (`0x004053E0`):**
   - `0x004053E0`: `Audio_PlayBgmStream` – Lädt und startet das Audio-Streaming für Hintergrundmusik aus ADX-Dateien (`"SoundData/music_adx/Flinch.adx"`).

5. **Geometrie-Tri-Strip Index Compressor (`0x004021B0`):**
   - `0x004021B0`: `Geometry_TriStrip_IndexCompressor` – Optimiert Dreiecksstreifen-Indizes für die Dreamcast PowerVR2 Render-Pipeline unter Nutzung der statischen Puffer `word_16EED88`, `word_16EEBE8`, `word_16EEBEA`.

6. **MSVC Standard-Container Dekompilierung (`0x00401620` – `0x00405AF0`):**
   - Identifikation der internen MSVC CRT Container-Routinen für `std::_Tree` (Rot-Schwarz-Bäume mit 17- bzw. 21-Byte Sentinels), `std::wstring` (mit 8-Wchar SSO Puffer), `std::deque` Ringpuffer-Wachstum (`0x004030B0`), `std::vector` Wachstums- und Rotations-Routinen (`0x004036A0`, `0x00403C10`) und `std::list` Knotenverwaltung (`0x00404F80` – `0x004051F0`).

---

### 12.6 Entdeckungen & Korrekturen aus Batch 4 (300er Batch Rebuild: `0x00405D60` – `0x00414310`)

In Phase 3 (Batch 4) wurden 300 Funktionen im Bereich `0x00405D60` – `0x00414310` in IDA Pro tiefenanalysiert und in Rust (`crate::assets::platform_io`) sauber übersetzt:

1. **Sega 3D Render Pipeline Matrix Context (`0x01B7A74C`):**
   - Routine `0x00406DA0` (`SegaRenderer_SetWorldTransformMatrix`): Schreibt die 64-Byte World-Matrix nach `0x01B7A74C + 0x2B0` (Offset 688) und markiert die Flags `0x01000000 | 0x00100000` an Offset `+0x3A8` (936).
   - Routine `0x00406E20` (`SegaRenderer_SetViewTransformMatrix`): Schreibt die 64-Byte View-Matrix nach `0x01B7A74C + 0x2F0` (Offset 752) und setzt das Flag `0x00100000`.
   - Routine `0x00406E80` (`SegaRenderer_SetProjectionMatrix`): Schreibt die 64-Byte Projektions-Matrix nach `0x01B7A74C + 0x330` (Offset 816) und setzt das Flag `0x00100000`.
   - *Bedeutung für Modder*: Sämtliche 3D-Kamera-, Welt- und Modelltransformationen laufen über diese drei festen Matrix-Slots.

2. **CRI Sound Cue Registry & Audio Dictionary (`0x01B7B238`, `0x01B7B23C`):**
   - `0x0040A3F0`: `SoundCueMap_Clear` leert den globalen Cue-Baum bei `0x01B7B238` und setzt den Zähler `dword_1B7B23C` auf 0.
   - `0x0040A740`: `SoundCueMap_Insert(sound_id, cue_data)` registriert neue Sound-Cues.
   - `0x0040A550`: `SoundCueMap_Find(sound_id)` sucht nach Sound-IDs.
   - `0x0040A190`: `SoundCueMap_Erase(sound_id)` löscht Einträge.

3. **CRI 6-Bus Audio State Controller (`0x00405EE0`):**
   - Struktur mit 6 Instanzen à 16 Bytes (Offset `+4`, `+20`, `+36`, `+52`, `+68`, `+84`):
     - Bus 0: Master Bus
     - Bus 1: BGM Music Stream
     - Bus 2: SFX Sound-Effekte
     - Bus 3: Driver/Customer Voice
     - Bus 4: City Ambience / Umwelt
     - Bus 5: Menu / Cutscene

4. **Sega & Direct3D Math / Color Routinen:**
   - `0x00407110` (`Color4f_To_ARGB32`): Konvertiert RGBA-Floats `[0.0, 1.0]` mit `+0.5` Rundung in 32-Bit `D3DCOLOR_ARGB` (`(a << 24) | (r << 16) | (g << 8) | b`).
   - `0x00406EE0` (`Math_AcosClamped`): Arkuskosinus mit Randwertbehandlung (Werte `> 1.0` liefern `0.0`, werte `< -1.0` liefern `PI`).
   - `0x00406F60` (`Vec3_Length`): Euklidische Vektorlänge `sqrt(x^2 + y^2 + z^2)`.

5. **XML Parser & Konfigurations-Subsysteme (`0x00411350`, `0x00412100`, `0x00412A80`, `0x00413530`):**
   - `0x00411350` (`Xml_DecodeBase64Binary`): 6-Bit Stream-Dekoder zum Entpacken eingebetteter Binärdaten (z. B. Bitmap-Icons aus XML).
   - `0x00412100` (`InputConfig_LoadDefaultXml`): Lädt `default_input_config.xml`, parst `pad_config`, `guid` und Player-Belegungen.
   - `0x00412A80` (`SystemConfig_LoadXml`): Lädt `system_config.xml`, liest Auflösung, Bildwiederholrate, `vendorid`, `deviceid` und Adapterbeschreibungen.
   - `0x00413530` (`KeycapConfig_LoadXml`): Lädt `keycap_config.xml` für Xbox-, DInput- und Tastatur-Button-Symbole im HUD.

---

### 12.7 Entdeckungen & Korrekturen aus Batch 5 (400er Batch Rebuild: `0x00414400` – `0x004209C0`)

In Phase 3 (Batch 5) wurden 400 Funktionen (379 Funktionen im Bereich `0x00414400` – `0x0041FED0` für Bereich 1 und 21 Funktionen im Bereich `0x004204B0` – `0x004209C0` für Bereich 2) in IDA Pro tiefenanalysiert und in Rust (`crate::assets::platform_io` und `crate::assets::formats`) übersetzt:

1. **Plattform- & Sprachkonfiguration über Windows-Registry (`0x00414920`, `0x004149B0`, `0x00414A90`):**
   - `0x01EB0ACC`: `g_GameLanguageLCID` (32-Bit DWORD). Standardwert: `1033` (`0x0409`, Englisch/US).
   - Unterstützte Sprachen:
     - `1033` (`0x0409`): Englisch
     - `1031` (`0x0407`): Deutsch
     - `1036` (`0x040C`): Französisch
     - `1040` (`0x0410`): Italienisch
     - `1041` (`0x0411`): Japanisch
     - `3082` (`0x0C0A`): Spanisch
   - `0x01EB08C2`: `g_GameInstallPathW` (260-Wide-Character Unicode-Puffer für Pfad zu `Crazy Taxi.exe`).
   - `0x00414A90`: Win32 `RegQueryValueExW` Wrapper für dynamische Unicode-Strings.
   - `0x00418A00`: Win32 `GetModuleFileNameA` zum Extrahieren des Basispfads der EXE für relative Dateipfade (`SoundData/`, `data_little/`).

2. **TinyXML DOM Baum-Architektur & Entity-Encoder (`0x00414B50` – `0x00418A00`):**
   - Vollständige hierarchische XML-Knotenverwaltung:
     - `TiXmlNode::LinkEndChild` (`0x00415490`): Verkettung von `firstChild` (`+0x18`), `lastChild` (`+0x1C`), `prev` (`+0x24`), `next` (`+0x28`) und `parent` (`+0x10`).
     - `TiXml_EncodeString` (`0x00415140`): Zeichenersetzung für XML-Sonderzeichen (`&` -> `&amp;`, `<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;`, `'` -> `&apos;`, Steuerzeichen `< 0x20` -> `&#x%02X;`).
   - Dynamisches MSVC Container-Memory-Management mit spezifischen Allokatoren für 1092-Byte (`0x00414400`, `0x00414830`), 148-Byte (`0x00414460`, `0x00414870`) und 24-Byte (`0x004144C0`, `0x004148B0`) Knotenstrukturen.

3. **CRI ADX Multi-Threaded Audio Architecture (`0x0146A9AC` – `0x0146AA00`, `0x0041A300` – `0x0041A560`):**
   - 3 dedizierte Win32 Hintergrund-Worker-Threads, erzeugt über `_beginthreadex`:
     - Worker 1: `0x0041A300` (`CRI_WorkerThread_AudioMixer`) – Master Audio-Streaming & Software-Mixing Schleife mit `ResumeThread` Taktung.
     - Worker 2: `0x0041A360` (`CRI_WorkerThread_Device`) – Synchronisation mit Soundkarte / DirectSound Hardware.
     - Worker 3: `0x00419E30` (`CRI_WorkerThread_Decompress`) – Hintergrund-Dekompression von ADX-Audiostreams.
   - Fehler-Strings im Binary:
     - `"E02100911 : The error occurred within the CreateThread function."`
     - `"E02100912 : The error occurred within the CreateThread function."`
     - `"E02100913 : The error occurred within the CreateThread function."`

4. **DirectSound 5.1 Multi-Channel, Stereo & Mono Software PCM Mixer (`0x0041D9E0` – `0x0041FED0`):**
   - DirectSound 8 Sekundärpuffer mit `WAVEFORMATEXTENSIBLE` Konfiguration (`0x0041F090`):
     - Abtastrate: **48.000 Hz**
     - Bittiefe: **16-Bit Signed Integer**
     - Kanalanzahl: **6 Kanäle (5.1 Surround)**
     - Durchsatz: **576.000 Bytes/Sekunde** (`48000 * 6 * 2`)
   - Software PCM Mixer-Architektur für 32 Stimmen (`v30 = 32`):
     - `0x0041D9E0`: 6-Kanal 5.1 Surround-Mixer mit Fließkomma-Lautstärkeskalierung (`* 1024.0`) und 16-Bit Saturation Clamping (`[-32768, 32767]`).
     - `0x0041DCC0`: 2-Kanal Stereo-Downmixer.
     - `0x0041DFA0`: 1-Kanal Mono-Downmixer.
   - Ringpuffer-Sperrung über `IDirectSoundBuffer::Lock` (VTable Offset `+44`) und `IDirectSoundBuffer::Unlock` (VTable Offset `+76`) mit automatischem Umlauf bei Puffergrenze (`v2[9] = v29 - v31`).

5. **CRI SVM (Sound Voice Manager) & Server Callback Engine (`0x004204B0` – `0x004209C0`):**
   - `0x00420740` (`SVM_SetCbSvrId(svtype, name, callback, arg)`): Registriert Server-Callbacks für 8 Subsystem-Kategorien (`svtype 0..7`).
     - Maximal 6 Callbacks pro Kategorie.
     - Fehlerbehandlung: `"1071205:SVM_SetCbSvrId:illegal svtype"` und `"1051001:SVM_SetCbSvr:too many server function"`.
   - `0x004208F0` (`SVM_ExecCbSvr(svtype)`): Führt alle registrierten Server-Callbacks für die angegebene Kategorie synchron aus.
   - `0x00420960` – `0x004209C0`: Feste Trigger-Routinen `SVM_TriggerCbSvr0` bis `SVM_TriggerCbSvr6`.

---

### 12.8 Entdeckungen & Korrekturen aus Batch 6 (400er Batch Rebuild: `0x004209D0` – `0x0042A130`)

In Phase 3 (Batch 6) wurden 400 aufeinanderfolgende Funktionen im Bereich `0x004209D0` – `0x0042A130` in IDA Pro tiefenanalysiert, umbenannt und als sauberes Rust-Modul (`crate::assets::cri_adxf`) implementiert:

1. **Korrektur der Subsystem-Zuordnung (Wichtige Richtigstellung):**
   - In der bisherigen Arbeits-Checkliste (`Functions_Unnamed_Todo.md`) war der Bereich `0x004209D0` – `0x0045FFFF` vorläufig pauschal als *"Vektor-/Matrix-Mathe, Bounding-Boxen und Geometrie-Hilfsroutinen"* klassifiziert.
   - **IDA-Befund**: Der gesamte Adressbereich `0x004209D0` – `0x0042A130` gehört lückenlos zum **CRI Middleware Audio-Streaming, ADX-Dekompressor & Virtual-File-System (XECI) Stack**!
   - **Wichtige Korrektur zur Geometrie**: Die frühere Annahme, Geometrieroutinen würden bei `0x0042A180` beginnen, wurde durch die weiterführende Analyse widerlegt! Auch die anschließenden 500 Funktionen (`0x0042A180` – `0x00439190`) gehören vollständig zur CRI Middleware (ADX Voice Track Processing & Sofdec Video Demuxer, siehe Abschnitt 12.9). Die eigentlichen 3D-Geometrie- und Ninja-Routinen beginnen erst ab `0x00439200`+.

2. **CRI SVM Callback 7 (`0x004209D0`):**
   - `0x004209D0` (`SVM_TriggerCbSvr7`): Komplettiert die 8 SVM Callback-Server (`SVM_ExecCbSvr(7u)`).

3. **CRI ADXF / PCx86 Ver. 7.71 (Build: Jul 27 2009 11:46:15) (`0x00420BB0` – `0x00421780`):**
   - Initialisiert bei `0x00420BB0` (`ADXF_InitLibrary`):
     - Puffer `0x01EC9640` (832 Bytes / 16 Stimmen à 52 Bytes) für aktive Audio-Streams.
     - Puffer `0x01EC9240` (1024 Bytes) für Dateistatus-Deskriptoren.
     - Puffer `0x01EC90E0` (256 Bytes) für Ringpuffer-Sektorindizes.
     - Versionsstring bei `0x00535E78`: `"\nADXF/PCx86 Ver.7.71 Build:Jul 27 2009 11:46:15\n"`.
   - `0x00428F70` (`adxf_Stop`): Stoppt Dateistream und gibt Ringpuffer frei (`"E9040822:'adxf' is NULL.(adxf_Stop)"`, `"E9040823:'adxf->stm' is NULL.(adxf_Stop)"`).

4. **CRI XECI / PCx86 Ver. 1.83 (Build: Jul 27 2009 11:44:57) Virtual File System (`0x00425B80` – `0x004276E0`):**
   - Initialisiert bei `0x00425B80` (`XECI_InitLibrary`).
   - Versionsstring bei `0x00536410`: `"\nXECI/PCx86 Ver.1.83 Build:Jul 27 2009 11:44:57\n"`.
   - Bereitgestellte VTable-API:
     - `cvFsOpen` (`0x00426A30`): Öffnet virtuelle Speichergeräte oder Disc-Dateien.
     - `cvFsClose` (`0x00426510`): Schließt Datei-Handles.
     - `cvFsTell` (`0x00426550`) / `cvFsSeek` (`0x004265A0`): Dateizeiger-Steuerung.
     - `cvFsReqRd` (`0x004265F0`): Asynchroner Leseauftrag in Sektor-Puffer.
     - `cvFsGetStat` (`0x004266A0`): Abfrage von Sektorstatus & Fehlerzuständen.
     - `cvFsIsFileOpened` (`0x004266F0`): Prüft Dateistatus.
     - `cvFsGetFileSizeByHndl64` (`0x004267E0`): 64-Bit Dateigrößen-Abfrage.
     - `cvFsAddDev` (`0x00426C00`): Registriert virtuelle Gerätetreiber (z. B. `game:` Mountpoint).

5. **CRI Memory File System (mfCi) (`0x00426D30` – `0x00427150`):**
   - High-Speed In-Memory Lese- und Streaming-Subsystem (`mfCiOpen`, `mfCiClose`, `mfCiSeek`, `mfCiReqRd`, `mfci_get_adr_size`).

6. **CRI CRS (Critical Section / Thread Synchronization) (`0x004292C0` – `0x00429520`):**
   - Versionsstring bei `0x00536C28`: `"\nCRI CRS/PCx86 Ver.1.03 Build:Jul 27 2009 11:46:04\n"`.
   - Thread-sichere Re-entrant Mutex-Wrapper (`CRICRS_Create`, `CRICRS_Destroy`, `CRICRS_Enter`, `CRICRS_Leave`).

7. **CRI ADXT Track Manager & ADX Header Engine (`0x00428230` – `0x0042A130`):**
   - `0x00428230` (`ADX_ParseHeader`):
     - Validiert das Big-Endian Magic Word `0x8001` (Offset 0..1).
     - Extrahiert Copyright-Offset (`+2`) + 4 Bytes Header-Länge.
     - Prüft Kanalanzahl (`<= 2` für Stereo, `0x00428A20` `adxt_stat_decinfo`).
   - `0x00428D90` (`adxt_ExecHndl`): Frame-basierter Audio-Streaming und Dekompressions-Dispatcher.
   - `0x0042A130` (`ADX_GetBufferOffset`): Liest Puffer-Offset bei Handle `+24`.

---

### 12.9 Entdeckungen & Erweiterungen: CRI ADX Voice & Sofdec Video/Audio Demuxer (`0x0042A180` – `0x00439190` / 500 Funktionen)

In der vertiefenden Dekompilierungsphase wurden 500 weitere Funktionen im Bereich `0x0042A180` – `0x00439190` in IDA Pro Hex-Rays analysiert und im Rust-Modul `crate::assets::cri_adxf` vollständig implementiert (insgesamt 900 CRI-Funktionen):

1. **CRI ADX Stream & ADXT Voice Track Processing (`0x0042A180` – `0x00430FFF`):**
   - `0x0042A180` (`adx_stream_get_chunk_size`): Fragt die Stream-Chunk-Größe bei Offset `+220` des Handle-Blocks ab (Standard 1024 Bytes).
   - `0x0042A1A0` (`adx_stream_get_sample_rate_word`): Frequenz- und Abtastraten-Lookup in 16-Bit Wort-Tabellen.
   - `0x0042A250` (`adx_unpack_voice_track_header`): Entpackt Voice-Track-Header für Mono-, Stereo- und Surround-Sound-Spuren.
   - `0x0042A370` (`adx_get_stream_status`): Fragt den Streaming-Statuswert bei Offset `+4` ab.
   - `0x0042A380` (`adx_calc_buffer_size`): Berechnet die erforderliche Ringpuffergröße anhand von Bitrate und Block-Align.
   - `0x0042A460` (`adx_get_stream_written_bytes`): Liefert geschriebene Byte-Menge bei Offset `+148` (Pufferstand).
   - `0x0042A470` (`adx_get_stream_capacity`): Fragt Gesamtkapazität des Streaming-Puffers bei Offset `+144` ab (16.384 Bytes Standard).
   - `0x0042A480` / `0x0042A4B0` (`adx_feed_mono_device_buffer` / `adx_feed_stereo_device_buffer`): Übergibt dekomprimierte Audiodaten an die Mono- bzw. Stereo-Hardwarepuffer der Soundkarte.
   - `0x0042A5C0` (`adx_memcpy16`): Hochoptimierte 16-Bit Word-Kopierroutine für PCM-Audiosamples.
   - `0x0042A5F0` (`adx_interleave_stereo16`): Interleavet getrennte linke und rechte 16-Bit PCM-Kanäle zu einem gemeinsamen Stereo-Stream `[L0, R0, L1, R1, ...]`.
   - `0x0042A630` (`adx_copy_mono16`): Mono-Pufferkopierer.
   - `0x0042A720` (`adx_stream_pump_step`): Taktet den internen Stream-Pumpen-Zyklus pro Frame.
   - `0x0042B1C0`: Thread-sicherer Eintritt in die Audio-Critical-Section unter Schutz von `CRI_CRS_COUNTER`.
   - `0x0042C4A0`: Dynamische Lautstärke- und Balance-Steuerung für linke/rechte Kanäle (`volume_db`).

2. **CRI Sofdec (SFD) Video/Audio Multiplexing & MPEG Stream Demuxer (`0x00431000` – `0x00439190`):**
   - Crazy Taxi nutzt CRI Sofdec (`.sfd`-Dateien im Ordner `movie/` für Logo-, Titel- und Attract-Videos):
   - `0x00431240` (`sofdec_parse_gop_header`): Erkennt und parst das 32-Bit MPEG Group of Pictures (GOP) Start-Code Magic `0x000001B8`.
   - `0x00433510` (`sofdec_drop_late_frame`): Automatisches Verwerfen verspäteter Video-Frames (Frame-Skipping) zur strikten Synchronisation mit dem Audio-Takt.
   - `0x00435BA0` (`sofdec_timecode_to_frame`): Wandelt MPEG Timecodes (Stunden, Minuten, Sekunden, Frame-Offset) in absolute Video-Frame-Indizes um.
   - `0x004367F0` (`sofdec_timestamp_forwarder`): Überträgt und interpoliert Presentation Time Stamps (PTS).
   - `0x004378C0` (`sofdec_reset_buffer_pointers`): Setzt Sektor- und Ringspeicherzeiger bei Videowiederholungen (Looping) zurück.
   - `0x00438530` (`sofdec_audio_queue_pop_chunk`): Entnimmt demuxte ADX-Audio-Pakete aus dem gemischten Videocontainer und übergibt sie an den Audio-Mixer.
   - `0x00438B50` / `0x00438B80` (`sofdec_stream_free_channel_table` / `sofdec_stream_reset_channel_table`): Bereinigt und initialisiert die Demux-Kanaltabellen für Video- und Audiostreams.
   - `0x00438D90` (`sofdec_stream_demux_channel_chunk`): Zentraler Demultiplexer-Kern für Sofdec-Sektoren.
   - `0x00438F80` (`sofdec_stream_is_channel_ready`): Prüft Datenbereitschaft in den separaten Demux-Puffern.
   - `0x00439000` (`sofdec_stream_video_demux_pump`): Taktet den Videopuffer-Nachschub und ruft `ADX_Dec_428E40` für synchronisierte Audio-Frames auf.
   - `0x004390A0` (`sofdec_stream_audio_demux_pump`): Übergibt demuxte Audiopakete an die Dekompressionsstufe.
   - `0x00439190` (`sofdec_stream_master_demux_decode_pump`): Master-Schleife für gemischtes Video/Audio-Streaming.

---

### 12.10 Vollständige Funktions- & Adressmatrix des Rust Clean-Room Rebuilds

Die folgende Übersicht fasst alle im Rust-Rebuild (`src/`) implementierten und IDA-verifizierten Originalfunktionen der `Crazy Taxi.exe` zusammen:

| Original-Adresse | IDA Pro Name | Rust Modul / Funktion | Subsystem / Bedeutung |
|---|---|---|---|
| `0x00401000` | `std_bad_alloc_dtor` | `assets::formats` | MSVC CRT `std::bad_alloc` Destruktor |
| `0x00401040` | `std_string_ctor` | `assets::formats` | MSVC CRT `std::string` Konstruktor (15-Byte SSO) |
| `0x00401080` | `std_string_tidy` | `assets::formats` | MSVC CRT `std::string::tidy` Pufferfreigabe |
| `0x004012A0` | `std_string_c_str` | `assets::formats` | MSVC CRT `std::string::c_str` Zeigerabfrage |
| `0x004015D0` | `operator_new_checked` | `assets::formats` | MSVC CRT `operator new` mit `bad_alloc` Exception |
| `0x004021B0` | `Geometry_TriStrip_IndexCompressor` | `assets::formats` | Dreiecksstreifen-Index-Kompression für PowerVR2 |
| `0x004028F0` | `SegaMemory_TranslateVramPointer` | `assets::formats` | Naomi VRAM Hardware-Zeigerumrechnung in PC-Pool |
| `0x00403E30` | `AFS_OpenArchive` | `assets::formats` | Öffnet AFS-Archive (`BINC1.AFS`, `BINC2.AFS`, `BINC3.AFS`) |
| `0x00403F10` | `AFS_GetPartitionEntry` | `assets::formats` | Liest Dateioffset & Größe aus Partitions-Header |
| `0x00404060` | `AFS_LoadPartition` | `assets::formats` | Binärer Partitionsloader (`fopen`, `fseek`, `fread`) |
| `0x00404D40` | `AFS_PendingReadQueue_Clear` | `assets::formats` | Leert asynchrone Lesewarteschlange `0x01EB0AE4` |
| `0x00404D80` | `AFS_FileHandle_Create` | `assets::formats` | Allokiert 164-Byte AFS Datei-Handle Deskriptor |
| `0x00405320` | `PlatformTimer_Update` | `assets::formats` | Win32 QPC High-Resolution Millisekunden-Timer |
| `0x00405370` | `PlatformTimer_HasElapsed` | `assets::formats` | Timeout-Prüfung gegen QPC Differenz |
| `0x004053E0` | `Audio_PlayBgmStream` | `assets::formats` | Startet BGM-Streaming aus ADX-Datei |
| `0x004055A0` | `Matrix4x4_LoadIdentityOrCoefficients` | `math::Transform4x4::from_coefficients` | Lädt 4x4 Matrizen-Koeffizienten |
| `0x00405610` | `TransformMatrix_Init` | `math::Transform4x4::from_translation_and_scale` | Erzeugt Translation & Skalierung |
| `0x00405EE0` | `CriAudioController_Destroy6Buses` | `assets::platform_io` | Zerstört 6-Bus CRI Audio-Controller |
| `0x00406DA0` | `SegaRenderer_SetWorldTransformMatrix` | `assets::platform_io` | Schreibt 64-Byte World-Matrix nach `0x01B7A74C + 0x2B0` |
| `0x00406E20` | `SegaRenderer_SetViewTransformMatrix` | `assets::platform_io` | Schreibt 64-Byte View-Matrix nach `0x01B7A74C + 0x2F0` |
| `0x00406E80` | `SegaRenderer_SetProjectionMatrix` | `assets::platform_io` | Schreibt 64-Byte Projektions-Matrix nach `0x01B7A74C + 0x330` |
| `0x00407110` | `Color4f_To_ARGB32` | `assets::platform_io` | Konvertiert 4 Floats in 32-Bit ARGB Integer |
| `0x0040A3F0` | `SoundCueMap_Clear` | `assets::platform_io` | Leert Sound-Cue-Baum `0x01B7B238`, setzt Zähler `0x01B7B23C` auf 0 |
| `0x0040A740` | `SoundCueMap_Insert` | `assets::platform_io` | Registriert Audio-Cues im globalen Wörterbuch |
| `0x00411350` | `Xml_DecodeBase64Binary` | `assets::platform_io` | Base64-Stream-Dekoder für eingebettete Binärdaten |
| `0x00412100` | `InputConfig_LoadDefaultXml` | `assets::platform_io` | Lädt `default_input_config.xml` & Tastenbelegungen |
| `0x00412A80` | `SystemConfig_LoadXml` | `assets::platform_io` | Lädt `system_config.xml` (Auflösung, Vendor, Device) |
| `0x00413530` | `KeycapConfig_LoadXml` | `assets::platform_io` | Lädt `keycap_config.xml` für Button-Icons im HUD |
| `0x00414920` | `GamePlatform_InitLanguageAndInstallPath`| `assets::platform_io` | Liest Windows Registry LCID (`0x01EB0ACC`) & Basispfad |
| `0x00415140` | `TiXml_EncodeString` | `assets::platform_io` | XML Sonderzeichen-Kodierung (`&amp;`, `&lt;`, etc.) |
| `0x00415490` | `TiXmlNode_LinkEndChild` | `assets::platform_io` | Verkettet XML-Kindknoten im hierarchischen DOM-Baum |
| `0x0041A300` | `CRI_WorkerThread_AudioMixer` | `assets::platform_io` | Master Audio-Streaming & Software-Mixing Thread |
| `0x0041D9E0` | `CRI_SoftwareMixer_MultiChannel` | `assets::platform_io` | DirectSound 5.1 Surround Software PCM Mixer (48 kHz, 16-Bit) |
| `0x0041DCC0` | `CRI_SoftwareMixer_Stereo` | `assets::platform_io` | DirectSound 2-Kanal Stereo Downmixer |
| `0x0041DFA0` | `CRI_SoftwareMixer_Mono` | `assets::platform_io` | DirectSound 1-Kanal Mono Downmixer |
| `0x0041F090` | `DirectSound_CreateSecondaryBuffer_51`| `assets::platform_io` | Initialisiert `WAVEFORMATEXTENSIBLE` 5.1 Puffer |
| `0x004201D0` | `Sound_SetChannelVolume` | `assets::formats` | Lautstärke-Einstellung in dB für 32 Kanäle & 6 Busse |
| `0x00420740` | `SVM_SetCbSvrId` | `assets::formats` | Registriert Server-Callbacks für 8 Subsystem-Kategorien |
| `0x004208F0` | `SVM_ExecCbSvr` | `assets::formats` | Führt registrierte Server-Callbacks synchron aus |
| `0x00420BB0` | `ADXF_InitLibrary` | `assets::cri_adxf` | Initialisiert ADXF Ver. 7.71 (Puffer `0x01EC9640` etc.) |
| `0x00425B80` | `XECI_InitLibrary` | `assets::cri_adxf` | Initialisiert XECI Virtual File System Ver. 1.83 |
| `0x00428230` | `ADX_ParseHeader` | `assets::cri_adxf` | Parst Big-Endian ADX Magic `0x8001`, Kanäle & Sampling-Rate |
| `0x00428D90` | `adxt_ExecHndl` | `assets::cri_adxf` | Frame-basierter ADXT Track Streaming Dispatcher |
| `0x0042A180` | `adx_stream_get_chunk_size` | `assets::cri_adxf` | Liest ADX Chunk-Größe bei Offset `+220` |
| `0x0042A250` | `adx_unpack_voice_track_header` | `assets::cri_adxf` | Entpackt ADXT Voice-Track Header |
| `0x0042A480` | `adx_feed_mono_device_buffer` | `assets::cri_adxf` | Übergibt Mono-Audiodaten an Soundkarte |
| `0x0042A4B0` | `adx_feed_stereo_device_buffer` | `assets::cri_adxf` | Übergibt Stereo-Audiodaten an Soundkarte |
| `0x0042A5C0` | `adx_memcpy16` | `assets::cri_adxf` | 16-Bit Word Block-Kopierer für Audiosamples |
| `0x0042A5F0` | `adx_interleave_stereo16` | `assets::cri_adxf` | Interleavet getrennte L/R Kanäle zu Stereo PCM |
| `0x00431240` | `sofdec_parse_gop_header` | `assets::cri_adxf` | Parst MPEG GOP Magic `0x000001B8` für Videos |
| `0x00433510` | `sofdec_drop_late_frame` | `assets::cri_adxf` | Dynamisches Frame-Dropping zur A/V-Synchronisation |
| `0x00435BA0` | `sofdec_timecode_to_frame` | `assets::cri_adxf` | Konvertiert MPEG Timecode in Frame-Nummer |
| `0x004367F0` | `sofdec_timestamp_forwarder` | `assets::cri_adxf` | PTS Presentation Time Stamp Synchronisation |
| `0x00438D90` | `sofdec_stream_demux_channel_chunk` | `assets::cri_adxf` | Haupt-Demuxer für gemischte Video/Audio Chunks |
| `0x00439190` | `sofdec_stream_master_demux_decode_pump`| `assets::cri_adxf` | Master Sofdec Video/Audio Demux- und Dekoder-Pump |
| `0x0047E8B0` | `SegaRenderer_ResetVTable` | `assets::formats` | Setzt virtuellen VTable-Status des Renderers zurück |
| `0x0047EA50` | `SegaRenderer_SetupViewportAndScissor` | `assets::formats` | Konfiguriert Viewport und Scissor-Rechteck |
| `0x00481100` | `ClearD3DState` | `assets::formats` | Setzt alle 16 aktiven Textur-Stages auf 0 |
| `0x00481200` | `SegaRenderer_SetTexture` | `assets::formats` | Direct3D 9 Texturbindung vor `SetTexture(0, ...)` |
| `0x00481220` | `SegaRenderer_SetTexture_Stage` | `assets::formats` | Bindet Texturen auf spezifische Stages 0..15 |
| `0x00481BB0` | `SegaCreateTexture` | `assets::formats` | Direct3D 9 Textur-Allokations-Wrapper |
| `0x00482600` | `SegaRenderer_InitDeviceParameters` | `assets::formats` | Konfiguriert Render-States, Z-Buffer & Blending |
| `0x00482A70` | `SegaRenderer_IsDeviceReady` | `assets::formats` | Prüft Device-Bereitschaft vor Render-Pass |
| `0x00486390` | `DirectInput_PollKeyboard` | `systems::input::InputState::poll_keyboard_buffer` | DirectInput Tastatur-Poll (Scan-Codes zu Tastenmaske) |
| `0x0048B4E0` | `nlVectorNormalize` | `math::nl_vector_normalize` | Sega Ninja 3D Vektor-Normalisierung und Reskalierung |
| `0x0048B7A0` | `LoadStageTexture` | `assets::formats::load_stage_texture` | Lädt Welt- und Stage-Texturen in Master-Slots $\ge 2000$ |
| `0x0048B800` | `LoadStageTexture_Body` | `assets::formats` | Lädt komprimierte Stage-Texturdaten |
| `0x0048CBD0` | `SegaUntwiddleDecoder` | `assets::formats` | 16-Schritt Morton Bit-Deinterleaving |
| `0x0048DDB0` | `SegaVQDecoder` | `assets::formats` | 2048-Byte VQ-Codebook + 2x2 Block Dekoder |
| `0x00492230` | `LoadModelTexture` | `assets::formats::load_model_texture` | Lädt Fahrzeug- & Charakter-Texturen (< 2000) |
| `0x00492780` | `LoadSegaTextureContainer` | `assets::formats::load_sega_texture_container` | Parst 16-Byte Container-Tabellen |
| `0x004949A0` | `GroundCollision_SetTrue` | `entities::vehicle::TaxiVehicle::ground_collision_set_true` | Setzt Bodenkontakt-Flag (`0x01661596 = 1`) |
| `0x004955C0` | `SetLightDirection` | `assets::formats::set_light_direction` | Richtungslicht-Vektor für 3D-Modelle |
| `0x00497160` | `VehicleRenderPasses` | `entities::vehicle::TaxiVehicle::dispatch_render_passes` | Teilt 3D-Rendern in opaken Pass (`0x01BBC4F4`) & Alpha-Pass (`0x01BBC44C`) |
| `0x00499240` | `BindWorldTextures` | `assets::formats::bind_world_textures` | Bindet Mesh-Sektor Texturen beim Streaming |
| `0x0049B200` | `CamLookAt` | `math::Transform4x4::look_at_rh` | 6-DOF Kamera LookAt Matrix mit RH/LH Support |
| `0x0049B920` | `MatrixStack_Push` | `math::MatrixStack::push` | Hierarchischer 4x4 Matrizen-Stack (`0x016F8EAC`) |
| `0x0049C1D0` | `nlAtan2` | `math::atan2_to_bam` | Sega Ninja Arkustangens 2 zu 16-Bit BAM (`0..65535`) |
| `0x004A3900` | `Session_ApplyState` | `world::GameWorld::apply_session_state` | Schreibt Session-Flags nach `0x016A2CFC`, `0x016A2804`, `0x016A2818` |
| `0x004A8050` | `AFS_EventNotify` | `entities::customer::afs_event_notify` | Thread-sicherer Ereignis-Melder für AFS-Dateien |
| `0x004A8DB0` | `Stunt_AddTip` | `systems::timer_score::TimerScoreSystem::add_stunt_tip` | Addiert `25 * mult * combo` Cents auf Trinkgeld-Pool |
| `0x004A8DE7` | Opcode: `add [0x16A41C8], ecx` | `entities::customer::Customer::add_stunt_tip` | ASM-Stelle für Stunt-Trinkgeld-Inkrement |
| `0x004B0190` | `Customer_DetachFromVehicle` | `entities::customer::CustomerManager::detach_customer` | Gibt Fahrgast-Slot im Taxi frei (`0x016F22B8`) |
| `0x004B03D0` | `CustomerTargetDotProduct` | `entities::customer::customer_target_dot_product` | 3D Skalarprodukt zwischen Cab-Heading und Zielzone |
| `0x004B0550` | `Customer_SelectVoiceCueAndAnim` | `entities::customer::select_voice_cue_and_anim` | LCG PRNG (`seed = 1103515245 * seed + 12345`) |
| `0x004B0950` | `Customer_UpdateCutsceneCameraAndTimer` | `entities::customer::CustomerManager::update_cutscene_camera_and_timer` | HUD Pulsierendes Timer-Badge & Kamera |
| `0x004B3D00` | `Customer_RideAnimationAndTimerStep` | `entities::customer::step_customer_ride_animation_and_timer` | Fahrgast-Zufriedenheit & Abbruch bei Zeitablauf |
| `0x004B82F0` | `Passenger_UpdatePickupRide` | `entities::customer::CustomerManager::update_pickup_ride` | Master-Passagierlogik (Einstieg, Fahrt, Ausstieg) |
| `0x004B9220` | `Vehicle_GetSpeed` | `entities::vehicle::TaxiVehicle::get_speed_perspective_warp` | Speed to BAM, $1/\sin$ (`0x0135530C`), $1/\tan$ (`0x013553A0`) |
| `0x004C1810` | `PassengerCopy` | `entities::player::PlayerTaxi::passenger_copy_sync` | Synchronisiert Passagier-Zustand & Position (`0x016F21D0` ff.) |
| `0x004C1A70` | `Passenger_AssignToVehicle` | `entities::customer::CustomerManager::assign_to_vehicle` | Weist Fahrgast dem Taxi zu, startet Cutscene |
| `0x004C57C0` | `RoadSurfaceRaycastTest` | `entities::traffic::road_surface_raycast_test` | Fahrbahn-Prüfung bei Raycast-Offsets `(-15, 7.5, -7.5)` |
| `0x004C9C2A` | `cmp eax, 8` | `systems::audio_state::AudioState` | Dreamcast Marken-Sprachausgabe ("Take me to Pizza Hut!") |
| `0x004D0060` | `SlopeTangentProjection` | `math::slope_tangent_projection` | Fahrbahn-Tangentenvektor senkrecht zur Normalen |
| `0x004D06A0` | `HUD_RenderCenteredTextString` | `systems::ui_hud::HudState::render_centered_arcade_text` | Zentriert Arcade-Schriftzüge bei X=320.0px |
| `0x004D53D0` | `Money_GetTotal` | `systems::timer_score::TimerScoreSystem::get_total_money` | Liefert Gesamtguthaben (`0x016F10E0`) |
| `0x004D9020` | `HUD_RenderNavigationMarks` | `systems::ui_hud::HudState::render_navigation_marks` | Rendert 3D-Pfeil & Markierungen gemäß Cheat-Flags |
| `0x004DC580` | `CollisionWorld` | `entities::traffic::TrafficManager::collision_world` | Master Welt- & Geländekollision |
| `0x004DC660` | `CollisionTraffic2` | `entities::traffic::TrafficManager::collision_traffic_mode2` | Mode 2 Streamer für Requisiten & Passanten |
| `0x004DCA60` | `CollisionTraffic1` | `entities::traffic::TrafficManager::collision_traffic_mode1` | Mode 1 Gameplay-Verkehrs-Distanz-Culling |
| `0x004DCF10` | `CollisionTraffic0` | `entities::traffic::TrafficManager::collision_traffic_mode0` | Mode 0 Proximity-Streamer (Passanten weichen aus) |
| `0x004E0300` | `CameraShakeStep` | `entities::vehicle::TaxiVehicle::camera_shake_step` | Dämpfung `* 0.9`, Rotationsschritt `0x4000` BAM (90°) |
| `0x004E5050` | `DynamicProp_AirbornePhysicsStep` | `entities::vehicle::airborne_prop_debris_step` | Trümmer-Flugphysik mit 0.995 Luftwiderstand & Spin |
| `0x004E6A80` | `Sega_EvaluateAnotherDayCheat` | `world::cheats::SegaCheatsAndUnlocks::evaluate_another_day_cheat` | Tastenfolge `0x10000`, `0x20000`, `0x8` für Another Day |
| `0x004EA2D0` | `Main_GameLoop` | `world::GameWorld::main_game_loop` | Frame-Hauptschleife von Crazy Taxi |
| `0x004EA3A8` | `call 0x004F2ED0` | `world::GameWorld::main_game_loop` | Aufruf des Input-Commits |
| `0x004EAB50` | `CheckUnlockMinigamesAndVehicles`| `world::cheats::SegaCheatsAndUnlocks::check_unlocks_and_minigames` | Prüft Minispiele (4 Tiers) & Bike Mode (80 Kriterien) |
| `0x004ED560` | `CheckUnlockNotificationQueue` | `world::cheats::SegaCheatsAndUnlocks::queue_unlock_notification_banner` | Poppt Banner-Bits & leert Maske `0x016AA3C0` |
| `0x004F0DA0` | `SaveGame_ScanSlotsDirectory` | `world::cheats::scan_save_slots_directory` | Sucht Spielstände unter `CRAZYTAXI_DC/slot_*.dat` |
| `0x004F2D00` | `ResetGameSessionState` | `world::GameWorld::reset_game_session_state` | Setzt Session, Banner und Rundentimer zurück |
| `0x004F2ED0` | `MainInputCommitLoop` | `systems::input::InputState::commit_input_loop` | Input-Commit & Soft-Reset-Erkennung (`0x606 == 1542`) |
| `0x004F9840` | `UI_RenderCharacterBikeSelect` | `systems::ui_hud::HudState::render_character_bike_select_ui` | Fahrer- und Bike-Auswahl Menü-Overlay |
| `0x005002B0` | `Traffic_FindClosestRoadWaypoint` | `entities::traffic::find_closest_road_waypoint` | Snappt Position an den nächsten Straßenknotenpunkt |
| `0x00500AE0` | `Matrix4x4_ExtractEulerBAM` | `math::Transform4x4::extract_euler_bam` | Zerlegt 4x4 Matrix in Euler-BAM (Pitch, Yaw, Roll) |
| `0x00500E20` | `CrazyBox_MiniGameTimerAlertStep`| `systems::ui_hud::HudState::crazy_box_minigame_timer_alert_step` | Warnstufen bei -180, -120, -60, -40 Frames |
| `0x00504090` | `LoadChunksAround` | `world::streaming::ChunkStreamingManager::load_chunks_around` | Proximity Evaluator für 1152-Tabelle (`0x0169AF00`) |
| `0x005045E0` | `SpawnProps` | `world::streaming::ChunkStreamingManager::spawn_props` | Spawnt Props & Fußgänger für geladene Chunks |
| `0x005049F0` | `Stage_SelectStage` | `world::streaming::ChunkStreamingManager::select_stage` | Wählt Arcade (255/240), Original (236/164) oder Box (130/0) |
| `0x005051D0` | `ChunkEvict_TextureBinder` | `world::streaming::ChunkStreamingManager::evict_and_bind_textures` | Entfernt alte Chunks, bindet Texturen (`0x00499240`) |
| `0x0050BED0` | `CollisionIntersect` | `math::collision_intersect_test` | Konvexer Halbebenen-Kreuzprodukttest & $Y$-Höhenberechnung |
| `0x00510400` | `SolveRigidBodyImpulse` | `entities::vehicle::solve_rigid_body_impulse` | Impuls- und Drehimpulsausgleich mit Überlappungstrennung |
| `0x0051139B` | `OrchestrateVehicleAndTrafficFrame` | `entities::vehicle::TaxiVehicle::orchestrate_vehicle_and_traffic_frame` | Primärer Physik-Taktgeber pro Frame |
| `0x00511F86` | `MasterFramePhysicsCallback` | `entities::vehicle::TaxiVehicle::master_frame_physics_callback` | Wasser-Tiefentest (`pos_y < -1237.0`) |
| `0x00515CD0` | `Vehicle_ComputeTireForcesAndSlip` | `entities::vehicle::TaxiVehicle::compute_tire_forces_and_slip` | Reifenschlupfwinkel- & Querkraftberechnung |
| `0x00516460` | `Vehicle_Solve4WheelSuspensionAndForces`| `entities::vehicle::TaxiVehicle::solve_4wheel_suspension_and_forces` | 4-Rad Einzelradaufhängung, Wankkräfte & Dämpfung |
| `0x00517D70` | `Vehicle_RenderChassisAndWheels` | `entities::vehicle::TaxiVehicle::render_chassis_and_wheels` | Zeichnet Karosserie, Fahrer und rotierende Räder |
| `0x0051D940` | `VehicleUpdate` | `entities::vehicle::TaxiVehicle::update_physics` | Haupt-Fahrphysikroutine (Gravitation, MPH, 4x4 Matrix) |
| `0x00521D60` | `CreateVertexBuffer` | `assets::formats::SegaD3DRenderer::create_vertex_buffer` | Direct3D 9 Vertex-Puffer Allokator |
| `0x00521E90` | `CreateIndexBuffer` | `assets::formats::SegaD3DRenderer::create_index_buffer` | Direct3D 9 Index-Puffer Allokator |




### CRI MPV Video Decoder, SIMD Motion Compensation & DCT / VLC Subsystem (0x0044BF80 – 0x0045D870)
| Original-Adresse | Symbol / IDA-Name | Rust Rebuild Äquivalent | Funktion & Zweck |
|---|---|---|---|
| `0x0044BF80` | `sub_44BF80` | `assets::cri_adxf::mps_check_stream_ready_44bf80` | Prüft MPEG-Stream-Header Mindestversion (>=110) & Stream-Typ (Audio 192 / Video 224) |
| `0x0044BFE0` | `sub_44BFE0` | `assets::cri_adxf::mpv_get_stream_status_flag_44bfe0` | Liest globales MPEG-Stream Statuswort (`0x01ED43A4`) |
| `0x0044C040` | `sub_44C040` | `assets::cri_adxf::mpv_dispatch_hook_44c040` | CRI MPV Treiber-Hook Callback-Dispatcher (`0x01ED4374`) |
| `0x0044C110` | `sub_44C110` | `assets::cri_adxf::mpv_motion_comp_vertical_halfpel_8x_44c110` | MMX vertikaler Half-Pel Filter `(src0 + src1 + 1) >> 1` für 8-Pixel Zeilen |
| `0x0044C1D0` | `sub_44C1D0` | `assets::cri_adxf::mpv_motion_comp_horizontal_halfpel_8x_44c1d0` | MMX horizontaler Half-Pel Filter `(src[x] + src[x+1] + 1) >> 1` für 8-Pixel Zeilen |
| `0x0044C230` | `sub_44C230` | `assets::cri_adxf::mpv_motion_comp_diagonal_halfpel_8x_44c230` | MMX diagonaler Half-Pel Filter `(s00 + s01 + s10 + s11 + 2) >> 2` für 8-Pixel Zeilen |
| `0x0044C2C0` | `sub_44C2C0` | `assets::cri_adxf::mpv_motion_comp_vertical_halfpel_16x_44c2c0` | MMX vertikaler Half-Pel Filter für 16-Pixel Zeilen |
| `0x0044C3E0` | `sub_44C3E0` | `assets::cri_adxf::mpv_motion_comp_horizontal_halfpel_16x_44c3e0` | MMX horizontaler Half-Pel Filter für 16-Pixel Zeilen |
| `0x0044C470` | `sub_44C470` | `assets::cri_adxf::mpv_motion_comp_diagonal_halfpel_16x_44c470` | MMX diagonaler Half-Pel Filter für 16-Pixel Zeilen |
| `0x0044C580` | `sub_44C580` | `assets::cri_adxf::mpv_motion_comp_bidir_blend_8x_44c580` | MMX Vorhersage-Blend `(src + dst + 1) >> 1` über 8x-Makroblockzeilen |
| `0x0044C7C0` | `sub_44C7C0` | `assets::cri_adxf::mpv_motion_comp_bidir_vertical_halfpel_8x_44c7c0` | MMX bidirektionaler vertikaler Half-Pel Filter (8x) |
| `0x0044CA10` | `sub_44CA10` | `assets::cri_adxf::mpv_motion_comp_bidir_blend_16x_44ca10` | MMX bidirektionaler Makroblock-Blend für 16-Byte Zeilen |
| `0x0044D5B0` | `sub_44D5B0` | `assets::cri_adxf::mpv_sse_motion_comp_vertical_halfpel_8x_44d5b0` | SSE `pavgb` beschleunigter vertikaler Half-Pel Filter (8x) |
| `0x0044D620` | `sub_44D620` | `assets::cri_adxf::mpv_sse_motion_comp_horizontal_halfpel_8x_44d620` | SSE `pavgb` beschleunigter horizontaler Half-Pel Filter (8x) |
| `0x0044D650` | `sub_44D650` | `assets::cri_adxf::mpv_sse_motion_comp_diagonal_halfpel_8x_44d650` | SSE `pavgb` diagonaler Half-Pel Filter mit Übertrags-Korrektur (8x) |
| `0x0044D760` | `sub_44D760` | `assets::cri_adxf::mpv_sse_motion_comp_copy_16x_44d760` | SSE 16-Byte Zeilenkopie für 16 oder 8 Zeilen |
| `0x0044DC10` | `sub_44DC10` | `assets::cri_adxf::mpv_sse_motion_comp_bidir_blend_8x_44dc10` | SSE `pavgb` bidirektionales Blending über 8-Byte Zeilen |
| `0x0044DEE0` | `sub_44DEE0` | `assets::cri_adxf::mpv_sse_motion_comp_bidir_blend_16x_44dee0` | SSE `pavgb` bidirektionales Blending über 16-Byte Zeilen |
| `0x0044E540` | `sub_44E540` | `assets::cri_adxf::mpv_select_motion_comp_simd_dispatch_44e540` | CPU SIMD-Erkennung (SSE vs MMX) für Bewegungskompensationstabelle |
| `0x0044E570` | `sub_44E570` | `assets::cri_adxf::mpv_idct_pack_blocks_8x8_mmx_44e570` | MMX `packuswb` Konvertierung von 16-Bit IDCT Blöcken zu 8-Bit Pixeln |
| `0x0044E690` | `sub_44E690` | `assets::cri_adxf::mpv_idct_add_residual_blocks_8x8_mmx_44e690` | MMX `paddsw` + `packuswb` IDCT-Residuen-Addition auf Vorhersage |
| `0x0044E840` | `sub_44E840` | `assets::cri_adxf::mpv_idct_pack_blocks_8x8_sse2_44e840` | SSE2 `_mm_packus_epi16` Block-Packer |
| `0x0044E900` | `sub_44E900` | `assets::cri_adxf::mpv_idct_add_residual_blocks_8x8_sse2_44e900` | SSE2 `_mm_add_epi16` IDCT-Residuen-Addition |
| `0x0044EA40` | `sub_44EA40` | `assets::cri_adxf::mpv_cri_dct_get_version_string_44ea40` | CRI DCT/PCx86 Ver.2.035 Build:Jul 3 2009 (`0x0053A570`) |
| `0x0044EA90` | `sub_44EA90` | `assets::cri_adxf::mpv_cri_dct_init_cosine_matrix_44ea90` | Vorberechnung der orthonormalen 8x8 Kosinus-Matrix `unk_1623CE0` |
| `0x0044EB30` | `sub_44EB30` | `assets::cri_adxf::mpv_cri_dct_transform_8x8_f64_44eb30` | 8x8 2D IDCT Matrixmultiplikation ($X = A \cdot C^T, Y = C \cdot X$) |
| `0x0044EC80` | `sub_44EC80` | `assets::cri_adxf::mpv_cri_dct_round_dc_coeff_44ec80` | DC-Koeffizienten-Rundung `if val < 0 { -((4-val)>>3) } else { (val+4)>>3 }` |
| `0x0044ECB0` | `sub_44ECB0` | `assets::cri_adxf::mpv_cri_dct_2d_idct_fast_8x8_44ecb0` | Schnelle SIMD 8x8 2D IDCT mit DC-Only Broadcast |
| `0x0044FC20` | `sub_44FC20` | `assets::cri_adxf::mpv_vlc_decode_macroblock_coefficients_44fc20` | MPEG-2 VLC/Huffman Makroblock-Koeffizienten-Dekoder mit Dequantisierung |
| `0x00451E80` | `sub_451E80` | `assets::cri_adxf::mpv_vlc_decode_intra_macroblock_coefficients_451e80` | MPEG-2 Intra-Makroblock VLC-Dekoder (MPEG-2 Tabelle B.14, ungerade Rundung) |
| `0x00453EB0` | `sub_453EB0` | `assets::cri_adxf::mpv_vlc_decode_non_intra_macroblock_coefficients_453eb0` | MPEG-2 Non-Intra-Makroblock VLC-Dekoder (Tabelle B.14/B.15, $2 \cdot level + 1$) |
| `0x004563C0` | `sub_4563C0` | `assets::cri_adxf::mpv_vlc_decode_macroblock_f64_quant_4563c0` | Fliesskomma-Dequantisierungs-VLC-Makroblock-Dekoder |
| `0x00459EC0` | `sub_459EC0` | `assets::cri_adxf::mpv_vlc_decode_macroblock_alternate_scan_459ec0` | MPEG-2 VLC-Dekoder mit alternativer vertikaler Abtastung (Interlaced) |
| `0x0045D870` | `sub_45D870` | `assets::cri_adxf::mpv_vlc_decode_macroblock_chroma_45d870` | MPEG-2 4:2:0 Chroma Cr/Cb Makroblock-VLC-Dekoder |

### Direct3D 9 & Runtime Synchronization Subsystem (0x00461440 – 0x00461EA3)
| Original-Adresse | Symbol / IDA-Name | Rust Rebuild Äquivalent | Funktion & Zweck |
|---|---|---|---|
| `0x00461440` | `sub_461440` | `assets::cri_adxf::d3d_read_le_bytes_to_u32_461440` | Little-Endian Bytefolge in 32-Bit Integer |
| `0x00461460` | `sub_461460` | `assets::cri_adxf::d3d_read_be_bytes_to_u32_461460` | Big-Endian Bytefolge in 32-Bit Integer |
| `0x00461490` | `sub_461490` | `assets::cri_adxf::d3d_buffer_pointer_diff_461490` | Puffer-Zeigerdifferenz `end - start` |
| `0x004614BB` | `?_Xlength_error@std@@YAXPBD@Z` | `assets::cri_adxf::d3d_std_throw_length_error_4614bb` | std::length_error Exception Dispatch |
| `0x00461508` | `?_Xout_of_range@std@@YAXPBD@Z` | `assets::cri_adxf::d3d_std_throw_out_of_range_461508` | std::out_of_range Exception Dispatch |
| `0x00461576` | `??_U@YAPAXI@Z` | `assets::cri_adxf::d3d_std_operator_new_array_461576` | Standard Array-Allokator (operator new[]) |
| `0x00461581` | `??0_Init_locks@std@@QAE@XZ` | `assets::cri_adxf::d3d_std_init_locks_ctor_461581` | Globales Lock-Setup (`stru_163EEE8`) |
| `0x004615DB` | `??0_Lockit@std@@QAE@H@Z` | `assets::cri_adxf::d3d_std_lockit_enter_4615db` | Betritt Critical-Section Lock |
| `0x00461603` | `??1_Lockit@std@@QAE@XZ` | `assets::cri_adxf::d3d_std_lockit_leave_461603` | Verlässt Critical-Section Lock |
| `0x0046161A` | `??0_Mutex@std@@QAE@XZ` | `assets::cri_adxf::d3d_std_mutex_ctor_46161a` | Allokiert 24-Byte Win32 RTL_CRITICAL_SECTION Mutex |
| `0x0046165D` | `??8error_condition@std@@QBE_NABV01@@Z` | `assets::cri_adxf::d3d_std_error_condition_eq_46165d` | std::error_condition Gleichheitsvergleich |
| `0x00461755` | `?_Callfns@ios_base@std@@AAEXW4event@12@@Z` | `assets::cri_adxf::d3d_std_ios_base_callfns_461755` | Stream Event-Callback Dispatcher |
| `0x0046177C` | `?_Tidy@ios_base@std@@AAEXXZ` | `assets::cri_adxf::d3d_std_ios_base_tidy_46177c` | Stream Format & Callback Liste Cleanup |
| `0x00461813` | `?_Facet_Register@facet@locale@std@@CAXPAV123@@Z` | `assets::cri_adxf::d3d_std_facet_register_461813` | Registriert Facet in globaler Kette (`0x0163EF84`) |
| `0x004618BA` | `?_Locimp_dtor@_Locimp@locale@std@@CAXPAV123@@Z` | `assets::cri_adxf::d3d_std_locimp_dtor_4618ba` | Gibt alle Locale-Facets frei |
| `0x00461ACB` | `?_Init@locale@std@@CAPAV_Locimp@12@XZ` | `assets::cri_adxf::d3d_std_locale_init_461acb` | Initialisiert Standard-C-Locale (`0x0163EF88`) |
| `0x00461B5F` | `__Tolower` | `assets::cri_adxf::d3d_std_tolower_461b5f` | ASCII/CRT Lowercase Konvertierung |
| `0x00461CCC` | `__Toupper` | `assets::cri_adxf::d3d_std_toupper_461ccc` | ASCII/CRT Uppercase Konvertierung |
| `0x00461E71` | `?_Atexit@@YAXP6AXXZ@Z` | `assets::cri_adxf::d3d_std_atexit_register_461e71` | Registriert Shutdown-Callback in LIFO-Queue (`0x0163F0C8`) |
| `0x00461EA3` | `??1_Init_atexit@@QAE@XZ` | `assets::cri_adxf::d3d_std_init_atexit_dtor_461ea3` | Führt registrierte Shutdown-Callbacks aus |

### 12.11 Bereich 8: Streaming, Destination Navigation & Route Heuristics (0x004F9840 – 0x004FFA40)
| Original-Adresse | Symbol / IDA-Name | Rust Rebuild Äquivalent | Funktion & Zweck |
|---|---|---|---|
| `0x004F9840` | `sub_4F9840` / `UI_RenderCharacterBikeSelect` | `systems::ui_hud::HudState::render_character_bike_select_ui` | Rendert Fahrer- und Bike-Auswahl-UI |
| `0x004F9EB0` | `sub_4F9EB0` | `world::streaming::streaming_modal_dialog_prompt_4f9eb0` | Modaler Dialog-Prompt-Controller mit Countdown-Timer |
| `0x004FA0F0` | `sub_4FA0F0` | `world::streaming::menu_vehicle_bike_select_4fa0f0` | Fahrzeug-/Bike-Auswahlmenü Zustandsauswertung (`g_SegaBikeMode`) |
| `0x004FA220` | `sub_4FA220` | `world::streaming::menu_6slot_vertical_select_4fa220` | 6-Slot vertikales Menülayout mit Auswahlanzeige |
| `0x004FA950` | `sub_4FA950` | `world::streaming::dialog_2choice_confirm_tick_4fa950` | 2-Wahl Bestätigungsdialog-Tick & Zustandsaktualisierung |
| `0x004FAAF0` | `sub_4FAAF0` | `world::streaming::session_transition_reinit_4faaf0` | Spielsitzungs-Übergang und Reinitialisierung der Geometrie-Streaming-Tabellen |
| `0x004FB120` | `sub_4FB120` | `world::streaming::streaming_sync_lighting_scales_4fb120` | Synchronisiert Ambiente- & Diffuse-Beleuchtung (6 Floats) |
| `0x004FB260` | `sub_4FB260` | `world::streaming::streaming_copy_vec3_state_4fb260` | Kopiert 3-Element-Vektor/Statuspuffer (X, Y, Z / Farbtöne) |
| `0x004FB290` | `sub_4FB290` | `world::streaming::set_stage_lighting_preset_4fb290` | Setzt Beleuchtungs-Presets (Tageslicht vs Abend/Tunnel) |
| `0x004FB350` | `sub_4FB350` | `world::streaming::compute_sun_light_vector_4fb350` | Berechnet Himmelslicht- & Reflexionsvektoren aus 16-Bit BAM-Winkel |
| `0x004FB420` | `sub_4FB420` | `world::streaming::unpack_tile_glyph_48x32_4fb420` | Entpackt 48x32 Font/Kachel-Glyphe in 1536-Byte-Slot |
| `0x004FB4D0` | `nullsub_88` | `world::streaming::nullsub_88_4fb4d0` | Verified IDA No-Op Stub (ret 0) |
| `0x004FB510` | `sub_4FB510` | `world::streaming::weather_transition_state_4fb510` | Zustandsautomat für Wetter- & Beleuchtungsübergänge |
| `0x004FB5A0` | `sub_4FB5A0` | `world::streaming::destination_banner_anim_4fb5a0` | Schiebeanimation und Timer des Zielort-Banners |
| `0x004FBBF0` | `sub_4FBBF0` | `world::streaming::is_destination_eligible_4fbbf0` | Prüft Zulässigkeit von Zielrouten nach Spielmodus |
| `0x004FBC50` | `sub_4FBC50` | `world::streaming::is_checkpoint_waypoint_match_4fbc50` | Wegpunkt-Übereinstimmungsprüfung für Pfeilanzeige |
| `0x004FBCC0` | `sub_4FBCC0` | `world::streaming::reset_destination_display_flag_4fbcc0` | Setzt Zielortanzeige-Timer und Anzeige-Flags zurück |
| `0x004FBCD0` | `sub_4FBCD0` | `world::streaming::compute_cluster_bounding_sphere_4fbcd0` | Berechnet 3D-Hüllkugel (Zentroid & 1.2x-Radius) aus Cluster |
| `0x004FBF00` | `sub_4FBF00` | `world::streaming::init_route_cluster_heuristics_4fbf00` | Initialisiert Passagier-Routencluster & Distanztabelle |
| `0x004FC3A0` | `sub_4FC3A0` | `world::streaming::configure_navigation_arrow_4fc3a0` | Konfiguriert Pfeilsichtbarkeit und Distanzschwellen (700/750 vs 1100/1200) |
| `0x004FC490` | `sub_4FC490` | `world::streaming::is_vehicle_in_destination_zone_4fc490` | Zielzonen-Erkennung & Parkplatz-Trigger-Evaluator |
| `0x004FC5C0` | `sub_4FC5C0` | `world::streaming::is_destination_fulfilled_4fc5c0` | Erweiterte Zielerreichungs- & Sprunghöhen-Schwellenwertprüfung |
| `0x004FC720` | `sub_4FC720` | `world::streaming::is_passenger_dropoff_stop_valid_4fc720` | Drop-Off Geschwindigkeits- (<0.15) & Lenkwinkelschwelle (<16 BAM) |
| `0x004FC7F0` | `sub_4FC7F0` | `world::streaming::destination_zone_pulse_beacon_4fc7f0` | Zielzonen-Blinkleuchten-Pulsanimation & Farbtabellen-Interpolation |
| `0x004FCC00` | `sub_4FCC00` | `world::streaming::passenger_ride_state_machine_4fcc00` | Hauptzustandsautomat für Fahrgastaufnahme, Fahrt & Auszahlung |
| `0x004FDB20` | `sub_4FDB20` | `world::streaming::spawn_passenger_mission_event_4fdb20` | Allokiert & verknüpft Fahrgast-Missionsereignis |
| `0x004FDD90` | `sub_4FDD90` | `world::streaming::update_passenger_spawner_loop_4fdd90` | Haupt-Fahrgast-Spawner & Routen-Näherungsauswertung |
| `0x004FE180` | `sub_4FE180` | `world::streaming::reset_navigation_target_waypoint_4fe180` | Setzt aktiven Navigations-Zielwegpunktindex auf -1 |
| `0x004FE190` | `sub_4FE190` | `world::streaming::update_beacon_pulse_alpha_4fe190` | Pulsierende Alpha-/Leucht-Animation für Pfeile & Baken |
| `0x004FE290` | `sub_4FE290` | `world::streaming::bind_destination_target_4fe290` | Bindet 3D-Zielkoordinaten & Höhenversatz (100.0) |
| `0x004FE2E0` | `sub_4FE2E0` | `world::streaming::is_point_in_destination_polygon_4fe2e0` | Punkt-in-Polygon-Test für Zielzonen-Begrenzungen |
| `0x004FE320` | `sub_4FE320` | `world::streaming::update_navigation_arrow_anim_4fe320` | 3D-Navigationspfeil-Ausrichtung & Schwebewellen-Animation |
| `0x004FE990` | `sub_4FE990` | `world::streaming::generate_ground_circle_12gon_4fe990` | Erzeugt 12-eckiges Bodenpolygon um Zielkoordinaten |
| `0x004FEAB0` | `sub_4FEAB0` | `world::streaming::build_destination_wall_mesh_4feab0` | Erzeugt 3D-extrudierte durchscheinende Zielzonen-Wand mit UV-Scroll |
| `0x004FF3A0` | `sub_4FF3A0` | `world::streaming::reset_customer_mission_flags_4ff3a0` | Setzt Kunden-Missions-Flags zurück |
| `0x004FF3F0` | `sub_4FF3F0` | `world::streaming::evaluate_delivery_time_bonus_4ff3f0` | Bewertet Lieferzeit-Einstufung (Speedy/Normal/Slow) & Zeitbonus |
| `0x004FF4F0` | `sub_4FF4F0` | `world::streaming::calculate_passenger_mission_fare_and_time_4ff4f0` | Berechnet Missions-Zeitlimit, Bonusschwellen & Basisfahrpreis |
| `0x004FF680` | `sub_4FF680` | `world::streaming::init_game_session_timer_and_fares_4ff680` | Spielsitzungs-Timer-Initialisierung (3/5/10 Min / Arcade) |
| `0x004FF880` | `sub_4FF880` | `world::streaming::session_gameplay_frame_tick_4ff880` | Per-Frame-Session-Tick: dekrementiert Timer & löst TIME UP aus |
| `0x004FF9C0` | `sub_4FF9C0` | `world::streaming::handle_time_over_result_transition_4ff9c0` | Time-Over-Countdown & Übergang zu Lizenzrang-Ergebnisbildschirm |
| `0x004FFA40` | `sub_4FFA40` | `world::streaming::pre_race_countdown_tick_4ffa40` | Start-Countdown-Zustandsautomat (Ready/Go-Signal bei Frame 60) |

### 12.12 Bereich 8: Streaming, Dynamic Props & Chunk Grid Architecture (0x004FFB60 – 0x005035E0)
| Original-Adresse | Symbol / IDA-Name | Rust Rebuild Äquivalent | Funktion & Zweck |
|---|---|---|---|
| `0x004FFB60` | `sub_4FFB60` | `world::streaming::set_streaming_context_4ffb60` | Setzt globalen Streaming/Chunk-Render-Kontext (`dword_13C396C`) |
| `0x004FFB70` | `sub_4FFB70` | `world::streaming::get_streaming_status_flag_4ffb70` | Liest Streaming-Statusflag (`dword_1B7A854`) |
| `0x004FFBB0` | `sub_4FFBB0` | `world::streaming::get_indexed_waypoint_position_4ffbb0` | Extrahiert 3D-Positionsvektor aus indizierter Wegpunkt-/Spawn-Tabelle (12 Bytes = 3x f32) |
| `0x004FFC30` | `sub_4FFC30` | `world::streaming::advance_path_node_traversal_4ffc30` | Spline-Pfadfortschritt-Traversierer: Vorwärts-/Rückwärtsschreiten entlang verbundener Straßenknoten |
| `0x004FFD30` | `sub_4FFD30` | `world::streaming::streaming_prng_next_4ffd30` | Klassischer LCG-Pseudozufallszahlengenerator für Welt-Streaming (`seed * 1103515245 + 12345`) |
| `0x004FFD50` | `sub_4FFD50` | `world::streaming::streaming_prng_reset_4ffd50` | Setzt Streaming LCG PRNG-Seed auf Standard-Initialwert (12345) zurück |
| `0x004FFE40` | `sub_4FFE40` | `world::streaming::find_nearest_waypoint_4ffe40` | Multimodale Wegpunktsuche (Exhaustiv, Gradientenabstieg vorwärts/bidirektional, 7-Schritt-Fenster) |
| `0x005002B0` | `Traffic_FindClosestRoadWaypoint` | `entities::traffic::find_closest_waypoint` | Sucht nächsten Straßenwegpunkt für KI-Verkehrsagenten |
| `0x00500410` | `sub_500410` | `world::streaming::interpolate_bam_angular_diff_500410` | Kürzeste vorzeichenbehaftete Winkeldifferenz zweier 16-Bit-BAM-Winkel skaliert mit Faktor |
| `0x00500470` | `sub_500470` | `world::streaming::request_or_allocate_streaming_chunks_500470` | Fordert, aktiviert oder allokiert 1152-Slot-Streaming-Chunk-Tabelleneinträge (`0x0169AF00`) |
| `0x005005A0` | `sub_5005A0` | `world::streaming::update_prop_geometry_instancer_5005a0` | Zustandsautomat für Requisiten- und dynamische Weltgeometrie-Instanziierung |
| `0x00500970` | `sub_500970` | `world::streaming::find_nearest_waypoint_on_road_graph_500970` | Findet nächsten Wegpunkt über verbundene Straßensegmente mit Vorwärts-/Rückwärts-Graphsuche |
| `0x00500AE0` | `Matrix4x4_ExtractEulerBAM` | `math::Transform4x4::extract_euler_bam` | Extrahiert Euler-Drehwinkel im BAM-Format aus 4x4-Transformationsmatrix |
| `0x00500DC0` | `sub_500DC0` | `world::streaming::interpolate_clamped_bam_angular_diff_500dc0` | Berechnet interpolierte BAM-Winkeldifferenz und klemmt Delta auf [-limit, +limit] |
| `0x00500E20` | `CrazyBox_MiniGameTimerAlertStep` | `systems::ui_hud::CrazyBoxTimer::update` | Crazy Box Minispiel-Timer-Schritt und Countdown-Alarm-HUD-Logik |
| `0x005014A0` | `sub_5014A0` | `world::streaming::init_stage_prop_buffers_5014a0` | Initialisiert dynamische Requisiten-Pufferkapazität (5400 Slots) für Arcade/Original-Karten |
| `0x00501920` | `sub_501920` | `world::streaming::place_dynamic_prop_on_terrain_501920` | Platziert dynamischen Objekt-Spawn-Punkt mit Terrain-Höhenabfrage und +4.0 Bodenabstand |
| `0x00501A40` | `sub_501A40` | `world::streaming::init_dynamic_camera_tracker_501a40` | Initialisiert dynamischen Kamera- und Fahrzeug-Tracking-Status (24 History-Slots) |
| `0x005023F0` | `sub_5023F0` | `world::streaming::push_matrix_transform_and_dispatch_5023f0` | Pusht Transformation auf Matrix-Stack, berechnet Translation, BAM-Rotationen und Skalierung |
| `0x005027A0` | `sub_5027A0` | `world::streaming::reset_streaming_subsystem_5027a0` | Haupt-Reset des Streaming-Subsystems und Szenenübergangs-Orchestrator |
| `0x00502950` | `sub_502950` | `world::streaming::update_replay_demo_streaming_502950` | Attract-/Replay-Wiedergabetreiber und entfernungsbasiertes Chunk-Streaming (450/850, 900/1700) |
| `0x00503530` | `sub_503530` | `world::streaming::configure_stage_model_table_bases_503530` | Konfiguriert Modelltabellen-Basisindizes für dynamische Requisiten und Gebäude (520, 580, 680, 850) |
| `0x005035E0` | `sub_5035E0` | `world::streaming::evict_and_free_streaming_chunk_slot_5035e0` | Gibt allokierten Chunk-Texturpuffer frei und setzt Slot-Status auf Evicted zurück |

### 12.13 Bereich 8: Sound-Streaming, Land-Mounting & Chunk Heap Allocator (0x00503670 – 0x00506040)
| Original-Adresse | Symbol / IDA-Name | Rust Rebuild Äquivalent | Funktion & Zweck |
|---|---|---|---|
| `0x00503670` | `nullsub_89` | `world::streaming::nullsub_89_503670` | Verified IDA No-Op Stub (`ret 0`) |
| `0x005036A0` | `sub_5036A0` | `world::streaming::find_best_fit_chunk_slots_5036a0` | Best-Fit / LRU-Slotblock-Allokator für 1152-Slot-Streaming-Tabelle mit Durchschnitts-TTL-Bewertung |
| `0x00503760` | `sub_503760` | `world::streaming::init_chunk_texture_table_1152_503760` | Master-Initialisierer für 1152 Chunk-Slots (8KB VRAM-Abstand 0x2000, TTL 1000) und Sentinel |
| `0x005037D0` | `nullsub_90` | `world::streaming::nullsub_90_5037d0` | Verified IDA No-Op Stub (`ret 0`) |
| `0x005037E0` | `sub_5037E0` | `world::streaming::audio_samples_to_streaming_frames_5037e0` | Konvertiert Audio-Sample-Position in 60Hz-Streaming-Animationsframes (Faktor `1.0 / 735.0`) |
| `0x005038F0` | `sub_5038F0` | `world::streaming::arm_streaming_background_request_5038f0` | Schärft asynchronen Streaming-Ladeauftrag für Sektor und Audiokanal |
| `0x00503910` | `sub_503910` | `world::streaming::compute_audio_db_attenuation_503910` | Rechnet 0..127-Lautstärke in Sega-Dezibel-Dämpfung um (Mute=-999 dB, `log10(vol/127)*200`) |
| `0x00503980` | `sub_503980` | `world::streaming::compute_direct_volume_db_503980` | Direkte Dezibel-Dämpfungsumrechnung ohne Gameplay-Dämpfung |
| `0x005039D0` | `sub_5039D0` | `world::streaming::compute_audio_stream_remaining_frames_5039d0` | Berechnet verbleibende Audiopuffer-Frames bis zum Stream-Ende (Standardkapazität: 362340) |
| `0x00503B00` | `sub_503B00` | `world::streaming::init_active_stage_texture_table_503b00` | Setzt Master-Texturbasisindex (2000) und nullt aktive Texturslots in `g_pActiveStageTable` |
| `0x00503B40` | `sub_503B40` | `world::streaming::request_chunk_with_distance_ttl_503b40` | Fordert Chunk mit entfernungsabhängigem Timer-TTL an (`TTL = 90.0 - dist * 0.2`) |
| `0x00503C70` | `sub_503C70` | `world::streaming::update_streaming_audio_channel_volume_503c70` | Berechnet Master- & Kanal-Lautstärke (`master * 0.125 * channel_vol`) und setzt Kanaldämpfung |
| `0x00503CF0` | `sub_503CF0` | `world::streaming::stop_all_streaming_audio_channels_503cf0` | Stoppt, pausiert und flusht alle 4 Sega Streaming-Audiokanäle |
| `0x00503DC0` | `sub_503DC0` | `world::streaming::stop_streaming_audio_channel_503dc0` | Stoppt, pausiert und flusht einzelnen Streaming-Audiokanal |
| `0x00503E00` | `sub_503E00` | `world::streaming::set_streaming_bgm_volume_503e00` | Setzt Soundtrack-Masterlautstärke auf Kanal 0 mit Gameplay-Dämpfungsmodus |
| `0x00503EC0` | `sub_503EC0` | `world::streaming::stop_primary_streaming_channel_503ec0` | Stoppt und flusht primären Soundtrack-Kanal 0 |
| `0x00503F00` | `sub_503F00` | `world::streaming::flush_session_audio_playback_503f00` | Flusht und treibt Audiowiedergabe in Menüs und Titelsegmenten voran |
| `0x00504300` | `sub_504300` | `world::streaming::advance_streaming_soundtrack_track_504300` | Schaltet zum nächsten der 11 Soundtrack-Titel weiter (`(track + 1) % 11`) |
| `0x00504350` | `sub_504350` | `world::streaming::tick_streaming_audio_fade_out_504350` | Frame-Ausblend-Zustandsautomat mit Vorlaufverzögerung und linearem Dezibel-Decay |
| `0x005043D0` | `sub_5043D0` | `world::streaming::stream_afs_chunk_sectors_5043d0` | Streamt 32KB-Chunkblöcke (16 CD-Sektoren = 16 * 2048) aus CRI AFS ins VRAM-Staging |
| `0x005044B0` | `sub_5044B0` | `world::streaming::preload_map_spawn_chunks_5044b0` | Kartenspezifische Spawn-Koordinaten und Vorlade-Radien (Arcade, Another Day, Original) |
| `0x005046D0` | `sub_5046D0` | `world::streaming::request_and_render_chunk_5046d0` | Sofortige Sichtbarkeitsprüfung, Pass-0 Render-Dispatch und TTL-Kalkulation (`120 - 0.4*dist + 90`) |
| `0x00504830` | `sub_504830` | `world::streaming::resume_streaming_soundtrack_504830` | Reaktiviert Soundtrack-Kanal 0 nach Pause oder Fade-Out mit Standardlautstärke |
| `0x00504950` | `sub_504950` | `world::streaming::teardown_stage_streaming_environment_504950` | Bereinigt Bühnen-Streamingumgebung, wirft Chunk-Slots ab und setzt Modellbasis zurück |
| `0x00504B10` | `sub_504B10` | `world::streaming::start_race_bgm_playback_504b10` | Startet Renn-Soundtrack bei GO-Signal (Countdown Frame 60) mit aktiver Dämpfung |
| `0x00504BC0` | `sub_504BC0` | `world::streaming::init_streaming_soundtrack_system_504bc0` | Master-Setup für Soundtrack & Stimmen: bindet `SONG01.AFS` & `VOICE01.AFS`, wählt Zufallstitel |
| `0x00504C80` | `sub_504C80` | `world::streaming::preload_stage_texture_containers_504c80` | Lädt Texturcontainer für Stufen (Basen 240, 460/470, 520, 580/680/800/850/900) |
| `0x00504EA0` | `sub_504EA0` | `world::streaming::load_all_stage_textures_504ea0` | Lädt alle Stufentexturen ab Basisindex 2000 aus `g_pActiveStageTable` bis -1 Marker |
| `0x00504EE0` | `sub_504EE0` | `world::streaming::resolve_mesh_node_textures_from_vram_504ee0` | Löst Netzwerkknoten-Texturen aus emuliertem Dreamcast-VRAM-Bereich (`0x0C30B000` - `0x0D30B000`) auf |
| `0x00504FF0` | `sub_504FF0` | `world::streaming::commit_streaming_sector_transfer_504ff0` | Schließt Sektorgeometrie-Transfer ab und setzt Übertragungsstatus zurück |
| `0x00505050` | `sub_505050` | `world::streaming::mount_and_init_land_mesh_archive_505050` | Öffnet `LandDC1.AFS`/`LandDC2.AFS` und streamt initialen 32KB-Wurzelterrainblock |
| `0x00505350` | `sub_505350` | `world::streaming::update_soundtrack_crossfade_505350` | Kontinuierliche Titelüberblendung (120 Frames vor Ende) und automatische Weiterschaltung |
| `0x00505460` | `sub_505460` | `world::streaming::transition_stage_load_state_to_1_505460` | Schaltet Ladezustand auf 1 und lädt Basis-225-Container |
| `0x00505540` | `sub_505540` | `world::streaming::transition_stage_load_state_to_5_505540` | Schaltet Ladezustand auf 5 und bindet Basis-480-Texturen |
| `0x005055A0` | `sub_5055A0` | `world::streaming::transition_stage_load_state_to_3_5055a0` | Schaltet Ladezustand auf 3 für interaktive Spielwelt (Basen 240, 460/470, 520) |
| `0x005056B0` | `sub_5056B0` | `world::streaming::init_stage_sprites_and_textures_coldboot_5056b0` | Kaltstart-Initialisierung: 2D-HUD-Sprites (`tbl_sprDC0`), Bühnensprites und 3D-Bühnentexturen |
| `0x00505A90` | `sub_505A90` | `world::streaming::bootstrap_stage_world_geometry_505a90` | Gesamter Geometrie-Bootstrap: Stufenwahl, VRAM-Knoten, 1152-Slot-Tabelle und LandDC-Mount |
| `0x00505BD0` | `sub_505BD0` | `world::streaming::process_background_chunk_streaming_loop_505bd0` | Asynchrone Hauptstreaming-Schleife: Verfall nicht referenzierter Chunks und Nachladen |
| `0x00505F70` | `sub_505F70` | `world::streaming::deallocate_streaming_chunk_block_505f70` | Boundary-Tag-Speicherblock-Freigabe und Verschmelzung (Coalesce) im Streaming-Heap |
| `0x00506040` | `sub_506040` | `world::streaming::allocate_streaming_chunk_block_506040` | First-Fit Boundary-Tag-Allokator mit 4-Byte-Alignment und Blocksplitting für Streaming-Heap |

### 12.14 Streaming-Events, Straßengraph-Bisektion, Partikelsysteme & CCD-Kollisionspipeline (`0x00506120` – `0x0050D2F0`)

In Phase 3B verifizierte und übersetzte Kernroutinen für dynamische Fahrzeug-Events, Partikelgenerierung und kontinuierliche Kollisionserkennung:

| Adresse | Symbol | Rust-Pfad | Relevanz & Funktionsweise |
|---|---|---|---|
| `0x00506120` | `sub_506120` | `world::streaming::unload_sector_mesh_node_506120` | Entlädt Sektorknoten, gibt Sub-Blöcke an Boundary-Tag-Heap zurück und dekrementiert Allokationszähler |
| `0x005062C0` | `sub_5062C0` | `world::streaming::enqueue_streaming_event_node_5062c0` | Allokiert und hängt Event-Knoten (`"set_event"`) in doppelt verkettete Streaming-Event-Liste (`0x01669024` / `0x01669028`) ein |
| `0x00506310` | `sub_506310` | `world::streaming::flush_and_free_all_streaming_events_506310` | Leert gesamte Event-Liste und gibt alle assoziierten Speicherblöcke an Streaming-Heap zurück |
| `0x00506440` | `sub_506440` | `world::streaming::update_streaming_audio_state_triggers_506440` | Überwacht 4 Streaming-Audiokanäle auf Bitwechsel und feuert Start-/Stopp-Sound-IDs (461481, 133801/199337, 527017, 2729/68265) |
| `0x00506500` | `sub_506500` | `world::streaming::update_tunnel_ambient_environment_506500` | Erkennt Tunneleinfahrt (<100m) und überblendet Nebeldichte/Farbe über 8 bzw. 24 Frames |
| `0x005068D0` | `sub_5068D0` | `world::streaming::find_path_point_at_distance_bisection_5068d0` | Bisektions-/Binärsuche entlang Straßenspline-Wegpunkten zur exakten 3D-Distanzpunkt-Interpolation (<0.001 Konvergenz) |
| `0x00506B40` | `sub_506B40` | `world::streaming::update_cable_car_streaming_actors_506b40` | Zustandsautomat (Warten, Beschleunigen, Gleiten, Bremsen) für San-Francisco-Kabelstrassenbahnen und Glocken-Audio (<800m) |
| `0x00507310` | `sub_507310` | `world::streaming::update_traffic_vehicle_path_following_507310` | Wegpunktverfolgung für KI-Verkehrsfahrzeuge mit 0.2-Glättung, Kreuzungs-Geschwindigkeitsstufen und Notbremsung |
| `0x00507720` | `sub_507720` | `world::streaming::update_cable_car_turnaround_and_speed_507720` | Endstations-Wendeautomatik für Kabelstrassenbahnen (Routen 288/289), Streckenwechsel und Terminal-Bremskurve |
| `0x00507AE0` | `sub_507AE0` | `world::streaming::update_and_dispatch_traffic_vehicle_507ae0` | Dynamikschritt für Verkehrsfahrzeuge mit Terrain-Vorausschau (40m & 90m), Neigungsanpassung und Render-Dispatch |
| `0x00508330` | `sub_508330` | `world::streaming::update_articulated_trailer_physics_508330` | Gelenkwagen-/Anhänger-Physik mit Abstandsbindung (100m), Knickwinkelbegrenzung auf 12288 BAM (67.5°) und 0.9998-Dämpfung |
| `0x00508990` | `sub_508990` | `world::streaming::integrate_cable_car_physics_step_508990` | Physik-Integrationsschritt für Kabelbahnchassis mit 0.85-Federungsdämpfung und 0.9-Rotationsdämpfung |
| `0x00508D20` | `sub_508D20` | `world::streaming::spawn_traffic_vehicle_event_node_508d20` | Allokiert 300-Byte-Verkehrsknoten in Event-Liste, setzt Wegpunkt-Belegungsbit und initialisiert Spawndaten |
| `0x00508F10` | `sub_508F10` | `world::streaming::spawn_trailer_event_node_508f10` | Erzeugt Anhängerknoten mit -100m Versatz hinter Zugfahrzeug und Zufallsvariante (12/13) via Sega-LCG |
| `0x00509150` | `sub_509150` | `world::streaming::update_lead_traffic_convoy_509150` | Steuert Konvoifahrzeuge, spawnt dynamisch bis zu 5 Folgeeinheiten (<3000m) und sperrt Kreuzungsbits (Routen 315/316) |
| `0x00509890` | `sub_509890` | `world::streaming::enqueue_special_vehicle_event_509890` | Hängt Sonderfahrzeug-Event (Typ 15 Straßenbahn oder Konvoi-Lead) in Event-Queue ein |
| `0x00509A00` | `sub_509A00` | `world::streaming::init_stage_ambient_traffic_and_audio_events_509a00` | Startet Ambient-Verkehrsschleifen: je 2 Einheiten auf Routen 315..316 (Typ 16) und 317..318 (Typ 19) |
| `0x00509AF0` | `sub_509AF0` | `world::streaming::init_cable_car_system_509af0` | Initialisiert Kabelbahnsystem auf Routen 288 & 289 mit je 2 Wagen an versetzten Startpositionen (-30 und -480) |
| `0x00509D50` | `sub_509D50` | `world::streaming::init_stage_surface_materials_and_water_sink_509d50` | Richtet Kollisionstimeouts (30, 30) und Wassereinsinktiefe (-30m Arcade, -9.8m Original, -1237m Meeresspiegel) ein |
| `0x0050A0A0` | `sub_50A0A0` | `world::streaming::tick_audio_emitter_and_environmental_flags_50a0a0` | Aktualisiert Audio-Emitter-Ticks und setzt Umwelt-Triggerbit 0x01000000 im aktiven Spielbetrieb |
| `0x0050A110` | `sub_50A110` | `world::streaming::update_aerial_actor_helicopter_50a110` | Flugdynamik für Hubschrauber: Rotorrotation (8225 BAM/Frame), Zielflug, Rotor-Sound (>2000m) und Despawn (>4000m) |
| `0x0050A870` | `sub_50A870` | `world::streaming::render_perspective_projected_quad_50a870` | Perspektivische Billboard-/Quad-Projektion mit Entfernungs-Skalierungsfaktor `(near_clip + z) / z` |
| `0x0050A9B0` | `sub_50A9B0` | `world::streaming::spawn_helicopter_actor_event_50a9b0` | Spawnt Hubschrauber-Eventknoten (92 Bytes), setzt Initialposition (8860, -200, -3487) und bindet Event-Queue |
| `0x0050AA80` | `sub_50AA80` | `world::streaming::update_underwater_bubble_particle_50aa80` | Unterwasser-Luftblasen-Partikel: Auftrieb (+0.05), Dämpfung 0.9, Zufallsjitter via Sega-PRNG und Verpuffen an Wasseroberfläche |
| `0x0050ACF0` | `sub_50ACF0` | `world::streaming::update_smoke_exhaust_particle_50acf0` | Auspuffrauch-Partikel: 0.95-Geschwindigkeitsdämpfung, thermisches Steigen und Radiuserweiterung (+0.08/Frame) |
| `0x0050AED0` | `sub_50AED0` | `world::streaming::update_tire_smoke_spark_particle_50aed0` | Reifenspuren-, Staub- und Funkenpartikel: Farb-Tönung (Gummi, Schotter, Weißfunken) und Radiusexpansion |
| `0x0050B140` | `sub_50B140` | `world::streaming::update_helicopter_target_tracking_50b140` | Hubschrauber-Positionsnachführung: Spieler + Vorwärtsvektor * 1000m + 200m Höhe (oder 2000m Reiseflughöhe) |
| `0x0050B260` | `sub_50B260` | `world::streaming::spawn_underwater_bubble_particle_50b260` | Erzeugt 60-Byte-Unterwasserblasen-Event mit Zufallsstartskalierung (0.2..0.4) |
| `0x0050B320` | `sub_50B320` | `world::streaming::spawn_smoke_spark_particle_50b320` | Erzeugt 60-Byte-Partikelevent für Radkontakt (Rauch, Funken oder Auspuff) mit Lebensdauer 20..30 Frames |
| `0x0050B550` | `sub_50B550` | `world::streaming::update_wheel_surface_particles_and_audio_50b550` | 4-Rad-Untergrundinteraktion: Partikelerzeugung für Schotter/Gras/Wasser (14), Sprungzeitmessung und Drift-Quietsch-Audio |
| `0x0050BB00` | `sub_50BB00` | `world::streaming::get_road_0_waypoint_count_50bb00` | Gibt die Wegpunkt-Gesamtanzahl des Hauptstraßengraphen (Index 0) zurück |
| `0x0050BB10` | `sub_50BB10` | `world::streaming::get_road_0_waypoint_buffer_50bb10` | Liefert den Wegpunkt-Array-Slice des Hauptstraßengraphen (Index 0) |
| `0x0050BB20` | `sub_50BB20` | `world::streaming::setup_stage_course_waypoint_graph_50bb20` | Relokiert Dreamcast-VRAM-Wegpunkte (0xC30B000-0xD30B000) in Host-RAM und schaltet aktiven Strecken-Graphen um |
| `0x0050BD30` | `sub_50BD30` | `world::streaming::nullsub_stub_true_50bd30` | Kollisionsfilter-Prüfungsstub (gibt 1 / true zurück) |
| `0x0050BD40` | `sub_50BD40` | `world::streaming::nullsub_stub_true_50bd40` | Kollisionsfilter-Prüfungsstub (gibt 1 / true zurück) |
| `0x0050BD50` | `sub_50BD50` | `world::streaming::point_in_convex_quad_2d_50bd50` | 2D-Punkt-in-konvexem-Viereck-Test mittels 4 Kanten-Kreuzprodukten |
| `0x0050BDC0` | `sub_50BDC0` | `world::streaming::classify_point_to_line_segment_2d_50bdc0` | Räumliche Lagebestimmung eines Punktes zu einem Liniensegment via 9-Zonen-Outcode und X-Achsenabschnitt |
| `0x0050BED0` | `CollisionIntersect` | `math::collision_intersect_test` | Konvexer Polygon-Halbebenen-Kollisionstest und Höhenberechnung |
| `0x0050C020` | `sub_50C020` | `world::streaming::find_track_sector_quad_96_50c020` | Bidirektionale Sektorsuche im 96-Viereck-Streckenring (Vor-/Rückwärtsiteration max. 48 Schritte) |
| `0x0050C100` | `sub_50C100` | `world::streaming::find_track_sector_quad_25_50c100` | Bidirektionale Sektorsuche im 25-Viereck-Streckenring (Vor-/Rückwärtsiteration max. 13 Schritte) |
| `0x0050C1E0` | `sub_50C1E0` | `world::streaming::point_in_polygon_2d_parity_50c1e0` | Allgemeiner 2D-Polygon-Punkt-im-Polygon-Test via Ray-Casting-Paritätszählung (Even-Odd-Regel) |
| `0x0050C340` | `sub_50C340` | `world::streaming::dda_raycast_sector_grid_50c340` | Amanatides & Woo 2D-DDA-Strahlverfolgung über räumliches Sektorraster (bis zu 10 durchquerte Zellen und t-Werte) |
| `0x0050C6D0` | `sub_50C6D0` | `world::streaming::raycast_down_collision_50c6d0` | Zentraler vertikaler Terrain-Raycaster: Zell-Hashing, Polygon-Schnittprüfung und Ermittlung der höchsten begehbaren Fläche |
| `0x0050CA00` | `sub_50CA00` | `world::streaming::intersect_ray_polygon_3d_50ca00` | Exakter 3D-Strahl-Polygon-Schnitt: Backface-Culling, Ebenendistanz, Hüllkugelprüfung und Kantenkreuzprodukte |
| `0x0050CBD0` | `sub_50CBD0` | `world::streaming::raycast_swept_sphere_against_sector_grid_50cbd0` | Swept-Sphere-Raycasting gegen Sektorgitter: Zell-DDA, Hüllkugel-Vorfilter und exakte Polygonschnittberechnung |
| `0x0050CDA0` | `sub_50CDA0` | `world::streaming::cast_motion_sphere_query_50cda0` | Bewegungskugel-Kollisionsabfrage: Führt Swept-Sphere-Test aus und liefert Aufprallpunkt und Flächennormale |
| `0x0050CE40` | `sub_50CE40` | `world::streaming::resolve_swept_sphere_slide_and_bounce_50ce40` | CCD-Kollisionsauflösung (Continuous Collision Detection): Vorrücken bis Aufprall, Geschwindigkeitsreflexion mit Elastizitätstabelle und Gleiten |
| `0x0050D050` | `sub_50D050` | `world::streaming::init_stage_collision_grid_and_relocate_50d050` | Richtet Kollisionsraster-Grenzen für Arcade (4096 Zellen) bzw. Original/Crazy Box (1024 Zellen) ein |
| `0x0050D2F0` | `sub_50D2F0` | `world::streaming::test_vehicle_barrier_slice_collision_50d2f0` | Testet Fahrzeugkollision gegen Straßen-Bordsteinkanten/Barrieren und liefert Kontaktnormale sowie Eindringtiefe |
| `0x0050D380` | `sub_50D380` | `world::streaming::apply_barrier_collision_impulse_50d380` | Berechnet 2D-Barriere-/Bordsteinkollisions-Impuls, Reibungsdrehmoment und tangentiale Geschwindigkeitsableitung |
| `0x0050D650` | `sub_50D650` | `world::streaming::intersect_circle_line_segment_2d_50d650` | 2D-Kreis/Begrenzungszylinder vs. Liniensegment-Kollisionstest mit Schnittnormalen und Ecken-/Kantenunterscheidung |
| `0x0050D8E0` | `sub_50D8E0` | `world::streaming::intersect_cylinder_vertical_post_2_5d_50d8e0` | 2.5D-Zylinder vs. vertikaler Pfosten-/Poller-Hinderniskollisionstest mit Höhenbereichsprüfung [min_y, max_y] |
| `0x0050D990` | `sub_50D990` | `world::streaming::intersect_cylinder_curb_segment_2_5d_50d990` | 2.5D-Zylinder vs. lineare Bordsteinwand-Schnittprüfung mit Ecken- und Kantenerkennung |
| `0x0050DAE0` | `sub_50DAE0` | `world::streaming::resolve_spatial_grid_barrier_collision_50dae0` | Räumliches Gitter-Kollisionsauflösungsverfahren für Barrierewände und Poller mit Verdrängungs-Pushout |
| `0x0050DD40` | `sub_50DD40` | `world::streaming::update_vehicle_barrier_and_post_collision_50dd40` | Hauptprüfungsroutine für Fahrzeugchassisecken gegen Barrieren, Auslenkung, Crash-Trigger und Schadenszähler |
| `0x0050E6F0` | `sub_50E6F0` | `world::streaming::init_stage_spatial_grid_and_chassis_offsets_50e6f0` | Initialisiert räumliches Kollisionsgitter und Fahrwerksabstände je nach Spielmodus/Strecke |
| `0x0050ED60` | `sub_50ED60` | `world::streaming::recycle_streaming_actor_node_50ed60` | Entkoppelt aktiven Streaming-Akteursknoten und führt ihn in den 256er-Freipool (Kategorie 21) zurück |
| `0x0050EE00` | `sub_50EE00` | `world::streaming::detach_and_purge_streaming_actor_50ee00` | Trennt und verwirft Streaming-Akteursslot aus der Kategorieverwaltung (-1 ungültig) |
| `0x0050EEA0` | `sub_50EEA0` | `world::streaming::allocate_streaming_actor_slot_50eea0` | Allokiert freien Akteursslot aus dem 256er-Pool und bindet ihn an Zielkategorie |
| `0x0050EF20` | `sub_50EF20` | `world::streaming::solve_actor_pair_collision_impulse_50ef20` | Berechnet 3D-Kollisionsimpuls, Auslenkung und elastischen Geschwindigkeitsaustausch zweier Körper |
| `0x0050F1B0` | `sub_50F1B0` | `world::streaming::check_forward_vision_cone_alert_50f1b0` | Prüft 20°-Vorwärts-Sichtkegel (dot > 0.939) für Ausweich- und Hupen-Trigger benachbarter Einheiten |
| `0x0050F230` | `sub_50F230` | `world::streaming::intersect_obb_obb_3d_50f230` | 3D OBB vs OBB Trennungsachsen-Schnittprüfung (SAT) mit Schwerpunkt- und Durchdringungstiefenberechnung |
| `0x0050F690` | `sub_50F690` | `world::streaming::dispatch_all_streaming_entity_collisions_50f690` | Hauptkollisionsschleife aller 22 Akteurskategorien inklusive Broadphase, Inter-Category und Barrieren-Dispatch |
| `0x0050FD70` | `sub_50FD70` | `world::streaming::compute_actor_category_obb_and_bounding_sphere_50fd70` | Berechnet 8 OBB-Lokaleckpunkte, Hüllkugelradius und Trägheitsverhältnis für Akteurskategorien |
| `0x0050FFD0` | `sub_50FFD0` | `world::streaming::solve_actor_bounding_pushout_and_alerts_50ffd0` | Verdrängungs- und Abstoßungsberechnung für Fußgänger und Requisiten nahe Fahrzeugen |
| `0x00510D60` | `sub_510D60` | `world::streaming::reset_and_init_actor_collision_subsystem_510d60` | Bootstrappt Kollisionssubsystem, setzt 21x21-Dispatchtabelle auf und initialisiert 256er-Slots |
| `0x00510F60` | `nullsub_91` | `world::streaming::nullsub_91_510f60` | Verifizierter IDA No-Op Stub (ret 0) |
| `0x00510F70` | `nullsub_92` | `world::streaming::nullsub_92_510f70` | Verifizierter IDA No-Op Stub (ret 0) |
| `0x00510F80` | `sub_510F80` | `world::streaming::bind_all_taxi_chassis_textures_510f80` | Bindet 4 Taxifahrer-Chassis-Modelle an Texturwörterbuch tbl_texDC0 |
| `0x00510FD0` | `sub_510FD0` | `world::streaming::dispatch_session_state_step_510fd0` | Dispatches session state handler indexed by session_state % 16 |
| `0x00511000` | `sub_511000` | `world::streaming::dispatch_all_streaming_events_511000` | Dispatches active streaming event nodes (+0x0C callback, +0x08 next) |
| `0x00511070` | `sub_511070` | `world::streaming::session_warmup_countdown_step_511070` | 120-frame warmup countdown timer before transitioning to active gameplay |
| `0x005110A0` | `sub_5110A0` | `world::streaming::execute_gameplay_subsystems_and_streaming_tick_5110a0` | Subsystem update pipeline: steps subsystems, increments counters, drains event queue |
| `0x00511110` | `sub_511110` | `world::streaming::attract_demo_frame_step_511110` | Attract / Demo mode frame step: camera look-at vectors, demo cancellation check |
| `0x005111C0` | `sub_5111C0` | `world::streaming::reset_session_and_advance_state_5111c0` | Resets session subsystems: collision, HUD, streaming, flushes event nodes |
| `0x00511200` | `sub_511200` | `world::streaming::transition_and_clear_render_target_511200` | Advances session state, flushes events, clears render target wrapper |
| `0x00511250` | `sub_511250` | `world::streaming::full_world_streaming_reset_on_transition_511250` | World and sector streaming reset: clears actors, resets sector cache & chunk tables |
| `0x005112F0` | `sub_5112F0` | `world::streaming::session_advance_and_init_hud_overlays_5112f0` | 8-quad 2D HUD screen-space quad descriptor layout init or results screen dispatch |
| `0x00511360` | `sub_511360` | `world::streaming::orchestrate_vehicle_and_traffic_frame_pipeline_511360` | Master vehicle, traffic, physics, and world collision orchestration frame pipeline |
| `0x005118D0` | `sub_5118D0` | `world::streaming::initialize_gameplay_session_5118d0` | Master gameplay session initialization: lighting, delta times, terrain raycast |
| `0x00511C20` | `sub_511C20` | `world::streaming::initialize_attract_demo_session_511c20` | Attract Demo and Replay mode session initialization: replay flags, raycast, path |
| `0x00511F60` | `sub_511F60` | `world::streaming::master_frame_physics_callback_511f60` | In-game per-frame physics callback: water submersion, stunts, tire slip, suspension |
| `0x00512160` | `sub_512160` | `world::streaming::session_frame_tick_stage3_streaming_512160` | Increments session counter, queries stage 3 chunk streaming, checks viewport |
| `0x005121A0` | `sub_5121A0` | `world::streaming::start_attract_demo_drive_session_5121a0` | Starts attract demonstration drive: wheel damping 0.001, 90-sec timer, Axel setup |
| `0x00512370` | `sub_512370` | `world::streaming::initialize_crazybox_challenge_session_512370` | Crazy Box challenge session init: black clear color, terrain raycast, sound buffer pool |
| `0x00512790` | `sub_512790` | `world::streaming::compute_vehicle_inverse_inertia_tensor_512790` | Computes vehicle chassis diagonal inverse moment of inertia tensor (I_xx, I_yy, I_zz) |
| `0x00512860` | `sub_512860` | `world::streaming::compute_drivetrain_torque_distribution_512860` | 4-wheel drive torque / brake bias distribution ratios (FWD, AWD, Balanced AWD, RWD) |
| `0x00512960` | `sub_512960` | `world::streaming::evaluate_tire_friction_slip_curve_512960` | Piecewise tire friction coefficient from slip ratio/angle (Pacejka curve, peak 1.06) |
| `0x00512A20` | `sub_512A20` | `world::streaming::compute_high_speed_steering_damping_512a20` | High-speed steering damping / stability attenuation factor from forward speed |

### 12.11 Kollisions-, Physik- & Streaming-Akteurs-Tabellen (0x0050D380 - 0x00510F80)
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x013E8FD4` | `float[7 * 22]` | `flt_13E8FD4` | Oberflächen-Restitutions- & Reibungstabelle pro Kategorie (28 Bytes / 7 Floats pro Eintrag). |
| `0x013E8FCC` | `float[7 * 22]` | `flt_13E8FCC` | Konservative Hüllkugelradien pro Akteurskategorie (Index $7 \times \text{kat}$). |
| `0x013E8FD0` | `float[7 * 22]` | `unk_13E8FD0` | Massentabelle pro Akteurskategorie für Impuls- und Impulserhaltung. |
| `0x013E8FD8` | `float[7 * 22]` | `unk_13E8FD8` | Trägheitsmomenttabelle pro Akteurskategorie (`moment_of_inertia / mass`). |
| `0x013E8FE0` | `uint32_t[7 * 22]` | `dword_13E8FE0` | Interaktions-Bitmaskenmatrix zwischen den 22 Akteurskategorien. |
| `0x01663AD8` | `uint32_t[22]` | `dword_1663AD8` | Listenköpfe (Head Pointers) für doppelt verkettete Akteurslisten (Kategorien 0..21). |
| `0x01663A78` | `uint32_t[22]` | `dword_1663A78` | Listenenden (Tail Pointers) für doppelt verkettete Akteurslisten (Kategorien 0..21). |
| `0x01663338` | `uint32_t[22]` | `dword_1663338` | Aktive Einheitenanzahl pro Akteurskategorie (Kategorien 0..21). |
| `0x01663330` | `uint32_t` | `dword_1663330` | Gesamtzahl aktiver Streaming-Akteure im Spiel. |
| `0x01662330` | `StreamingSlot[256]` | `unk_1662330` | Statische 256-Slot Streaming-Akteurstabelle (16 Bytes pro Slot, `slot[1] == -1` für freie Slots). |
| `0x01663390` | `void*[21 * 21]` | `dword_1663390` | 21x21 Funktionszeigermatrix für kategorienübergreifende Paar-Kollisionsauflösung. |

### 12.12 Fahrzeugphysik-, Drivetrain- & Session-Orchestrator-Offsets (0x00510FD0 - 0x00512A20)
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x01662058` | `float` | `g_VehicleMass` | Masse des Fahrzeugchassis $m$ für Trägheitsberechnung. |
| `0x0166206C` | `float` | `g_VehicleDimX` | Bounding-Box Dimension X ($w$) des Fahrzeugchassis. |
| `0x01662070` | `float` | `g_VehicleDimY` | Bounding-Box Dimension Y ($h$) des Fahrzeugchassis. |
| `0x01662074` | `float` | `g_VehicleDimZ` | Bounding-Box Dimension Z ($d$) des Fahrzeugchassis. |
| `0x01662078` | `float` | `g_VehicleInvInertiaX` | Inverses Trägheitsmoment $I^{-1}_{xx} = 1.0 / (\frac{1}{12} m (h^2 + d^2))$. |
| `0x0166207C` | `float` | `g_VehicleInvInertiaY` | Inverses Trägheitsmoment $I^{-1}_{yy} = 1.0 / (\frac{1}{12} m (w^2 + h^2))$. |
| `0x01662080` | `float` | `g_VehicleInvInertiaZ` | Inverses Trägheitsmoment $I^{-1}_{zz} = 1.0 / (\frac{1}{12} m (w^2 + d^2))$. |
| `0x01661F8C` | `int32_t` | `g_DrivetrainMode` | Antriebsmodus (1 = FWD 50/50, 2 = Hecklastiger Allrad, 3 = Balancierter Allrad, sonst = RWD). |
| `0x016620F4` | `float` | `g_WheelBiasFL` | Antriebs-/Bremskraft-Verteilungsquote Rad 0 (Vorne Links, Offset `+0x00F4`). |
| `0x01662178` | `float` | `g_WheelBiasFR` | Antriebs-/Bremskraft-Verteilungsquote Rad 1 (Vorne Rechts, Offset `+0x0178`). |
| `0x016621FC` | `float` | `g_WheelBiasRL` | Antriebs-/Bremskraft-Verteilungsquote Rad 2 (Hinten Links, Offset `+0x01FC`). |
| `0x01662280` | `float` | `g_WheelBiasRR` | Antriebs-/Bremskraft-Verteilungsquote Rad 3 (Hinten Rechts, Offset `+0x0280`). |
| `0x016A2D00` | `uint32_t` | `g_SessionFrameCount` | Frame-Zähler der aktiven Session bzw. des Warmup-Countdowns (120 Frames Transition). |
| `0x016EFF68` | `uint32_t` | `g_StreamingFrameCount` | Frame-Zähler für Streaming-Pipeline- und Akteurs-Updates. |
| `0x016F0488` | `HudOverlayQuad[8]` | `g_HudOverlayTable` | Tabelle von 8 2D-HUD Screen-Space Quad-Deskriptoren (320x240, Skalierung 2.0). |

### 12.13 Phase 3C Neu Verdrahtete Globale Variablen & Routinen
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x016A4190` | `int32_t` | `g_SessionRacePhase` | Phase der Spielsitzung (0: Pre-Race Countdown, 1: Gameplay Frame Tick, 2: Time-Over Resultat). |
| `0x016A4194` | `int32_t` | `g_PreRaceCountdownFrames` | Countdown-Ticker vor Start (Frame 60 = Controls Unlock, Frame 0 = Go / BGM Playback). |
| `0x016A4198` | `int32_t` | `g_RaceStateFlag` | Status-Flag für Rennphasen und Passagierabwurf-Bedingungen. |
| `0x013C396C` | `int32_t` | `g_StreamingContext` | Globaler Streaming- und Prop-Rendering-Kontext. |
| `0x01B7A854` | `int32_t` | `g_StreamingStatusFlag` | Status-Flag für Streaming-Bereitschaft und Chunks. |
| `0x0166208C` | `float` | `g_PlayerVehicleSpeed` | Live-Fahrzeuggeschwindigkeit für Halte- und Drop-Off-Überprüfungen. |
| `0x016620C8` | `int16_t` | `g_PlayerSteeringAngle` | Live-Lenkwinkel des Fahrzeugs für Passagierabwurf-Bedingungen. |
| `0x0048B230` | `__usercall` | `Math_Vec3Distance` | Euklidische Distanzberechnung zwischen zwei 3D-Vektoren (`sqrt(dx^2+dy^2+dz^2)`). |
| `0x004EBF00` | `__cdecl` | `Session_State1_DispatchHierarchy` | Zustand-1 Hierarchie-Dispatcher für Menü- und Spielsitzungs-Objektbäume. |
| `0x004FF880` | `__cdecl` | `SessionGameplayFrameTick` | Per-Frame Gameplay-Tick (Passagier-Timer, Rundenuhr, Time-Up-Trigger). |
| `0x004FF9C0` | `__cdecl` | `HandleTimeOverResultTransition` | Time-Over Freeze-Handler und Transition zur Ergebnis-Rangliste. |
| `0x004FFA40` | `__cdecl` | `PreRaceCountdownTick` | Countdown-Tick vor Rennbeginn (Steuerungsfreigabe). |
| `0x004FF680` | `__cdecl` | `InitGameSessionTimerAndFares` | Initialisierung der Runden- und Kundenabrechnungstimer. |

### 12.14 Phase 3C Batch 3: Platform I/O, Steamworks & CRI ADXT Audio Engine
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x01EAE9C0` | `STEAM::SteamManager*` | `g_SteamManager` | Singleton-Instanz des SteamManagers (AppID `71230`, VTable `0x0059F918`). |
| `0x01EAE9E0` | `STEAM::StatsAchievementsManager*` | `g_SteamStatsAchievementsManager` | Singleton-Instanz für Errungenschaften und Spieler-Statistiken (24 Achievements). |
| `0x01EAE9E4` | `CCallback<UserStatsReceived_t>` | `g_SteamCallback_StatsReceived` | Callback-Registrierung für empfangene Steamworks-Statistiken (Callback ID `1101`). |
| `0x01EAE9F8` | `CCallback<UserStatsStored_t>` | `g_SteamCallback_StatsStored` | Callback-Registrierung für gespeicherte Steamworks-Statistiken (Callback ID `1102`). |
| `0x01EAEA0C` | `CCallback<UserAchievementStored_t>` | `g_SteamCallback_AchievementStored` | Callback-Registrierung für gespeicherte Steamworks-Errungenschaften (Callback ID `1103`). |
| `0x0146A980` | `volatile LONG` | `g_CriInterlockedRefCounter` | Globaler Referenzzähler für CRI Middleware Thread-Synchronisation. |
| `0x0146A988` | `const char*` | `g_CriAdxtVersion` | ADXT Versionskennung (`\nADXT/PCx86 Ver.10.89 Build:Jul 27 2009 11:47:17\n`). |
| `0x0146A98C` | `int32_t` | `g_CriAdxtInitCounter` | Initialisierungs-Referenzzähler der CRI ADXT Audio-Bibliothek. |
| `0x0146A9A4` | `volatile LONG` | `g_CriFsInitTarget` | Atomic-Exchange Flag zur Vermeidung doppelter Dateisystem-Initialisierung. |
| `0x0146A9BC` | `int32_t` | `g_CriWorkerYieldFlag` | Yield- und Wakeup-Statusflag des CRI Audio Worker Threads. |
| `0x0146AA00` | `HANDLE` | `g_CriWorkerThread` | Win32 Thread-Handle des primären CRI Audio Worker Threads. |
| `0x0146A9F8` | `HANDLE` | `g_CriFsWorkerThread` | Win32 Thread-Handle des CRI Dateisystem-Hintergrundthreads. |
| `0x0146A9F0` | `HANDLE` | `g_CriTimerWorkerThread` | Win32 Thread-Handle des CRI Timer-Servers (`adxt_exec_tsvr`). |
| `0x01ED2AE0` | `uint8_t[1024*196]` | `g_CriAdxtVoicePool` | ADXT Voice-Handle Pool (1024 Voice Slots à 196 Bytes, `0x1ED2AE0` bis `0x1ED4360`). |
| `0x01ED2AC0` | `float` | `flt_1ED2AC0` | Playback Timing Drift in Millisekunden (Kompensationsgrenze: ±60.0 ms). |
| `0x01ED2AC4` | `uint32_t` | `g_AdxtAudioSampleRate` | Standard-Audio-Abtastrate (z. B. 44.100 Hz / 22.050 Hz). |
| `0x004169F0` - `0x00418600` | Code-Block | `TiXml_*` Engine | Vollständiger TinyXML-Parser für `CrazyTaxi.ini` und XML-Systemkonfigurationen. |
| `0x00419AB0` | `__cdecl` | `ADXT_Init` | Initialisierung der CRI ADXT PC Audio-Bibliothek und Server-Registrierung. |
| `0x00419BB0` | `__cdecl` | `ADXT_Finish` | Sauberes Beenden aller ADXT Audio-Voices, Streams und Hintergrund-Threads. |

### 12.15 Phase 3C Batch 4: CRI ADXT Bitstream Decoder & DirectSound 3D Audio Hardware Subsystem
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x0041BC90` | `__cdecl` | `ADXT_ReadHdrTrackInfo` | Liest Track- und Subkanal-Deskriptor aus ADX-Header (+14). |
| `0x0041BCB0` | `__cdecl` | `ADXT_ReadChannelParams` | Entpackt 20-Byte Kanalparameter (Sampling-Rate, Bit-Tiefe, Kanäle). |
| `0x0041BD60` | `__cdecl` | `ADXT_ReadLoopInfo` | Liest Schleifenmarker (`LoopStart`, `LoopEnd`) und IIR-Koeffizienten. |
| `0x0041BDE0` | `__cdecl` | `ADXT_UnpackHdr` | Validiert Signatur `0x8000` und entpackt kompletten ADX/AHX-Header. |
| `0x0041BF10` | `__cdecl` | `ADXT_GetHdrInfo` | Öffentliche API: Liest Dateiheader in `ADXTHDR`-Struktur ein. |
| `0x0041C180` | `__usercall` | `ADXT_ValidateHandle` | Validiert ADXT-Handle Zeiger und Integritäts-Flags. |
| `0x0041C1E0` | `__usercall` | `CRI_FS_EntryFile` | Registriert Dateieintrag in der CRI-Dateisystemtabelle (`"SoundData/"`). |
| `0x0041C270` | `__usercall` | `ADXT_StartFnameRangeLp` | Spielt Streamdatei mit Startoffset, Bytebereich und Loop-Flag ab. |
| `0x0041C350` | `__cdecl` | `ADXT_CreateFileStream` | Erzeugt Win32-Dateihandle (`CreateFileA`) und allokiert Ringpuffer. |
| `0x0041CBA0` | `int32_t` | `ADXT_AllocChannelHandle` | Allokiert freien Voice-Slot aus dem Ringpuffer-Pool (`0x1ED2AE0`). |
| `0x0041D4F0` | `__usercall` | `ADXT_AllocPlaybackRingBuffer`| Allokiert zirkulären Ringpuffer für 16-Bit PCM-Streaming. |
| `0x0041D5D0` | `__cdecl` | `ADXT_ReportError` | Formatiert und protokolliert CRI ADXT Fehlerberichte (`"Error"`). |
| `0x0041D6B0` | `__cdecl` | `ADXT_DecodeAdxFrameMono` | Dekodiert 18-Byte ADX-Paket in 32 16-Bit Mono-PCM Samples. |
| `0x0041D740` | `__cdecl` | `ADXT_DecodeAdxFrameStereo` | Dekodiert verschachtelte ADX-Pakete in Stereo-PCM Samples. |
| `0x0041E2E0` | `__usercall` | `DSound_Transform3DPosition` | Transformiert 3D-Soundkoordinaten über Kamera-Listener-Matrix. |
| `0x0041E5C0` | `__usercall` | `DSound_InitSecondaryBuffer3D` | Initialisiert `IDirectSound3DBuffer`-Schnittstelle. |
| `0x0041EA60` | `__usercall` | `DSound_InitListener3D` | Initialisiert `IDirectSound3DListener`-Schnittstelle. |
| `0x0041EC80` | `__usercall` | `DSound_CreateSecondarySoundBuffer` | Ruft `IDirectSound::CreateSoundBuffer` für Sekundärpuffer auf. |
| `0x0041EE30` | `__cdecl` | `DSound_PlaySoundBuffer` | Ruft `IDirectSoundBuffer::Play` mit Looping-Flags auf. |
| `0x0041F4E0` | `__cdecl` | `DSound_SetBufferVolume` | Ruft `IDirectSoundBuffer::SetVolume` in Millibel auf (-10000..0 mB). |
| `0x0041F730` | `__cdecl` | `DSound_SetBufferPan` | Ruft `IDirectSoundBuffer::SetPan` auf (-10000 links bis +10000 rechts). |
| `0x0041F830` | `__cdecl` | `DSound_LockBuffer` | Sperrt Ringpuffersegment für direktes PCM-Schreiben. |
| `0x0041F870` | `__cdecl` | `DSound_UnlockBuffer` | Entsperrt Ringpuffersegment und übergibt Audiodaten an Treiber. |
| `0x0041FD10` | `__cdecl` | `DSound_ResetMixerSubsystem` | Setzt DirectSound Mixer-Subsystem zurück und stummschaltet alle Kanäle. |

### 12.16 Phase 3C Batch 5: CRI ADXF / ADXT / XECI Middleware & Forward-Stubs Verdrahtung
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x00494C30` | `__cdecl` | `Vehicle_AllowPassengerSpawn` | Prüft, ob Taxi bereit für neue Passagierspawns ist (liefert 1/true). Aktiv verdrahtet in Spawner-Loop. |
| `0x004E44C0` | `__cdecl` | `Cam_InitChaseRigAndClipping` | Initialisiert 128-Element Damping-LUT (`1.0 - i/127.0`) und Far-Z Clipping (`850.000,0`). Aktiv verdrahtet. |
| `0x004AE840` | `__cdecl` | `Snd_SystemControlReset` | Setzt Audio-Partitions-Pointer und Treiber-Hardware zurück. Aktiv verdrahtet in Reset-Routine. |
| `0x00421DA0` | `__cdecl` | `ADX_GetSectorSize` | Liefert Standard-CD-ROM/ADX-Sektorgröße (2.048 Bytes). |
| `0x00421DC0` | `__cdecl` | `ADX_Stream_IsChannelReady` | Validiert Pufferfüllstand auf ADX-Kanal (+74, +73). |
| `0x00421DF0` | `__cdecl` | `ADX_Stream_HasPendingData` | Prüft ausstehende Lesevorgänge auf ADX-Kanal (+73, +77). |
| `0x00421E10` | `__usercall` | `ADX_Stream_GetActiveFlag` | Fragt aktiven Streamstatus an Byte-Offset +1 ab. |
| `0x00421E20` | `__usercall` | `ADX_Loader_SetVolumeAttenuation` | Schreibt Lautstärkedämpfung in Millibel auf Offset +92. |
| `0x00421E40` | `__usercall` | `ADX_Loader_GetVolumeAttenuation` | Liest Lautstärkedämpfung in Millibel von Offset +92. |
| `0x00421E50` | `__usercall` | `ADX_Loader_SetLoopCount` | Schreibt Wiederholungsschleifen-Zähler auf Offset +56. |
| `0x00421E80` | `__usercall` | `ADX_Loader_SetLoopEndSample` | Konfiguriert Schleifen-Ende Samplegrenze auf Offset +60. |
| `0x00421E90` | `__usercall` | `ADX_Loader_SetLoopStartSample` | Konfiguriert Schleifen-Start Sampleframe auf Offset +52. |
| `0x00421EB0` | `__cdecl` | `ADX_GetMagicSignature` | Liefert CRI ADX Datei-Signatur `0x8001`. |
| `0x00421EC0` | `__cdecl` | `ADX_GetDefaultChannelCount` | Liefert Standard-Stereo-Kanalanzahl (2 Kanäle). |
| `0x00421ED0` | `__usercall` | `ADX_Loader_SetSampleRate` | Schreibt Sampling-Rate (44.100 Hz / 22.050 Hz) auf Offset +32. |
| `0x00421EE0` | `__usercall` | `ADX_Loader_GetHighpassCutoff` | Liest Hochpassfilter-Grenzfrequenz in Hz von Offset +24. |
| `0x00421EF0` | `__cdecl` | `ADX_GetDefaultSampleBitDepth` | Liefert 16-Bit Linear-PCM Sampletiefe. |
| `0x00421F10` | `__cdecl` | `ADX_GetDefaultSampleRate` | Liefert Standard-Abtastrate (44.100 Hz). |
| `0x00421FD0` | `__cdecl` | `ADX_ValidateLoopBounds` | Validiert Schleifenstart- und Schleifenend-Sampleindizes. |
| `0x00422030` | `__cdecl` | `ADX_CalculateLoopSampleLength` | Berechnet Gesamtsampleanzahl innerhalb des Schleifenbereichs. |
| `0x00424820` | `__cdecl` | `ADXT_Voice_MoveStreamFile` | Verschiebt / benennt temporäre Streamdatei via `MoveFileA` um. |
| `0x00424890` | `__cdecl` | `ADXT_Voice_FindFirstStreamFile`| Sucht erste passende Streamdatei via Win32 `FindFirstFileA`. |
| `0x00424950` | `__cdecl` | `CRI_EnterCriticalSection` | Betritt CriCrs Reentrant Mutex für Audio-Worker Threading. |
| `0x00424970` | `__cdecl` | `CRI_LeaveCriticalSection` | Verlässt CriCrs Reentrant Mutex nach Puffer-Operation. |
| `0x00426CB0` | `__cdecl` | `XECI_FS_ParseHexNumeric` | Wandelt Pfad- und Sektorstrings via `strtoul` um. |
| `0x004279F0` | `__cdecl` | `XECI_FS_OpenLscFile` | Öffnet LSC-Archivcontainer für virtuelle Disc-Sektoren. |
| `0x00428380` - `0x00429EB0` | Bitstream-Pipeline | `ADX_Dec_*` Pipeline | 49 dekompilierte Routinen für ADX/AHX ADPCM Prädiktionsfilter & Frame-Unpacking. |

### 12.17 Phase 3C Batch 6: CRI ADX / MPEG Decoders & Sofdec Video Pipeline (`0x00429ED0` - `0x00433E50`)
| Adresse | Typ | Name im Code | Zweck / Spezifikation |
|---|---|---|---|
| `0x00429ED0` | `__cdecl` | `ADX_Dec_SetCbOffset220` | CRI Control Block Feld-Setter bei Offset +220. |
| `0x00429F10` | `__cdecl` | `ADX_Dec_IirFilterSampleBuffer` | Berechnet 2-Pol IIR-Filterkoeffizienten für ADX-Dequantisierung. |
| `0x00429FB0` | `__cdecl` | `ADX_Dec_SetVolumePanning` | Voice-Kanal Lautstärkenskalierung & Panning (0..127 linear -> -96dB..0dB). |
| `0x0042A040` | `__cdecl` | `ADX_Dec_ComputeIirCoefficients`| 2-Pol IIR Prädiktionsfilter-Koeffizientengenerator aus Sampling-Rate und Grenzfrequenz. |
| `0x0042A060` | `__cdecl` | `ADX_Dec_GetCbOffset60` | CRI Control Block Feld-Getter bei Offset +60. |
| `0x0042A070` | `__cdecl` | `ADX_Dec_GetCbOffset152` | CRI Control Block Feld-Getter bei Offset +152. |
| `0x0042A080` | `__cdecl` | `ADX_Dec_GetCbOffset20` | CRI Control Block Feld-Getter bei Offset +20. |
| `0x0042A090` | `__cdecl` | `ADX_Dec_GetCbOffset14` | CRI Control Block Feld-Getter bei Offset +14. |
| `0x0042A0B0` | `__cdecl` | `ADX_Dec_GetCbOffset13` | CRI Control Block Feld-Getter bei Offset +13. |
| `0x0042A120` | `__cdecl` | `ADX_Dec_VerifyStreamBitfield` | Verifiziert Streamhandle-Integrität und Bitfeld-Statusübergang. |
| `0x0042A180` | `__cdecl` | `ADXStreamGetChunkSize` | Liefert Stream-Chunkgröße (+220) für ADX-Wiedergabe. |
| `0x0042A1A0` | `__cdecl` | `ADXStreamGetSampleRateWord` | Tabellenabfrage für Kanal-Abtastraten-Indizes. |
| `0x0042A250` | `__cdecl` | `ADXUnpackVoiceTrackHeader` | Entpackt Voice-Track Header aus Format-Tag und Argumenten. |
| `0x0042A370` | `__cdecl` | `ADXGetStreamStatus` | Fragt Streamstatus an Byte-Offset +4 ab. |
| `0x0042A380` | `__cdecl` | `ADXCalcBufferSize` | Berechnet Audio-Kanalpuffergröße und Formateinstellungen. |
| `0x0042A410` | `__cdecl` | `ADXStopStreamChannel` | Stoppt Stream-Kanal und setzt Statusflag auf 0 zurück. |
| `0x0042A430` | `__cdecl` | `ADXResetStreamState` | Führt Streamhandle-Verifikation und Audio-Statusreset durch. |
| `0x0042A480` | `__cdecl` | `ADXFeedMonoDeviceBuffer` | Füttert Mono-PCM Samples in DirectSound Gerätetreiberpuffer. |
| `0x0042A4B0` | `__cdecl` | `ADXFeedStereoDeviceBuffer` | Füttert Stereo-PCM Samples in DirectSound Gerätetreiberpuffer. |
| `0x0042A5C0` | `__cdecl` | `ADXMemcpy16` | 16-Bit speicheroptimierte PCM Sample-Kopierroutine. |
| `0x0042A5F0` | `__cdecl` | `ADXInterleaveStereo16` | Verschachtelt separate linke und rechte 16-Bit PCM Kanäle zu Stereo. |
| `0x0042B000` | `__cdecl` | `ADXDetectMpegLayer12` | Prüft Bitstream auf MPEG-1/2 Audio Layer 1/2 Header-Synchronisation. |
| `0x0042C000` | `__cdecl` | `AIFFAdpcm4FeedStep` | Füttert 4-Bit ADPCM dekomprimierte AIFF Audioblöcke. |
| `0x0042D000` | `__cdecl` | `RIFFWaveDetectSubchunks` | Identifiziert RIFF WAVE fmt- und data-Untersegmente. |
| `0x0042E000` | `__cdecl` | `DSoundDispatchBufferStream`| Verwaltet DirectSound Pufferstreaming und Cursor-Positionen. |
| `0x0042F000` | `__cdecl` | `SegaSynthTeardownVoiceStream` | Schließt Sega Synthesizer Voice-Kanal und gibt DSP-Stimmen frei. |
| `0x00430000` | `__cdecl` | `SegaSynthInitTrackSystem` | Initialisiert Sega Synthesizer Track- und Effekt-Matrix. |
| `0x00430570` | `__cdecl` | `SofdecPESGetPacketLength` | Liest PES Paketlänge aus MPEG-Programmstrom. |
| `0x00430590` | `__cdecl` | `SofdecPESReadPacketPayload`| Liest Nutzdaten-Slice aus Sofdec PES Paket unter Berücksichtigung des Headers. |
| `0x00430F40` | `__cdecl` | `SofdecSMPTECompareTimecodes`| Vergleicht zwei SMPTE Zeitcodes (Stunden, Minuten, Sekunden, Frames). |
| `0x00431010` | `__cdecl` | `SofdecSMPTEValidateTimecode`| Validiert SMPTE Zeitcode-Bereiche gegen Videobildrate. |
| `0x00431160` | `__cdecl` | `SofdecVideoParseSequenceHeader`| Dekodiert MPEG-2 Sequence Header (Breite, Höhe, Seitenverhältnis, Bildrate). |
| `0x00432050` | `__cdecl` | `SofdecVideoCalcMotionVectorPredictors`| Berechnet Bewegungsmengen-Prädiktoren für B- und P-Frames. |
| `0x004321F0` | `__cdecl` | `SofdecVideoApplyMotionCompensation`| Wendet Bewegungskompensation auf 16x16 und 8x8 Pixelblöcke an. |
| `0x00432530` | `__cdecl` | `SofdecVideoIdctRowStep` | Führt 8-Punkt IDCT Zeilentransformation durch. |
| `0x00432560` | `__cdecl` | `SofdecVideoIdctColStep` | Führt 8-Punkt IDCT Spaltentransformation durch. |
| `0x00432660` | `__cdecl` | `SofdecVideoReconstructBlock`| Rekonstruiert 8x8 Bildblock aus IDCT-Residuen [0..255]. |
| `0x00433E50` | `__cdecl` | `SofdecVideoLockSurface` | Sperrt D3D-Texturoberfläche für Sofdec Frame-Upload. |
