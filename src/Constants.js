/**
 * @fileoverview Application-wide constants and configuration.
 */

/**
 * Maps Light Mode color hex codes to their Dark Mode equivalents.
 * Used for flipping bubble colors and other specific palette items.
 * Keys = Light Mode Colors, Values = Dark Mode Colors.
 */
/**
 * Structured definition of color pairs for Light and Dark modes.
 * Used for generating palettes and determining color flips.
 */
const COLOR_PAIRS = [
    { light: '#ffffff', dark: '#2c2c2c', name: 'White/DarkGray' },
    { light: '#ffcccc', dark: '#661111', name: 'Red' },
    { light: '#ccffcc', dark: '#115511', name: 'Green' },
    { light: '#ccccff', dark: '#111166', name: 'Blue' },
    { light: '#ffffcc', dark: '#666611', name: 'Yellow' },
    { light: '#ffccff', dark: '#551155', name: 'Purple' },
    { light: '#ccffff', dark: '#115555', name: 'Cyan' },
];

const LIGHT_THEME = {
    primary: '#007bff',        // Used for Buttons, Selection highlights, Links
    selection: '#007bff',      // Selected element outline/highlight
    outline: '#333333',        // Default outline for bubbles
    defaultBubble: '#87CEEB',  // Default fill for standard bubbles
    defaultText: '#000000',    // Default text color for bubbles and annotations
    connectionNormal: '#999999', // Unselected connection line color
    connectionSelected: '#007bff', // Selected connection line color
    resizeHandle: '#007bff',   // Image resize handle color
    background: '#ffffff',     // Canvas background color (CSS handles UI bg)
    imageBorder: '#f8f9fa',    // Border for images
    linkIndicator: '#28a745',  // Small indicator for URL links
    commentIndicator: '#007bff', // Small indicator for comments
    imagePlaceholder: '#6c757d', // Background for image placeholdres
    imagePlaceholderText: '#495057', // Text for image placeholders
    contextMenuBg: 'white',    // Context menu background
    contextMenuText: 'black',  // Context menu item text
    contextMenuBorder: '#ccc', // Context menu border
    contextMenuHover: '#eee',  // Context menu item hover background
    palette: COLOR_PAIRS.map(p => p.light)
};


const DARK_THEME = {
    primary: '#4dabf7', // Lighter blue for dark mode visibility
    selection: '#4dabf7',
    outline: '#e0e0e0', // Light gray outline
    defaultBubble: '#1a3a4a', // Dark version of Sky Blue
    defaultText: '#ffffff',
    connectionNormal: '#666666',
    connectionSelected: '#4dabf7',
    resizeHandle: '#4dabf7',
    background: '#121212',
    imageBorder: '#2c2c2c',
    linkIndicator: '#28a745', // Green is usually okay
    commentIndicator: '#4dabf7',
    imagePlaceholder: '#495057',
    imagePlaceholderText: '#ced4da',
    contextMenuBg: '#1e1e1e',
    contextMenuText: '#e0e0e0',
    contextMenuBorder: '#444',
    contextMenuHover: '#333',
    palette: COLOR_PAIRS.map(p => p.dark)
};

class _ThemeManager {
    constructor() {
        this.currentMode = 'dark'; // Default to dark mode
        this.listeners = new Set();
    }

    setTheme(mode) {
        if (mode !== 'light' && mode !== 'dark') return;
        this.currentMode = mode;
        this.listeners.forEach(cb => cb(mode));

        // Update body background immediately for seamless switch ?
        // Or let UIManager handle it. Ideally UIManager handles it.
    }

    getTheme() {
        return this.currentMode;
    }

    getColor(key) {
        const theme = this.currentMode === 'light' ? LIGHT_THEME : DARK_THEME;
        return theme[key] || LIGHT_THEME[key];
    }

    /**
     * Resolves a color (hex) to its current theme equivalent.
     * Use this when you have a stored hex code (e.g. from the model) 
     * and need to render it correctly in the current mode.
     * Supports bidirectional conversion: light↔dark
     */
    resolveColor(hex) {
        if (!hex) return hex;
        
        const normalizedHex = hex.toLowerCase();

        if (this.currentMode === 'light') {
            // Check if this is a dark palette color that needs to convert to light
            const pairFromDark = COLOR_PAIRS.find(p => p.dark.toLowerCase() === normalizedHex);
            if (pairFromDark) {
                return pairFromDark.light;
            }
            
            // Check default bubble color
            if (normalizedHex === DARK_THEME.defaultBubble.toLowerCase()) {
                return LIGHT_THEME.defaultBubble;
            }
            
            // Resolve white text to black in Light Mode
            if (normalizedHex === '#ffffff' || normalizedHex === '#fff' || hex === 'white') {
                return LIGHT_THEME.defaultText;
            }
            
            // Already a light color or custom - return as-is
            return hex;
        }

        // Dark mode: convert light colors to dark
        const pairFromLight = COLOR_PAIRS.find(p => p.light.toLowerCase() === normalizedHex);
        if (pairFromLight) {
            return pairFromLight.dark;
        }

        // Check default bubble color
        if (normalizedHex === LIGHT_THEME.defaultBubble.toLowerCase()) {
            return DARK_THEME.defaultBubble;
        }

        // Resolve common dark text colors to white in Dark Mode
        if (normalizedHex === '#000000' || normalizedHex === '#000' || hex === 'black' || normalizedHex === '#333333' || normalizedHex === '#333') {
            return DARK_THEME.defaultText;
        }

        // Custom color? Return as is.
        return hex;
    }

    onThemeChange(callback) {
        this.listeners.add(callback);
    }
}

export const ThemeManager = new _ThemeManager();

/**
 * Proxy object that returns colors based on the current theme.
 * This effectively updates all calls sites like COLORS.background dynamically.
 */
export const COLORS = new Proxy({}, {
    get: function (target, prop) {
        if (prop === 'palette') {
            return ThemeManager.currentMode === 'light' ? LIGHT_THEME.palette : DARK_THEME.palette;
        }
        return ThemeManager.getColor(prop);
    }
});

export const FONTS = {
    family: 'Lexend',
    fallback: 'Lexend, sans-serif',
    defaultSize: 16,
    defaultString: '16px Lexend, sans-serif',
    minSize: 8,
    fullString: (size, family = 'Lexend') => {
        // Don't add fallback if already present
        if (family.includes('sans-serif')) {
            return `${size}px ${family}`;
        }
        return `${size}px ${family}, sans-serif`;
    }
};

export const CONFIG = {
    // Zoom
    minZoom: 0.1,
    maxZoom: 5,
    zoomExtentsPadding: 50,
    
    // Scenes
    defaultSceneDuration: 2000,
    sceneOverlayFadeDuration: 300,
    
    // Hit Testing & Handles
    connectionHitThreshold: 10,
    resizeHandleSize: 8,
    minElementSize: 20,
    
    // Bubble Layout
    bubblePaddingX: 20,
    bubblePaddingY: 15,
    
    // UI Dimensions
    tooltipMaxWidth: 200,
    modalWidth: 300,
    contextMenuShadow: '2px 2px 5px rgba(0,0,0,0.2)',
    
    // Spacing
    spacing: {
        xs: 2,
        sm: 4,
        md: 8,
        lg: 15,
    },
    
    // Font Sizes (for canvas drawing)
    fontSize: {
        xs: 8,
        sm: 10,
        md: 12,
        lg: 14,
        xl: 16,
        xxl: 20,
    },
    
    // Border Radius
    borderRadius: {
        sm: 4,
        md: 5,
        lg: 8,
    },
};
