# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML website featuring an interactive Chinese character touch distortion effect. The site displays "超古冠今" (Transcending Ancient and Modern) with a sophisticated canvas-based animation where characters decompose into particles when touched by the mouse cursor.

## Project Structure

- `index.html` - Main HTML page with clean structure
- `css/styles.css` - All visual styling and responsive design
- `js/touch-distortion.js` - Interactive canvas animation logic
- `.user.ini` - PHP configuration file for web server settings

## Development Commands

This is a static HTML website with no build process. To develop:

1. **Local Development**: Open `index.html` directly in a web browser or serve via any HTTP server
2. **Testing**: Manual testing in web browsers (Chrome, Firefox, Safari recommended for canvas performance)
3. **Deployment**: Upload files directly to web server

## Architecture

### Core Components

**TouchDistortion Class** (`index.html:181-659`)
- Main controller for the interactive text distortion effect
- Manages canvas rendering, mouse interactions, and particle animations
- Key methods:
  - `createTextPoints()` - Extracts pixel data from Chinese characters
  - `updateDistortion()` - Handles mouse proximity effects and particle decomposition
  - `draw()` - Renders the current frame with all effects

**Character Processing**
- Uses temporary canvas to extract pixel data from each Chinese character
- Creates point clouds representing the visual structure of characters
- Implements magnetic attraction when mouse approaches characters
- Triggers particle decomposition effects on direct contact

**Animation System**
- Particle-based decomposition with configurable force and spread
- Reformation animation when mouse moves away
- Optimized rendering with reduced visual effects for performance

## Performance Considerations

- Uses `devicePixelRatio` scaling for high-DPI displays
- Implements step-based pixel sampling (every 8th pixel) to reduce computation
- Simplified particle rendering without glow effects for better performance
- Configurable distortion parameters (`distortionRadius: 150px`, `distortionStrength: 50px`)

## Browser Compatibility

- Requires HTML5 Canvas support
- Optimized for modern browsers with requestAnimationFrame
- Responsive design with mobile breakpoints at 768px and 480px
- Touch events supported for mobile devices