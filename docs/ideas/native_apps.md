# Native App Ideas: iPad & macOS

## Overview

The web version of MindMapper works well in browsers, but native apps could offer:

- **Better performance** (especially for large maps)
- **Offline-first** experience
- **Native integrations** (Apple Pencil, iCloud, Share extensions)
- **App Store distribution**

---

## Option 1: iPad App (Swift/SwiftUI)

### Advantages
- **Apple Pencil support** - natural drawing/sketching for mind maps
- **Split View / Slide Over** - reference materials alongside the map
- **iCloud sync** - seamless across devices
- **Files app integration** - save/load from Files
- **Native performance** - Metal-accelerated canvas

### Technical Approach

```
┌─────────────────────────────────────────────┐
│               SwiftUI Shell                 │
│  ┌───────────────────────────────────────┐  │
│  │         PencilKit Canvas              │  │
│  │    or custom Metal/Core Graphics      │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │      Model (Codable structs)          │  │
│  │   - Same JSON format as web version   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Key Components
1. **Canvas** - Custom `UIView` with `drawRect:` or PencilKit
2. **Model** - Swift structs with `Codable` for JSON compatibility
3. **Gestures** - Tap, pinch, pan, Apple Pencil pressure
4. **Persistence** - `FileDocument` for Files app, iCloud Drive

### Rough Effort
- MVP: 2-4 weeks
- Polish: 2-3 additional weeks

---

## Option 2: macOS App (SwiftUI + AppKit)

### Advantages
- **Menu bar** - Quick capture, keyboard shortcuts
- **Multiple windows** - compare maps side-by-side
- **Drag & drop** - from Finder, other apps
- **Native notifications** - reminders, sync status
- **Sandboxed** but powerful file access

### Technical Approach

Could share 80%+ code with iPad version via SwiftUI multiplatform.

```
┌─────────────────────────────────────────────┐
│           macOS SwiftUI App                 │
│  ┌───────────────────────────────────────┐  │
│  │       NSCanvas / CALayer canvas       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │      Shared Model (Swift Package)     │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   macOS-specific: Menu bar, Dock     │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Rough Effort
- If iPad exists: +1 week for macOS adaptation
- From scratch: 3-5 weeks

---

## Option 3: Electron Wrapper (Quick & Dirty)

### Advantages
- **Fastest path** - wrap existing web app
- **Code reuse** - 100% web codebase
- **Cross-platform** - macOS, Windows, Linux

### Disadvantages
- **Large binary** (~150MB+)
- **Memory hungry** - Chromium overhead
- **No native feel** - menus, shortcuts feel off
- **No Apple Pencil** - web doesn't support pressure

### When to Consider
- Need desktop app ASAP
- Users accept web-like experience
- No iPad requirement

---

## Option 4: Tauri (Rust + WebView)

### Advantages
- **Small binary** (~10-20MB)
- **Native performance** - Rust backend
- **Web frontend** - reuse existing code
- **Security** - Rust memory safety

### Disadvantages
- **macOS WebView limitations** - older Safari engine
- **Still no Apple Pencil**
- **Learning curve** - Rust for backend features

---

## Recommended Path

### Phase 1: PWA Improvements (Now)
- Add `manifest.json` for "Add to Home Screen"
- Implement service worker for offline
- Test on iPad Safari

### Phase 2: iPad Native (If demand)
- Swift/SwiftUI with shared JSON format
- Apple Pencil as primary input
- iCloud sync

### Phase 3: macOS Native (If iPad succeeds)
- Share Swift Package with iPad
- Add macOS-specific features (menu bar, windows)

---

## JSON Format Compatibility

The key to multi-platform success: **one format, many renderers**.

```json
{
  "version": "1.0",
  "elements": [...],
  "connections": [...],
  "scenes": [...],
  "theme": "dark"
}
```

All platforms read/write the same JSON. Users can:
1. Create on iPad with Pencil
2. Edit on macOS with keyboard
3. Present from web browser
4. Share via iCloud/Google Drive

---

## Resources

- [SwiftUI Canvas Tutorial](https://developer.apple.com/documentation/swiftui/canvas)
- [PencilKit Framework](https://developer.apple.com/documentation/pencilkit)
- [Tauri](https://tauri.app/) - Rust/WebView alternative to Electron
- [Capacitor](https://capacitorjs.com/) - Web-to-native bridge

---

*Document created: January 2026*
