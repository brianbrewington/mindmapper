# MindMapper Interoperability Format

## Overview

This document describes how external applications can create mindmap files that MindMapper can open. The goal is to enable:

- **AI agents** to generate mindmaps programmatically
- **Import tools** to convert from other formats (Mermaid, FreeMind, XMind)
- **Scripts** to batch-generate mindmaps from data

---

## File Format

MindMapper uses a simple **JSON format** stored in `.json` files.

### Minimal Example

```json
{
  "version": "1.0",
  "elements": [
    {
      "id": "node-1",
      "type": "bubble",
      "x": 400,
      "y": 300,
      "radiusX": 80,
      "radiusY": 50,
      "text": "Central Idea",
      "color": "#87CEEB"
    }
  ],
  "connections": [],
  "scenes": []
}
```

### Complete Example

```json
{
  "version": "1.0",
  "theme": "light",
  "elements": [
    {
      "id": "node-1",
      "type": "bubble",
      "x": 400,
      "y": 300,
      "radiusX": 100,
      "radiusY": 60,
      "text": "Main Topic",
      "color": "#87CEEB",
      "link": "https://example.com",
      "comment": "This is the central node"
    },
    {
      "id": "node-2",
      "type": "bubble",
      "x": 600,
      "y": 200,
      "radiusX": 70,
      "radiusY": 45,
      "text": "Subtopic A",
      "color": "#90EE90"
    },
    {
      "id": "text-1",
      "type": "text",
      "x": 200,
      "y": 400,
      "width": 150,
      "height": 30,
      "text": "Annotation text",
      "color": "#333333"
    },
    {
      "id": "img-1",
      "type": "image",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 150,
      "url": "https://example.com/image.png"
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "node-1",
      "to": "node-2",
      "comment": "Related topics"
    }
  ],
  "scenes": [
    {
      "id": "scene-1",
      "name": "Overview",
      "duration": 3000,
      "viewport": {
        "zoom": 1.0,
        "offset": { "x": 500, "y": 400 }
      }
    }
  ]
}
```

---

## Schema Reference

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Format version (currently "1.0") |
| `theme` | string | No | "light" or "dark" (default: "light") |
| `elements` | array | Yes | List of nodes (bubbles, text, images) |
| `connections` | array | Yes | List of edges between elements |
| `scenes` | array | No | Saved viewport snapshots for presentations |

### Element Types

#### Bubble (ellipse node)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string/number | Yes | Unique identifier |
| `type` | string | Yes | Must be `"bubble"` |
| `x` | number | Yes | Center X coordinate |
| `y` | number | Yes | Center Y coordinate |
| `radiusX` | number | Yes | Horizontal radius |
| `radiusY` | number | Yes | Vertical radius |
| `text` | string | Yes | Display text |
| `color` | string | No | Fill color (hex, e.g. "#87CEEB") |
| `link` | string | No | URL to open on Alt+Click |
| `comment` | string | No | Tooltip/note text |

#### Text (annotation)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string/number | Yes | Unique identifier |
| `type` | string | Yes | Must be `"text"` |
| `x` | number | Yes | Top-left X coordinate |
| `y` | number | Yes | Top-left Y coordinate |
| `width` | number | No | Text box width (default: 150) |
| `height` | number | No | Text box height (default: 30) |
| `text` | string | Yes | Display text |
| `color` | string | No | Text color (hex) |

#### Image

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string/number | Yes | Unique identifier |
| `type` | string | Yes | Must be `"image"` |
| `x` | number | Yes | Top-left X coordinate |
| `y` | number | Yes | Top-left Y coordinate |
| `width` | number | Yes | Image display width |
| `height` | number | Yes | Image display height |
| `url` | string | Yes | Image URL (http/https or data URI) |
| `link` | string | No | URL to open on Alt+Click |
| `comment` | string | No | Tooltip/note text |

### Connection

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string/number | No | Unique identifier (auto-generated if missing) |
| `from` | string/number | Yes | ID of source element |
| `to` | string/number | Yes | ID of target element |
| `link` | string | No | URL to open on Alt+Click |
| `comment` | string | No | Tooltip/note text |

### Scene (viewport snapshot)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string/number | Yes | Unique identifier |
| `name` | string | Yes | Display name in scenes panel |
| `duration` | number | No | Playback delay in ms (default: 2000) |
| `viewport` | object | Yes | Camera state |
| `viewport.zoom` | number | Yes | Zoom level (1.0 = 100%) |
| `viewport.offset` | object | Yes | Camera offset `{x, y}` |

---

## Coordinate System

- **Origin**: Top-left of canvas
- **X axis**: Increases rightward
- **Y axis**: Increases downward
- **Units**: Pixels (at zoom=1.0)
- **Bubble coordinates**: Center of ellipse
- **Text/Image coordinates**: Top-left corner

---

## Color Palette

MindMapper's default theme colors (recommended for visual consistency):

| Name | Light Mode | Dark Mode |
|------|------------|-----------|
| Sky Blue | `#87CEEB` | `#1a3a4a` |
| White/Gray | `#ffffff` | `#2c2c2c` |
| Pink/Red | `#ffcccc` | `#661111` |
| Yellow | `#ffffcc` | `#666611` |
| Mint/Green | `#ccffcc` | `#116611` |
| Cyan | `#ccffff` | `#115555` |

---

## Approaches for External Writers

### 1. Direct JSON Generation

The simplest approach - generate the JSON directly:

```python
import json

mindmap = {
    "version": "1.0",
    "elements": [
        {"id": 1, "type": "bubble", "x": 400, "y": 300, 
         "radiusX": 80, "radiusY": 50, "text": "Root"}
    ],
    "connections": [],
    "scenes": []
}

with open("my_mindmap.json", "w") as f:
    json.dump(mindmap, f, indent=2)
```

### 2. Python Helper Library (Future)

A potential `mindmapper-py` package:

```python
from mindmapper import MindMap, Bubble

mm = MindMap()
root = mm.add_bubble("Central Idea", x=400, y=300)
child = mm.add_bubble("Subtopic", x=600, y=200, color="#90EE90")
mm.connect(root, child)
mm.save("output.json")
```

### 3. AI Agent Integration

Prompt template for LLMs:

```
Generate a MindMapper JSON file with the following structure:
- Central node: "Project Plan"
- 4 child nodes: Requirements, Design, Implementation, Testing
- Connect each child to the central node
- Position nodes radially around the center at (500, 400)
- Use the schema: {version, elements[], connections[], scenes[]}
```

### 4. Import from Other Formats

Converters could be built for:

- **Mermaid** mindmap syntax
- **FreeMind** `.mm` XML
- **XMind** `.xmind` archives
- **Markdown** bullet lists
- **OPML** outlines

---

## Validation Tips

1. **IDs must be unique** across all elements
2. **Connections must reference valid element IDs**
3. **Coordinates should be positive** (visible on canvas)
4. **radiusX/radiusY should be > 0** for bubbles
5. **width/height should be > 0** for images

---

## Loading in MindMapper

1. **File → Load**: Opens file picker for `.json` files
2. **Drag & Drop**: Drop `.json` file onto canvas (if implemented)
3. **URL Parameter**: `?load=https://example.com/map.json` (if implemented)
4. **Embedded Bundle**: Pre-populate the `embeddedDataEncoded` variable

---

## Future Enhancements

- [ ] JSON Schema file for validation
- [ ] Python library for programmatic generation
- [ ] CLI tool for format conversion
- [ ] REST API endpoint for cloud saves
- [ ] WebSocket for real-time collaboration

---

*Document created: January 2026*
