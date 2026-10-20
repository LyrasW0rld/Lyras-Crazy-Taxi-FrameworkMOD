#pragma once
#include <windows.h>
#include <d3d9.h>

extern IDirect3DDevice9* g_pActiveD3DDevice;
void SyncSegaDevicePointers(IDirect3DDevice9* pDevice);

struct Vector3
{
    float x, y, z;
};

// Memory Addresses (reversed from Crazy Taxi.exe)
constexpr uintptr_t ADDR_GAME_FLAG          = 0x016a2cfc; // 3 = Active Gameplay Session, 0 = Menus/Attract
constexpr uintptr_t ADDR_GAME_MODE          = 0x016a2818; // 4 = Arcade, 0xE (14) = Original / Crazy Box
constexpr uintptr_t ADDR_VEHICLE_STATE      = 0x01661474; // 8 = Attract AI Demo, < 8 = Player Controlled
constexpr uintptr_t ADDR_PLAYER_X           = 0x01661574;
constexpr uintptr_t ADDR_PLAYER_Y           = 0x01661578;
constexpr uintptr_t ADDR_PLAYER_Z           = 0x0166157c;
constexpr uintptr_t ADDR_PLAYER_SPEED       = 0x0166158c;
constexpr uintptr_t ADDR_PLAYER_FALL_SPD    = 0x016614b0;
constexpr uintptr_t ADDR_PLAYER_DELTA_X     = 0x016614ac;
constexpr uintptr_t ADDR_PLAYER_DELTA_Z     = 0x016614b4;
constexpr uintptr_t ADDR_VEHICLE_YAW_BAM    = 0x01661478;

constexpr uintptr_t ADDR_GRAVITY_CONST      = 0x0166148c; // Default: 5.0f
constexpr uintptr_t ADDR_GRAVITY_CONST_2    = 0x01661490; // Default: 5.0f
constexpr uintptr_t ADDR_GRAVITY_RDATA      = 0x0059fd4c; // Master 5.0f constant loaded by physics routines

constexpr uintptr_t ADDR_SPAWN_X            = 0x01661fa8;
constexpr uintptr_t ADDR_SPAWN_Y            = 0x01661fac;
constexpr uintptr_t ADDR_SPAWN_Z            = 0x01661fb0;

constexpr uintptr_t ADDR_TOTAL_MONEY        = 0x016f10e0; // Total accumulated player cash in cents ($1.00 = 100)
constexpr uintptr_t ADDR_CURRENT_FARE_TIPS  = 0x016a41c8; // Current passenger tip pool in cents
constexpr uintptr_t ADDR_GAME_TIMER         = 0x016a41a4; // uint32 (In-Game Round Timer in frames, 60 fps: 3000 = 50s, 356400 = 99m)
constexpr uintptr_t ADDR_FARE_CUTSCENE      = 0x016f2164; // Passenger cutscene animation state (> 0 during pickup/dropoff)
constexpr uintptr_t ADDR_PASSENGER_OBJ      = 0x016f21b0; // Active passenger object pointer
constexpr uintptr_t ADDR_VEHICLE_ACTIVE_INDEX = 0x01661570; // Player vehicle index (1 for Player 1)

constexpr uintptr_t ADDR_CAM_EYE_X          = 0x01661494;
constexpr uintptr_t ADDR_CAM_EYE_Y          = 0x01661498;
constexpr uintptr_t ADDR_CAM_EYE_Z          = 0x0166149c;
constexpr uintptr_t ADDR_CAM_TARGET_X       = 0x016614f8;
constexpr uintptr_t ADDR_CAM_TARGET_Y       = 0x016614fc;
constexpr uintptr_t ADDR_CAM_TARGET_Z       = 0x01661500;
constexpr uintptr_t ADDR_CAM_ROLL           = 0x016614c8; // 16-bit BAM integer (0..65535 = 0..360 deg)
constexpr uintptr_t ADDR_CAM_VIEW_MATRIX    = 0x01661530; // 16 floats (D3DMATRIX)

constexpr uintptr_t ADDR_STUNT_TIP_ADD      = 0x004a8de7; // add [0x16a41c8], ecx (stunt reward finalized)
constexpr uintptr_t ADDR_CAM_UPDATE_CALL    = 0x0051f582;
constexpr uintptr_t ADDR_CAM_LOOKAT_FN      = 0x0049b200;

// Input & Controller State Addresses
constexpr uintptr_t ADDR_MAIN_INPUT_LOOP   = 0x004ea3a8; // call 0x004F2ED0 (per-frame input commit in main loop)
constexpr uintptr_t ADDR_F2ED0_FN          = 0x004f2ed0;
constexpr uintptr_t ADDR_INPUT_BUTTONS      = 0x016a2848; // uint32 bitmask (raw input buffer)
constexpr uintptr_t ADDR_INPUT_BUTTONS_2    = 0x016a287c; // uint32 bitmask (filtered/latched input buffer used by physics/camera)
constexpr uintptr_t ADDR_INPUT_BUFFER_DELTA = 0x34;       // Offset between player 0 raw buffer and latched buffer
constexpr uintptr_t ADDR_INPUT_STEER_AXIS   = 0x016a2858; // int16 signed (-32767..32767)
constexpr uintptr_t ADDR_INPUT_ACCEL_AXIS   = 0x016a285a; // uint16 (0..65535)
constexpr uintptr_t ADDR_INPUT_BRAKE_AXIS   = 0x016a285c; // uint16 (0..65535)
constexpr uintptr_t ADDR_INPUT_BTN_LOOK_DEST= 0x016a2860; // uint8
constexpr uintptr_t ADDR_INPUT_BTN_ACCEL    = 0x016a2863; // uint8 (0 or 1)
constexpr uintptr_t ADDR_INPUT_BTN_BRAKE    = 0x016a2864; // uint8 (0 or 1)
constexpr uintptr_t ADDR_INPUT_BTN_GEAR_D   = 0x016a2865; // uint8 (0 or 1)
constexpr uintptr_t ADDR_INPUT_BTN_GEAR_R   = 0x016a2866; // uint8 (0 or 1)
constexpr uintptr_t ADDR_INPUT_EDGE_DRIVE   = 0x016a2869; // uint8 (rising edge)
constexpr uintptr_t ADDR_INPUT_EDGE_REV     = 0x016a286a; // uint8 (rising edge)
constexpr uintptr_t ADDR_INPUT_EDGE_DRIVE_F = 0x016a286d; // uint8 (falling edge)
constexpr uintptr_t ADDR_INPUT_EDGE_REV_F   = 0x016a286e; // uint8 (falling edge)
constexpr uintptr_t ADDR_INPUT_GEAR_STATE   = 0x016a2873; // uint8 (0/2 = Drive, 1 = Reverse)
constexpr uintptr_t ADDR_INPUT_GEAR_SETTING = 0x016a2874;

// Sega Ground Collision Flag & Vehicle Attitude
constexpr uintptr_t ADDR_GROUND_COLLISION   = 0x01661596; // uint8 (1 = Wheels on ground / road contact)
constexpr uintptr_t ADDR_VEHICLE_PITCH_BAM  = 0x0166147a; // int16
constexpr uintptr_t ADDR_VEHICLE_ROLL_BAM   = 0x0166147c; // int16

// DirectInput Keyboard Poller in Crazy Taxi.exe
constexpr uintptr_t ADDR_KEYBOARD_POLL_FN   = 0x00486390;

// Master Camera Far-Z Clip Plane
constexpr uintptr_t ADDR_FAR_Z_RDATA        = 0x005a0150; // Default: 15000.0f

// Vehicle Physics Master Loop Call Sites
constexpr uintptr_t ADDR_VEHICLE_UPDATE_CALL_1 = 0x0051139b; // call 0x0051D940
constexpr uintptr_t ADDR_VEHICLE_UPDATE_CALL_2 = 0x00511f86; // call 0x0051D940
constexpr uintptr_t ADDR_VEHICLE_UPDATE_FN     = 0x0051d940;

// Sega Secret Developer Cheats & Modes
constexpr uintptr_t ADDR_SEGA_UNLOCK_ALL    = 0x0164fa58; // uint8 (0xFF = Unlock all bikes and crazy box)
constexpr uintptr_t ADDR_SEGA_UNLOCK_MASK   = 0x016aa3c0; // uint32 (0xFFFFFFFF = Unlock all characters/vehicles)
constexpr uintptr_t ADDR_SEGA_CHAR_SELECT   = 0x016a9b30; // int (0..3 = Cabs, 4..7 = Bikes)
constexpr uintptr_t ADDR_SEGA_ANOTHER_DAY   = 0x01662304; // int (1 = Another Day Mode)
constexpr uintptr_t ADDR_SEGA_NO_ARROWS     = 0x016ef0bc; // int (1 = No Arrows)
constexpr uintptr_t ADDR_SEGA_NO_DEST_MARK  = 0x016eeea0; // int (1 = No Destination Mark)
constexpr uintptr_t ADDR_SEGA_BIKE_MODE     = 0x016aa3c4; // int (bit 0x20 = Bike Mode)

// Camera Chunk Culling Distance Constants in .rdata
constexpr uintptr_t ADDR_CHUNK_DIST_CAMERA  = 0x005a10a8; // 850.0f camera chunk cull distance
constexpr uintptr_t ADDR_CHUNK_DIST_FAR     = 0x0059f9f8; // 450.0f far chunk cull distance

// Legacy chunk distance skip checks (intact to prevent table overflow)
constexpr uintptr_t ADDR_CHUNK_CHECK_1      = 0x0050415a;
constexpr uintptr_t ADDR_CHUNK_CHECK_2      = 0x00504213;
constexpr uintptr_t ADDR_CHUNK_CHECK_3      = 0x005042cd;

// Sega Master Collision & Chunk Loading Functions
constexpr uintptr_t ADDR_COLLISION_WORLD    = 0x004dc580; // Master world, scenery & terrain collision routine
constexpr uintptr_t ADDR_COLLISION_TRAFFIC  = 0x004dc660; // Master NPC traffic car & dynamic obstacle collision routine
constexpr uintptr_t ADDR_LOAD_CHUNKS_AROUND = 0x00504090; // Native sector chunk & texture proximity streamer (__cdecl)

bool InitGameFeatures();
void ShutdownGameFeatures();
void UpdateGameFeaturesPerFrame();
void ApplySoundtrackSetting(bool original);

bool IsInGame();
bool GetTaxiPosition(float& x, float& y, float& z);
bool GetTaxiSpeed(float& speed);
bool GetTaxiMoney(float& totalDollars, float& rideTips);
void SetInGameTimerSeconds(int seconds);
void SetInGameTimerMinutes(int minutes);
int  GetInGameTimerSeconds();
bool TeleportTaxi(float x, float y, float z);
bool GetGroundCollision();

bool GetCameraEyePosition(float& x, float& y, float& z);
bool GetCameraTargetPosition(float& x, float& y, float& z);

// Freecam & Mouse Look APIs
void TeleportFreecamToTaxi();
void MoveFreecam(float dRight, float dUp, float dFwd);
void ResetMouseLook();

// DirectInput Hardware Keyboard Buffer Interceptor
extern "C" __declspec(dllexport) void ProcessKeyboardBuffer(BYTE* pBuf);
