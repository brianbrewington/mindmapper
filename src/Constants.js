/**
 * @fileoverview Application-wide constants and configuration.
 */

export const COLORS = {
    primary: '#007bff',
    selection: '#007bff',
    outline: '#333333',
    defaultBubble: '#87CEEB',
    defaultText: '#000000',
    connectionNormal: '#999999',
    connectionSelected: '#007bff',
    resizeHandle: '#007bff',
    background: '#ffffff',
    imageBorder: '#f8f9fa',
    linkIndicator: '#28a745',
    commentIndicator: '#007bff',
    imagePlaceholder: '#6c757d',
    imagePlaceholderText: '#495057',
    contextMenuBg: 'white',
    contextMenuBorder: '#ccc',
    contextMenuHover: '#eee',
    palette: [
        '#ffffff', // White
        '#ffcccc', // Light Red
        '#ccffcc', // Light Green
        '#ccccff', // Light Blue
        '#ffffcc', // Light Yellow
        '#ffccff', // Light Purple
        '#ccffff', // Light Cyan
    ]
};

export const FONTS = {
    family: 'Poppins',
    defaultSize: 16,
    defaultString: '16px Poppins',
    minSize: 8,
    fullString: (size, family = 'Poppins') => `${size}px ${family}`
};

export const CONFIG = {
    minZoom: 0.1,
    maxZoom: 5,
    defaultSceneDuration: 2000,
    connectionHitThreshold: 10,
    resizeHandleSize: 8,
    bubblePaddingX: 20,
    bubblePaddingY: 15,
};
