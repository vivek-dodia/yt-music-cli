---
layout: default
title: Architecture
---

# Architecture

Technical overview of youtube-music-cli's architecture.

## Overview

youtube-music-cli is built with:

- **React + Ink** - Terminal UI framework
- **TypeScript** - Type-safe development
- **Bun** - Fast JavaScript runtime
- **mpv + yt-dlp** - Audio playback

## Project Structure

```
youtube-music-cli/
├── source/
│   ├── cli.tsx              # CLI entry point
│   ├── app.tsx              # App setup
│   ├── main.tsx             # Root component with providers
│   │
├── components/          # UI Components
│   ├── layouts/         # Main view layouts
│   ├── player/          # Player components
│   ├── favorites/       # Favorites view
│   ├── search/          # Search components
│   ├── plugins/         # Plugin management UI
│   │   ├── settings/        # Settings UI
│   │   └── common/          # Shared components
│   │
│   ├── services/            # Business logic
│   │   ├── player/          # Audio playback
│   │   ├── youtube-music/   # YouTube Music API
│   │   ├── plugin/          # Plugin system
│   │   ├── config/          # Configuration
│   │   └── logger/          # Logging
│   │
│   ├── stores/              # State management
│   │   ├── player.store.tsx
│   │   ├── navigation.store.tsx
│   │   └── plugins.store.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   ├── contexts/            # React contexts
│   └── utils/               # Utilities
│
├── plugins/                 # Plugin submodule
├── templates/               # Plugin templates
├── docs/                    # Documentation
└── dist/                    # Compiled output
```

## State Management

Uses React Context + useReducer pattern:

```
                    ┌─────────────────┐
                    │   Providers     │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ThemeProvider│ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │PlayerProvider│ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │FavProvider  │ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │NavProvider  │ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │PluginsProvider│ │
                    │ └─────────────┘ │
                    └─────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │   MainLayout    │
                    │   (Router)      │
                    └─────────────────┘
```

### Player Store

Manages playback state:

- Current track
- Queue
- Playback status
- Volume, shuffle, repeat

### Favorites Store

Manages favorite tracks:

- Toggle favorite status
- Persistence to `favorites.json`
- Optimized list rendering

### Navigation Store

Manages view navigation:

- Current view
- View history
- Navigation actions

### Plugins Store

Manages plugin state:

- Installed plugins
- Plugin status (enabled/disabled)
- Installation operations

## Service Layer

Services encapsulate external dependencies:

### PlayerService

Wraps mpv/yt-dlp for audio playback.

```typescript
const player = getPlayerService();
await player.play(track);
player.pause();
player.setVolume(80);
```

### MusicService

Wraps YouTube Music API (Innertube).

```typescript
const music = getMusicService();
const results = await music.search('query');
const suggestions = await music.getSuggestions(videoId);
```

### FavoritesService

Wraps favorites persistence.

```typescript
const favs = getFavoritesService();
await favs.saveFavorites(tracks);
const data = await favs.loadFavorites();
```

### PluginRegistryService

Manages plugin lifecycle.

```typescript
const registry = getPluginRegistryService();
await registry.loadAllPlugins();
await registry.enablePlugin('adblock');
```

## Plugin System

### Plugin Lifecycle

```
Install → Load → Init → Enable → (Running) → Disable → Destroy → Uninstall
```

### Plugin Context

Plugins receive a context object with APIs:

```typescript
{
  player,      // Playback control
  navigation,  // View navigation
  config,      // Configuration storage
  logger,      // Logging
  filesystem,  // File operations
  audio,       // Audio stream hooks
  on/off/emit, // Event system
}
```

### Event Flow

```
User Action → Store Dispatch → State Update → Plugin Hook → UI Re-render
                                    │
                                    ▼
                            Plugin Event Emitted
```

## Component Architecture

### Layouts

Each view has a dedicated layout component:

- `PlayerLayout` - Main player view
- `SearchLayout` - Search interface
- `PluginsLayout` - Plugin management
- `ConfigLayout` - Settings

### Ink Primitives

Components use Ink's Box and Text:

```tsx
<Box flexDirection="column" padding={1}>
	<Text color="green">Now Playing</Text>
	<Text>{track.title}</Text>
</Box>
```

## Data Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Input   │───▶│  Store   │───▶│   UI     │
│(Keyboard)│    │(Reducer) │    │(React)   │
└──────────┘    └──────────┘    └──────────┘
                     │
                     ▼
               ┌──────────┐
               │ Services │
               │(Side FX) │
               └──────────┘
```

## Build Process

1. **TypeScript Compilation** (`tsc`)
2. **Output to `dist/`**
3. **Entry: `dist/source/cli.js`**

```bash
bun run build  # Runs format → lint → typecheck → tsc
```

## Testing

- **AVA** - Test runner
- **ink-testing-library** - Component testing

```bash
bun run test
```
