# Crazy Taxi Sub-Mod Development Guide
> **Building Standalone DLL Plugins for Lyra's Mod Framework**  
> *Target: Crazy Taxi (Steam PC Release, 32-Bit x86)*

This guide explains how to build your own standalone DLL sub-mod inside the `mods/` directory, integrate it cleanly into **Lyra's Framework Mod** (Shift+F1 menu), toggle it on and off, and render custom interactive UI elements (buttons, sliders, toggles) using the framework's shared Dear ImGui and Direct3D 9 pipeline.

---

## 1. Architecture & Loading Flow

When *Crazy Taxi* boots:
1. The game loads `dinput8.dll` (the proxy loader in the game root directory).
2. `dinput8.dll` scans the `mods/` directory and loads every `.dll` inside subfolders (e.g. `mods/Framework_MOD/Framework_MOD.dll`, `mods/SpeedometerMod/SpeedometerMod.dll`).
3. `Framework_MOD.dll` initializes the Direct3D 9 hook and Dear ImGui rendering.
4. `Framework_MOD.dll` inspects all loaded DLLs in memory. If a DLL exports `GetSubModName()`, it is automatically registered as a **Sub-Mod**!
5. In the **Mod Menu (Shift+F1)**, your mod appears in the Left Sidebar. Clicking it activates your mod's tab, rendering your UI controls directly through the shared ImGui context.

```text
Crazy Taxi.exe
  └── dinput8.dll (Proxy Loader)
        ├── mods/Framework_MOD/Framework_MOD.dll  (Host UI, D3D9 Hooks, Engine Guards)
        └── mods/MyCustomMod/MyCustomMod.dll      (Your Sub-Mod)
              ▲
              │ Shares ImGuiContext & IDirect3DDevice9*
              ▼
        Framework Mod Menu (Shift+F1 Sidebar)
```

---

## 2. Sub-Mod C ABI Export Functions

Your sub-mod needs to export standard C ABI functions (`extern "C" __declspec(dllexport)`). `Framework_MOD` calls these functions:

| Function Signature | Required / Optional | Purpose |
|---|---|---|
| `const char* GetSubModName()` | **Required** | Identifies the DLL as a sub-mod and provides the name displayed in the sidebar. |
| `const char* GetSubModAuthor()` | Optional | Author name displayed in the sub-mod header (default: `"Community"`). |
| `const char* GetSubModVersion()` | Optional | Version string (default: `"1.0"`). |
| `const char* GetSubModDescription()`| Optional | Description rendered under the mod header. |
| `bool IsSubModEnabled()` | **Required** | Returns whether your mod is currently active. |
| `void SetSubModEnabled(bool)` | **Required** | Called when the user clicks the "Enable / Disable" toggle button in the sidebar or menu. |
| `void InitSubMod(void* ctx, IDirect3DDevice9* dev)` | **Required** | Called once by Framework_MOD when detected. Passes the host `ImGuiContext*` and `IDirect3DDevice9*`. |
| `void RenderSubModUI(void* ctx)` | **Required** | Called every frame when your mod's page is selected in the menu. Render your sliders, buttons, and settings here! |

---

## 3. Sharing ImGui Graphics & Styling

Because `Framework_MOD` passes its own active `ImGuiContext*` to `InitSubMod`, your sub-mod **inherits the exact same design**:
- Dark translucent glassmorphism background (`rgba(20, 20, 25, 0.90)`).
- Sega Arcade hot pink / magenta accents (`#FF2080`).
- TrueType anti-aliased font rendering.
- Perfectly aligned widgets and sliders.

In your `InitSubMod`, simply call:
```cpp
ImGui::SetCurrentContext((ImGuiContext*)pImGuiContext);
```
From that point on, standard Dear ImGui calls (`ImGui::Button`, `ImGui::SliderFloat`, `ImGui::Checkbox`) work seamlessly without creating a new D3D device or window hook!

---

## 4. Complete Starter Mod Example

Here is a complete, working example of a sub-mod that adds a **Turbo Boost Hotkey** and **Infinite Passenger Tips**:

### `my_mod.cpp`
```cpp
#include <windows.h>
#include <d3d9.h>
#include "imgui.h" // Include Dear ImGui headers

// Game Memory Addresses (from offset.md)
constexpr uintptr_t ADDR_GAME_FLAG   = 0x016A2CFC; // 3 = In active gameplay
constexpr uintptr_t ADDR_PLAYER_X    = 0x01661574;
constexpr uintptr_t ADDR_PLAYER_Y    = 0x01661578;
constexpr uintptr_t ADDR_PLAYER_Z    = 0x0166157C;
constexpr uintptr_t ADDR_PLAYER_SPD  = 0x0166158C;
constexpr uintptr_t ADDR_TOTAL_MONEY = 0x016F10E0;

// Sub-Mod State
static bool  g_bEnabled     = true;
static float g_BoostPower   = 1.5f;
static bool  g_InfiniteTips = false;

// Background worker thread for gameplay logic
static DWORD WINAPI ModWorkerThread(LPVOID)
{
    while (true)
    {
        Sleep(16); // ~60 fps update loop

        if (!g_bEnabled)
            continue;

        // Check if game is in an active round
        int* pGameFlag = (int*)ADDR_GAME_FLAG;
        if (!pGameFlag || *pGameFlag != 3)
            continue;

        // Example Feature 1: Turbo Boost with 'T' key
        if ((GetAsyncKeyState('T') & 0x8000) != 0)
        {
            float* pSpeed = (float*)ADDR_PLAYER_SPD;
            if (pSpeed && *pSpeed < 120.0f)
            {
                *pSpeed *= g_BoostPower;
            }
        }

        // Example Feature 2: Infinite Money / Tips
        if (g_InfiniteTips)
        {
            int* pMoney = (int*)ADDR_TOTAL_MONEY;
            if (pMoney && *pMoney < 500000) // $5,000.00
            {
                *pMoney = 500000;
            }
        }
    }
    return 0;
}

// ---------------------------------------------------------------------------
// Standard Sub-Mod C ABI Exports
// ---------------------------------------------------------------------------

extern "C" __declspec(dllexport) const char* GetSubModName()
{
    return "Turbo Taxi & Tips";
}

extern "C" __declspec(dllexport) const char* GetSubModAuthor()
{
    return "YourName";
}

extern "C" __declspec(dllexport) const char* GetSubModVersion()
{
    return "1.0.0";
}

extern "C" __declspec(dllexport) const char* GetSubModDescription()
{
    return "Adds hotkey turbo acceleration and infinite fare tip options.";
}

extern "C" __declspec(dllexport) bool IsSubModEnabled()
{
    return g_bEnabled;
}

extern "C" __declspec(dllexport) void SetSubModEnabled(bool enabled)
{
    g_bEnabled = enabled;
}

extern "C" __declspec(dllexport) void InitSubMod(void* pImGuiContext, IDirect3DDevice9* pDevice)
{
    // Bind shared ImGui context
    if (pImGuiContext)
    {
        ImGui::SetCurrentContext((ImGuiContext*)pImGuiContext);
    }

    // Start background physics/hotkey thread
    CreateThread(NULL, 0, ModWorkerThread, NULL, 0, NULL);
}

extern "C" __declspec(dllexport) void RenderSubModUI(void* pImGuiContext)
{
    // Ensure ImGui context is set
    if (pImGuiContext && ImGui::GetCurrentContext() != pImGuiContext)
    {
        ImGui::SetCurrentContext((ImGuiContext*)pImGuiContext);
    }

    ImGui::TextColored(ImVec4(1.0f, 0.4f, 0.7f, 1.0f), "Turbo Taxi Settings");
    ImGui::Separator();
    ImGui::Spacing();

    // Toggle Checkbox
    ImGui::Checkbox("Enable Mod Features", &g_bEnabled);
    ImGui::Spacing();

    if (g_bEnabled)
    {
        // Boost Power Slider
        ImGui::Text("Hold 'T' while driving to activate Turbo Boost.");
        ImGui::SliderFloat("Boost Multiplier", &g_BoostPower, 1.05f, 2.50f, "%.2fx");
        ImGui::Spacing();

        // Infinite Tips Checkbox
        ImGui::Checkbox("Lock Money to $5,000.00", &g_InfiniteTips);
        ImGui::Spacing();

        // Interactive Action Button
        if (ImGui::Button("Instant Fix Taxi Orientation"))
        {
            // Level out vehicle pitch/roll (BAM angles = 0)
            int16_t* pPitch = (int16_t*)0x0166147A;
            int16_t* pRoll  = (int16_t*)0x0166147C;
            if (pPitch) *pPitch = 0;
            if (pRoll)  *pRoll  = 0;
        }
    }
}

// Standard DllMain entry point
BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved)
{
    return TRUE;
}
```

---

## 5. CMake Build Configuration (`CMakeLists.txt`)

You can compile your sub-mod using CMake and Visual Studio 2022/2026 Developer Command Prompt (`x86`):

```cmake
cmake_minimum_required(VERSION 3.20)
project(TurboTaxiMod LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Point to Dear ImGui headers
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/deps/imgui
)

add_library(TurboTaxiMod SHARED
    my_mod.cpp
    deps/imgui/imgui.cpp
    deps/imgui/imgui_draw.cpp
    deps/imgui/imgui_tables.cpp
    deps/imgui/imgui_widgets.cpp
)

target_link_libraries(TurboTaxiMod PRIVATE d3d9)

# Output directory: Crazy Taxi/mods/TurboTaxiMod/TurboTaxiMod.dll
set_target_properties(TurboTaxiMod PROPERTIES
    OUTPUT_NAME "TurboTaxiMod"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin"
)
```

### Build Commands:
```cmd
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars32.bat"
cmake -B build -A Win32
cmake --build build --config Release
```

---

## 6. Deployment & Directory Structure

To deploy your mod to *Crazy Taxi*:
1. Create a folder inside `<GameRoot>/mods/` matching your mod name, for example:
   ```text
   Crazy Taxi/
   ├── dinput8.dll
   ├── Crazy Taxi.exe
   └── mods/
       ├── Framework_MOD/
       │   └── Framework_MOD.dll
       └── TurboTaxiMod/
           └── TurboTaxiMod.dll   <-- Your compiled DLL goes here!
   ```
2. Launch `Crazy Taxi.exe`.
3. Press **Shift + F1** to open the Mod Menu.
4. Your mod will appear in the left sidebar! Click it to toggle options, adjust sliders, and use buttons.

---

## 7. Best Practices & Conflict Prevention

1. **Do NOT Hook D3D9 EndScene Again:**  
   `Framework_MOD.dll` already hooks Direct3D 9 `EndScene` and manages device resets (`Reset`). Hooking it a second time in another DLL can cause race conditions or device lost crashes. Always render UI via `RenderSubModUI`.
2. **Do NOT Install a Second WndProc Hook:**  
   `Framework_MOD.dll` intercepts keyboard/mouse messages for ImGui. Capturing raw input with another `SetWindowLongPtr(GWLP_WNDPROC)` can break menu navigation.
3. **Always Check In-Game State:**  
   Before writing to `ADDR_PLAYER_X` or vehicle velocity, verify `*(int*)ADDR_GAME_FLAG == 3`. In main menus or loading screens, vehicle structures may be unallocated or contain garbage data.
4. **Use `VirtualProtect` for `.rdata` or Code Hooks:**  
   If modifying constants in `.rdata` (e.g. `0x005A0150` Far-Z or `0x0059FD4C` Gravity), call `VirtualProtect(pAddr, size, PAGE_EXECUTE_READWRITE, &old)` first.
5. **Clean Exit:**  
   When your sub-mod is disabled (`SetSubModEnabled(false)`), ensure background tasks stop applying patches or modifying coordinates.
