/**
 * Utility functions for creating hand-drawn chart elements
 */
import * as d3 from 'd3';

/**
 * Creates a hand-drawn effect by adding jitter to a path
 * @param {String} pathString - SVG path string to modify
 * @param {Number} jitterAmount - Amount of jitter to add
 * @param {Number} numPoints - Number of points to sample along the path
 * @returns {String} The new path string with hand-drawn effect
 */
export function addHandDrawnEffect(pathString, jitterAmount = 2, numPoints = 100) {
    // Create a temporary SVG path element to get points along the path
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathString);
    tempSvg.appendChild(path);
    document.body.appendChild(tempSvg);

    const length = path.getTotalLength();
    let handDrawnPoints = [];

    // Sample points along the path
    for (let i = 0; i <= numPoints; i++) {
        const point = path.getPointAtLength(length * i / numPoints);

        // Add random jitter
        point.x += (Math.random() - 0.5) * jitterAmount;
        point.y += (Math.random() - 0.5) * jitterAmount;

        handDrawnPoints.push(point);
    }

    // Clean up temporary SVG
    document.body.removeChild(tempSvg);

    // Create a new line generator for the jittered points
    const handDrawnLine = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasis); // Use a basis curve for smoothing

    return handDrawnLine(handDrawnPoints);
}

/**
 * Create a hand-drawn rectangle SVG path
 * @param {Number} x - X position
 * @param {Number} y - Y position
 * @param {Number} width - Rectangle width
 * @param {Number} height - Rectangle height
 * @param {Number} jitter - Amount of jitter to add
 * @returns {String} The hand-drawn rectangle path string
 */
export function createHandDrawnRect(x, y, width, height, jitter = 2) {
    // Define the corners
    const topLeft = { x: x, y: y };
    const topRight = { x: x + width, y: y };
    const bottomRight = { x: x + width, y: y + height };
    const bottomLeft = { x: x, y: y + height };

    // Add jitter to each line segment
    const numPoints = 20; // Points per side
    let points = [];

    // Add points for top edge
    for (let i = 0; i <= numPoints; i++) {
        const point = {
            x: topLeft.x + (topRight.x - topLeft.x) * (i / numPoints),
            y: topLeft.y + (Math.random() - 0.5) * jitter
        };
        points.push(point);
    }

    // Add points for right edge
    for (let i = 0; i <= numPoints; i++) {
        const point = {
            x: topRight.x + (Math.random() - 0.5) * jitter,
            y: topRight.y + (bottomRight.y - topRight.y) * (i / numPoints)
        };
        points.push(point);
    }

    // Add points for bottom edge
    for (let i = 0; i <= numPoints; i++) {
        const point = {
            x: bottomRight.x - (bottomRight.x - bottomLeft.x) * (i / numPoints),
            y: bottomRight.y + (Math.random() - 0.5) * jitter
        };
        points.push(point);
    }

    // Add points for left edge
    for (let i = 0; i <= numPoints; i++) {
        const point = {
            x: bottomLeft.x + (Math.random() - 0.5) * jitter,
            y: bottomLeft.y - (bottomLeft.y - topLeft.y) * (i / numPoints)
        };
        points.push(point);
    }

    // Close the path
    points.push(points[0]);

    // Create a path from the points
    const pathGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasisClosed);

    return pathGenerator(points);
}

/**
 * Create an xkcdify SVG filter for hand-drawn effect
 * @param {Object} defs - D3 selection of SVG defs element
 */
export function createXkcdFilter(defs) {
    const filter = defs.append('filter')
        .attr('id', 'xkcdify');

    filter.append('feTurbulence')
        .attr('type', 'fractalNoise')
        .attr('baseFrequency', '0.05')
        .attr('numOctaves', '1')
        .attr('seed', '0');

    filter.append('feDisplacementMap')
        .attr('scale', '3')
        .attr('xChannelSelector', 'R')
        .attr('yChannelSelector', 'G')
        .attr('in', 'SourceGraphic');
}

/**
 * Create a hand-drawn circle SVG path
 * @param {Number} cx - Center X position
 * @param {Number} cy - Center Y position
 * @param {Number} radius - Circle radius
 * @param {Number} jitter - Amount of jitter to add
 * @returns {String} The hand-drawn circle path string
 */
export function createHandDrawnCircle(cx, cy, radius, jitter = 2) {
    const numPoints = 40; // Points around the circle
    let points = [];

    // Generate points around the circle with jitter
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const jitterAmount = (Math.random() - 0.5) * jitter;
        const adjustedRadius = radius + jitterAmount;
        
        const point = {
            x: cx + Math.cos(angle) * adjustedRadius,
            y: cy + Math.sin(angle) * adjustedRadius
        };
        
        points.push(point);
    }

    // Close the path
    points.push(points[0]);

    // Create a path from the points
    const pathGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasisClosed);

    return pathGenerator(points);
}