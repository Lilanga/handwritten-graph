/**
 * Utility functions for creating directional scribble and watercolor style fill patterns
 * Based on the directional scribble fill technique for map regions
 */
import * as d3 from 'd3';

/**
 * Create a directional scribble pattern definition for SVG fills
 * This mimics hand-drawn fills with directional brush strokes
 * 
 * @param {Object} defs - D3 selection of SVG defs element
 * @param {String} id - Unique pattern ID
 * @param {String} color - Base color for the pattern
 * @param {Number} density - Number of scribble lines (5-15 recommended)
 * @param {Number} width - Width of pattern tile
 * @param {Number} height - Height of pattern tile
 * @param {Number} direction - Direction of the scribble lines in degrees (0-180)
 * @returns {String} Pattern ID reference to use as fill
 */
export function createDirectionalScribblePattern(defs, id, color, density = 8, width = 120, height = 120, direction = 0) {
    // Create a unique pattern ID if none provided
    const patternId = id || `scribble-${Math.random().toString(36).substr(2, 9)}`;

    // Create the pattern element
    const pattern = defs.append('pattern')
        .attr('id', patternId)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', width)
        .attr('height', height);

    // Add a watercolor-like background with base color
    pattern.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', color)
        .attr('fill-opacity', 0.25);

    // Add watercolor texture for background
    addWatercolorTexture(pattern, width, height, color, 4);

    // Calculate the angle in radians
    const angleRad = (direction * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Calculate line endpoints based on direction to span the entire pattern
    // We use longer lines to ensure they extend beyond pattern boundaries
    // regardless of angle
    const diagonalLength = Math.sqrt(width * width + height * height);
    const center = [width / 2, height / 2];

    // Create multiple parallel scribble lines
    const lineSpacing = height / (density + 1);

    for (let i = 0; i <= density; i++) {
        // Calculate starting position
        const offset = i * lineSpacing - height / 2;
        const startX = center[0] - cos * diagonalLength / 2 + sin * offset;
        const startY = center[1] - sin * diagonalLength / 2 - cos * offset;
        const endX = center[0] + cos * diagonalLength / 2 + sin * offset;
        const endY = center[1] + sin * diagonalLength / 2 - cos * offset;

        // Create a scribble line path along this direction
        const path = generateScribblePath([startX, startY], [endX, endY], width, height);

        // Vary the stroke characteristics
        const strokeOpacity = 0.5 + Math.random() * 0.3;
        const strokeWidth = 1 + Math.random() * 2;
        const strokeColor = adjustColor(color, -15 + Math.random() * 30);

        // Create the path with oil paint/watercolor effect
        pattern.append('path')
            .attr('d', path)
            .attr('stroke', strokeColor)
            .attr('stroke-width', strokeWidth)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-opacity', strokeOpacity)
            .attr('fill', 'none');
    }

    return `url(#${patternId})`;
}

/**
 * Generate a scribble path that follows a line from start to end
 * This creates a hand-drawn looking line with natural variations
 * 
 * @param {Array} start - Starting point [x, y]
 * @param {Array} end - End point [x, y]
 * @param {Number} width - Pattern width (for boundary checks)
 * @param {Number} height - Pattern height (for boundary checks)
 * @returns {String} SVG path string
 */
function generateScribblePath(start, end, width, height) {
    // Line parameters
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    // Calculate number of points based on line length
    const numPoints = Math.max(10, Math.min(30, Math.floor(length / 10)));

    // Generate points along the line with natural hand-drawn wobble
    const points = [];
    const wobbleAmount = 2 + Math.random() * 2; // Amount of perpendicular wobble

    // Direction perpendicular to the line
    const perpX = -dy / length;
    const perpY = dx / length;

    // Add the starting point
    points.push(start);

    // Add intermediate points
    for (let i = 1; i < numPoints; i++) {
        const t = i / numPoints;

        // Base point along the line
        const baseX = start[0] + dx * t;
        const baseY = start[1] + dy * t;

        // Add perpendicular wobble (hand-drawn effect)
        const wobble = (Math.random() - 0.5) * wobbleAmount;

        // Also add some in-line wobble (varying speed of pen)
        const speedWobble = (Math.random() - 0.5) * wobbleAmount * 0.3;

        const pointX = baseX + perpX * wobble + (dx / length) * speedWobble;
        const pointY = baseY + perpY * wobble + (dy / length) * speedWobble;

        points.push([pointX, pointY]);
    }

    // Add the end point
    points.push(end);

    // Create a smooth path from the points
    const pathGenerator = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveBasis);

    return pathGenerator(points);
}

/**
 * Create a set of directional scribble patterns with the given colors
 * Each pattern uses a different scribble direction for visual variety
 * 
 * @param {Object} defs - D3 selection of SVG defs element
 * @param {Array} colors - Array of colors to create patterns for
 * @returns {Array} Array of pattern references to use as fills
 */
export function createScribblePatternSet(defs, colors) {
    // Directions to use for different patterns (create visual variety)
    const directions = [0, 45, 90, 135, 30, 60, 120, 150];

    return colors.map((color, index) => {
        // Select a direction from the array
        const direction = directions[index % directions.length];

        // Vary the density slightly
        const density = 6 + Math.floor(Math.random() * 5);

        return createDirectionalScribblePattern(
            defs,
            `scribble-pattern-${index}`,
            color,
            density,
            120,
            120,
            direction
        );
    });
}

/**
 * Add watercolor texture to a pattern
 * Creates organic looking splotches and blooms for a painted look
 * 
 * @param {Object} pattern - D3 selection of SVG pattern element
 * @param {Number} width - Pattern width
 * @param {Number} height - Pattern height
 * @param {String} color - Base color
 * @param {Number} numBlobs - Number of watercolor blobs to add
 */
function addWatercolorTexture(pattern, width, height, color, numBlobs = 3) {
    for (let i = 0; i < numBlobs; i++) {
        // Create a blob with lighter/darker variation of the base color
        const blobColor = adjustColor(color, -20 + Math.random() * 40, 0.1 + Math.random() * 0.2);

        // Random position and size
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const rx = 15 + Math.random() * 30;
        const ry = 15 + Math.random() * 30;

        // Create a watercolor blob (irregular ellipse)
        const blobPath = createWatercolorBlob(cx, cy, rx, ry);

        pattern.append('path')
            .attr('d', blobPath)
            .attr('fill', blobColor)
            .attr('fill-opacity', 0.15 + Math.random() * 0.2)
            .attr('stroke', 'none');
    }
}

/**
 * Create an oil paint texture pattern 
 * This technique focuses on watercolor-like textures with directional brush strokes
 * but without any cross-hatched patterns
 * 
 * @param {Object} defs - D3 selection of SVG defs element
 * @param {String} id - Unique pattern ID
 * @param {String} color - Base color for the pattern
 * @returns {String} Pattern ID reference to use as fill
 */
export function createOilPaintPattern(defs, id, color) {
    const patternId = id || `oil-paint-${Math.random().toString(36).substr(2, 9)}`;

    // Create a pattern with dimensions that work well for oil paint textures
    const pattern = defs.append('pattern')
        .attr('id', patternId)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 120)
        .attr('height', 120);

    // Add base color with texture
    pattern.append('rect')
        .attr('width', 120)
        .attr('height', 120)
        .attr('fill', color)
        .attr('fill-opacity', 0.4);

    // First layer - large watercolor blobs
    for (let i = 0; i < 6; i++) {
        // Create color variations for richness
        // Some darker, some lighter, some with different saturation
        const colorShift = Math.random() < 0.5 ? -20 : 15;
        const saturationShift = Math.random() < 0.3 ? -0.15 : 0.1;
        const blobColor = adjustColor(color, colorShift, saturationShift);

        const cx = Math.random() * 120;
        const cy = Math.random() * 120;
        const rx = 25 + Math.random() * 50;
        const ry = 20 + Math.random() * 40;

        pattern.append('path')
            .attr('d', createWatercolorBlob(cx, cy, rx, ry))
            .attr('fill', blobColor)
            .attr('fill-opacity', 0.2 + Math.random() * 0.3)
            .attr('stroke', 'none');
    }

    // Second layer - medium watercolor blobs
    for (let i = 0; i < 8; i++) {
        const isHighlight = Math.random() < 0.3;
        const colorShift = isHighlight ? 25 : -15;
        const blobColor = adjustColor(color, colorShift, isHighlight ? 0.1 : -0.1);

        const cx = Math.random() * 120;
        const cy = Math.random() * 120;
        const rx = 10 + Math.random() * 30;
        const ry = 8 + Math.random() * 25;

        pattern.append('path')
            .attr('d', createWatercolorBlob(cx, cy, rx, ry))
            .attr('fill', blobColor)
            .attr('fill-opacity', 0.15 + Math.random() * 0.25)
            .attr('stroke', 'none');
    }

    // Third layer - small details with highlights and shadows
    for (let i = 0; i < 12; i++) {
        // Determine if this is a highlight or shadow detail
        const isHighlight = Math.random() < 0.4;
        const colorShift = isHighlight ? 35 : -25;
        const blobColor = adjustColor(color, colorShift, isHighlight ? 0.15 : -0.1);

        const cx = Math.random() * 120;
        const cy = Math.random() * 120;
        const rx = 4 + Math.random() * 12;
        const ry = 3 + Math.random() * 10;

        pattern.append('path')
            .attr('d', createWatercolorBlob(cx, cy, rx, ry))
            .attr('fill', blobColor)
            .attr('fill-opacity', isHighlight ? (0.2 + Math.random() * 0.3) : (0.1 + Math.random() * 0.2))
            .attr('stroke', 'none');
    }

    // Add some directional brush strokes (not cross-hatched)
    // Choose a single direction for consistency
    const direction = Math.random() < 0.5 ? 0 : 90; // Either horizontal or vertical
    const angleRad = (direction * Math.PI) / 180;

    // Create brush strokes in the chosen direction
    for (let i = 0; i < 6; i++) {
        // Calculate the position for this brush stroke
        const offset = (i - 2.5) * 20; // Space them out evenly

        // Determine start and end points based on direction
        let startX, startY, endX, endY;
        if (direction === 0) {
            // Horizontal strokes
            startX = 0;
            endX = 120;
            startY = endY = 60 + offset;
        } else {
            // Vertical strokes
            startX = endX = 60 + offset;
            startY = 0;
            endY = 120;
        }

        // Add some randomness to make it less uniform
        startX += (Math.random() - 0.5) * 15;
        startY += (Math.random() - 0.5) * 15;
        endX += (Math.random() - 0.5) * 15;
        endY += (Math.random() - 0.5) * 15;

        // Create a brush stroke path
        const strokeColor = adjustColor(color, -10 + Math.random() * 20, 0);
        const strokePath = generateBrushStroke([startX, startY], [endX, endY], 120, 120);

        pattern.append('path')
            .attr('d', strokePath)
            .attr('stroke', strokeColor)
            .attr('stroke-width', 2 + Math.random() * 4)
            .attr('stroke-opacity', 0.1 + Math.random() * 0.2)
            .attr('stroke-linecap', 'round')
            .attr('fill', 'none');
    }

    return `url(#${patternId})`;
}

/**
 * Generate a brush stroke path that looks like a hand-drawn line
 * This creates a hand-drawn looking stroke with natural variations
 * 
 * @param {Array} start - Starting point [x, y]
 * @param {Array} end - End point [x, y]
 * @param {Number} width - Pattern width (for boundary checks)
 * @param {Number} height - Pattern height (for boundary checks)
 * @returns {String} SVG path string
 */
function generateBrushStroke(start, end, width, height) {
    // Line parameters
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    // Calculate number of points based on line length
    const numPoints = Math.max(8, Math.min(20, Math.floor(length / 15)));

    // Generate points along the line with natural hand-drawn wobble
    const points = [];
    const wobbleAmount = 3 + Math.random() * 3; // Amount of perpendicular wobble

    // Direction perpendicular to the line
    const perpX = -dy / length;
    const perpY = dx / length;

    // Add the starting point
    points.push(start);

    // Add intermediate points
    for (let i = 1; i < numPoints; i++) {
        const t = i / numPoints;

        // Base point along the line
        const baseX = start[0] + dx * t;
        const baseY = start[1] + dy * t;

        // Add perpendicular wobble (hand-drawn effect)
        const wobble = (Math.random() - 0.5) * wobbleAmount;

        // Also add some in-line wobble (varying speed of pen)
        const speedWobble = (Math.random() - 0.5) * wobbleAmount * 0.3;

        const pointX = baseX + perpX * wobble + (dx / length) * speedWobble;
        const pointY = baseY + perpY * wobble + (dy / length) * speedWobble;

        points.push([pointX, pointY]);
    }

    // Add the end point
    points.push(end);

    // Create a smooth path from the points
    const pathGenerator = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveBasis);

    return pathGenerator(points);
}

/**
 * Create a set of oil paint patterns
 * @param {Object} defs - D3 selection of SVG defs element
 * @param {Array} colors - Array of colors to create patterns for
 * @returns {Array} Array of pattern fill references
 */
export function createOilPaintPatternSet(defs, colors) {
    return colors.map((color, index) => {
        return createOilPaintPattern(
            defs,
            `oil-paint-${index}`,
            color
        );
    });
}

/**
 * Create an irregular blob shape that resembles a watercolor splotch
 */
function createWatercolorBlob(cx, cy, rx, ry) {
    const numPoints = 12; // Number of points around the ellipse
    let points = [];

    // Generate points around an ellipse with randomized distances
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;

        // Random radius variation to create irregular blob effect
        const radiusVariation = 0.7 + Math.random() * 0.6;

        const x = cx + Math.cos(angle) * rx * radiusVariation;
        const y = cy + Math.sin(angle) * ry * radiusVariation;

        points.push([x, y]);
    }

    // Close the path
    points.push(points[0]);

    // Create a curved path from the points
    const lineGenerator = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveBasisClosed);

    return lineGenerator(points);
}

/**
 * Adjust a color's brightness and saturation
 * @param {String} color - CSS color string
 * @param {Number} brightnessDelta - Amount to adjust brightness (-100 to 100)
 * @param {Number} saturationDelta - Amount to adjust saturation (-1 to 1)
 * @returns {String} Adjusted color
 */
function adjustColor(color, brightnessDelta = 0, saturationDelta = 0) {
    // Create a temporary element to compute RGB values
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);

    // Get computed RGB values
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    // Parse RGB components
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) {
        // Fallback if parsing fails
        return color;
    }

    // Extract RGB values
    let r = parseInt(rgbMatch[1], 10);
    let g = parseInt(rgbMatch[2], 10);
    let b = parseInt(rgbMatch[3], 10);

    // Convert RGB to HSL
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    // Adjust saturation and lightness
    s = Math.max(0, Math.min(1, s + saturationDelta));
    l = Math.max(0, Math.min(1, l + brightnessDelta / 100));

    // Convert back to RGB
    let r1, g1, b1;

    if (s === 0) {
        r1 = g1 = b1 = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r1 = hue2rgb(p, q, h + 1 / 3);
        g1 = hue2rgb(p, q, h);
        b1 = hue2rgb(p, q, h - 1 / 3);
    }

    // Convert back to 0-255 range
    r = Math.round(r1 * 255);
    g = Math.round(g1 * 255);
    b = Math.round(b1 * 255);

    return `rgb(${r}, ${g}, ${b})`;
}