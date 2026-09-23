# SOVEREIGN APP: DEVELOPMENT PROTOCOLS & RULES

## 1. Core Identity & Architecture
- **Project:** Sovereign (A high-status, air-gapped dopamine detoxification and habit-breaking mobile application).
- **Stack:** React Native 0.74+, Expo SDK 57, Expo Router, TypeScript (Strict).
- **State & Data:** 100% on-device. Use `AsyncStorage` and React Context. Zero remote analytics, zero backend servers. All data is air-gapped.
- **Hardware Integrations:** Biometrics (`expo-local-authentication`), Camera/Sensors (`expo-camera`, `expo-sensors`), and Haptics (`expo-haptics`).

## 2. The "Luxury Apple Glass" Aesthetic
- **Base Canvas:** Deep absolute blacks and dark grays (`#000000`, `#07090E`).
- **Surfaces:** Never use solid flat colors for cards. Use `expo-blur` (`BlurView`) heavily, layered with `expo-linear-gradient` to create frosted glass and specular borders.
- **Typography:** Stark, utilitarian, and high-contrast. Use mono-spaced or tabular numbers for telemetry/timers.
- **Feedback:** Every physical interaction (buttons, toggles, success states) MUST trigger `expo-haptics` (Impact/Notification).
- **Accents:** Use purposeful, glowing accents (Amber for warnings, Cyan/Cold Blue for routines, Emerald for clearance).

## 3. Strict Coding Constraints (Do Not Violate)
- **TypeScript:** Strict mode is ON. No `any` types. Define explicit interfaces for all component props, state, and API responses.
- **No Web CSS in Native:** React Native `StyleSheet` does not support web properties. **NEVER use `filter: 'blur(...)'`**. Use `BlurView` components instead.
- **Absolute Fill:** Because of TypeScript union conflicts with React Native's typings, **NEVER** use `...StyleSheet.absoluteFill` or `...StyleSheet.absoluteFillObject`. 
  - *Always use this exact fallback:* `position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,`
- **Imports:** Group imports logically: React -> React Native -> Expo -> Local Contexts -> Local Themes/Components.

## 4. Skills & Agentic Operations Protocol
When requested to invoke specific skills, adhere to these operational modes:

- **@Skill:UI-Architect:** Focus entirely on the "Apple Glass" aesthetic. Prioritize Reanimated 60fps transitions, accurate shadows, and specular gradient borders.
- **@Skill:Native-Integrator:** Focus on hardware APIs (Push Notifications, Camera, Sensors, In-App Purchases). Prioritize graceful fallbacks, permission handling, and iOS/Android configuration updates in `app.json`.
- **@Skill:Refactor-Engine:** Analyze code for performance bottlenecks, unnecessary re-renders, and component modularity. Keep UI components under 200 lines by breaking down complex layouts into smaller chunks.
- **@Skill:Security-Auditor:** Ensure zero data leaks. Verify that the Secure Enclave / Biometric gates are functioning properly and that `AsyncStorage` payload keys are logically isolated.

## 5. Execution Mandate
When writing or modifying code:
1. Do not break existing UI layouts.
2. Provide complete file replacements or extremely precise patch blocks.
3. If an instruction violates the air-gapped privacy constraint or the native CSS constraints, refuse the instruction and explain why.