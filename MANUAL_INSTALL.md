# Crazy Taxi Mod Framework - Manuelle Installationsanleitung / Manual Installation Guide

<a name="english"></a>

## English: Manual Installation (Drag \& Drop)

This Mod Framework does **not require any installer executable (.exe)**. You can easily install it yourself by dragging and dropping the files into your game directory.

### 1\. Package Contents

Inside the release zip/folder you will find:

* `dinput8.dll` (The DirectInput8 proxy mod loader)
* `mods/` (Directory containing the mod)

  * `mods/Framework\\\_MOD/Framework\\\_MOD.dll` (Main Framework DLL including Dreamcast Restoration 2.0)
  * `mods/Framework\\\_MOD/crazytaxi\\\_mod\\\_config.json` (Configuration settings)
* `MANUAL\\\_INSTALL.md` (This guide)

\---

### 2\. Step-by-Step Drag \& Drop Installation

1. **Open your game folder**:

   * Locate the folder where `Crazy Taxi.exe` is installed.
   * Common locations:

     * `C:\\\\Users\\\\<Username>\\\\Downloads\\\\Crazy Taxi\\\\2014\\\\`
     * `C:\\\\Program Files (x86)\\\\Steam\\\\steamapps\\\\common\\\\Crazy Taxi\\\\`
2. **Copy the files**:

   * Drag and drop `dinput8.dll` directly into the game root folder (next to `Crazy Taxi.exe`).
   * Drag and drop the `mods` folder directly into the game root folder (next to `Crazy Taxi.exe`).





3. **Clean up legacy standalone mods (if present)**:

   * If you previously had `CT-DC.asi` in the game directory, please delete it (Dreamcast Restoration is now natively integrated into Framework\_MOD with live toggles).



4. **Done!**

   * Simply launch `Crazy Taxi.exe`. The mod loader hooks in automatically upon launch.

\---

### 3\. Controls \& Mod Menu

* **Toggle Mod Menu**: Press **F7** or **F10** or shift F1 at any time.
* **Modern WASD Driving**:

  * **W**: Accelerate Forward (automatic forward gear engagement, no manual shifting required)
  * **S**: Brake / Reverse (automatically shifts into Reverse when stopped)
  * **A / D**: Steer Left / Steer Right
  * **Left Shift**: Crazy Dash / Turbo Boost
  * **Space**: Handbrake / Drift
* **Fly Mode**:

  * When enabled in the Mod Menu:
  * **Space**: Ascend (+Y elevation)
  * **Left Ctrl**: Descend (-Y elevation)
  * **WASD**: Fly smoothly in 3D space without ground snapping!
* **Free Camera**:

  * When enabled in the Mod Menu:
  * **Mouse**: 360-degree free look
  * **W / S**: Move camera forward / backward
  * **A / D**: Move camera left / right (corrected strafing)
  * **Space / Shift**: Move camera up / down

\---

### 4\. Uninstallation

To uninstall the mod:

* Delete `dinput8.dll` and the `mods` folder from your Crazy Taxi game directory.
* The game will instantly revert to 100% vanilla state without modifying any original game assets.

