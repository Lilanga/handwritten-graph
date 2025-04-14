/**
 * Hand-drawn pie chart library using D3.js
 * This creates pie charts with a hand-drawn aesthetic
 * and tooltips that appear when hovering over segments
 */
import * as d3 from 'd3';
import './styles/graph.scss';
import XkcdTooltip from './XkcdTooltip';
import { createHandDrawnRect, createXkcdFilter } from './handDrawnUtils';
import { createScribblePatternSet, createOilPaintPatternSet } from './scribbleFills';

// Default configuration
const defaultConfig = {
    width: 600,           // Increased default width to accommodate legend
    height: 400,          // Default height
    margin: { top: 20, right: 150, bottom: 20, left: 20 }, // Right margin increased for legend
    innerRadius: 0,       // Set > 0 for a donut chart
    padAngle: 0.02,
    cornerRadius: 3,
    fontFamily: 'xkcd',   // Default font family
    handDrawnEffect: true, // Toggle for hand-drawn effect
    handDrawnJitter: 2,   // Amount of jitter for hand-drawn effect
    strokeLinecap: 'round', // Rounded line caps for hand-drawn effect
    strokeLinejoin: 'round', // Rounded line joins for hand-drawn effect
    tooltipBgColor: '#fff', // Tooltip background color
    tooltipTextColor: '#333', // Tooltip text color
    tooltipBorderColor: '#333', // Tooltip border color
    tooltipBorderWidth: 2, // Tooltip border width
    tooltipBorderRadius: 5, // Tooltip border radius
    tooltipOpacity: 0.9,  // Tooltip background opacity
    legendBorder: true,   // Show border around legend by default
    valueFormat: d => d3.format('.1f')(d), // Format for values
    useScribbleFill: true, // Use scribble fill patterns instead of solid colors
    fillStyle: 'directional' // Type of fill: 'directional', 'oilpaint'
};

/**
 * Add hand-drawn jitter to an SVG arc
 * @param {Object} d - Data object for the arc
 * @param {Function} arc - D3 arc generator function
 * @param {Number} jitter - Amount of jitter to add
 * @returns {String} Jittered path string
 */
function handDrawnArc(d, arc, jitter) {
    const originalPath = arc(d);

    // Create temp SVG to get points along the path
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', originalPath);
    tempSvg.appendChild(path);
    document.body.appendChild(tempSvg);

    const length = path.getTotalLength();
    const numPoints = Math.max(20, Math.floor(length / 5)); // More points for longer arcs
    let points = [];

    // Sample points along the path
    for (let i = 0; i <= numPoints; i++) {
        const point = path.getPointAtLength(length * i / numPoints);

        // Add random jitter
        point.x += (Math.random() - 0.5) * jitter;
        point.y += (Math.random() - 0.5) * jitter;

        points.push(point);
    }

    // Clean up temporary SVG
    document.body.removeChild(tempSvg);

    // Create a new line generator for the jittered points
    const handDrawnLine = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasisClosed); // Use a closed curve to connect back

    return handDrawnLine(points);
}

/**
 * Create handwritten-style pie chart
 * @param {String} selector - CSS selector for container element
 * @param {Object} data - Chart data with labels and values
 * @param {Object} config - Chart configuration
 * @returns {Function} Cleanup function
 */
export function createPieChart(selector, data, config = {}) {
    const settings = { ...defaultConfig, ...config };
    const {
        width, height, margin, innerRadius, padAngle, cornerRadius,
        fontFamily, handDrawnEffect, handDrawnJitter,
        strokeLinecap, strokeLinejoin, tooltipBgColor, tooltipTextColor,
        tooltipBorderColor, tooltipBorderWidth, tooltipBorderRadius,
        tooltipOpacity, legendBorder, valueFormat, useScribbleFill, fillStyle
    } = settings;

    // Calculate radius based on available space
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2 - margin.right / 2 + margin.left / 2}, ${height / 2})`);

    // Create SVG defs for filters
    const defs = svg.append('defs');

    // Add xkcdify filter if hand-drawn effect is enabled
    if (handDrawnEffect) {
        createXkcdFilter(defs);
    }

    // Create pie layout
    const pie = d3.pie()
        .value(d => d.value)
        .padAngle(padAngle)
        .sort(null); // Don't sort, use order given in data

    // Generate colors if not provided in data
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Process data, ensuring colors are assigned
    const processedData = data.map((d, i) => ({
        label: d.label,
        value: d.value,
        color: d.color || color(i)
    }));

    // Create scribble pattern fills if enabled
    let fillPatterns = [];
    if (useScribbleFill) {
        // Extract all colors
        const colors = processedData.map(d => d.color);

        // Generate pattern definitions
        if (fillStyle === 'oilpaint') {
            fillPatterns = createOilPaintPatternSet(defs, colors);
        } else {
            fillPatterns = createScribblePatternSet(defs, colors);
        }
    }

    // Create arc generator
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .cornerRadius(cornerRadius);

    // Create arcs
    const arcs = svg.selectAll('.arc')
        .data(pie(processedData))
        .enter()
        .append('g')
        .attr('class', 'arc');

    // Add path for each arc
    arcs.append('path')
        .attr('d', d => {
            if (handDrawnEffect) {
                return handDrawnArc(d, arc, handDrawnJitter);
            } else {
                return arc(d);
            }
        })
        .attr('fill', (d, i) => {
            if (useScribbleFill && fillPatterns.length > 0) {
                return fillPatterns[i % fillPatterns.length];
            } else {
                return d.data.color;
            }
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-linecap', strokeLinecap)
        .attr('stroke-linejoin', strokeLinejoin)
        .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);

    // Calculate total for percentage
    const total = d3.sum(processedData, d => d.value);

    // Add Legend
    const legendGroup = svg.append('g')
        .attr('class', 'legend');

    // Calculate total height needed for the legend
    const legendItemHeight = processedData.length > 6 ? 16 : 20; // Reduce item height for many items
    const legendTotalHeight = processedData.length * legendItemHeight + 10;

    // Calculate approximate legend width - with a more accurate character width estimate
    // and ensuring minimum and maximum constraints
    const avgCharWidth = 6; // Average character width in pixels
    const maxLabelLength = d3.max(processedData, d => d.label.length);
    const percentageWidth = 40; // Width needed for the percentage part
    const colorSquareWidth = 25; // Width for color square and padding

    const calculatedWidth = Math.min(
        250, // Maximum width
        Math.max(
            100, // Minimum width
            maxLabelLength * avgCharWidth + percentageWidth + colorSquareWidth
        )
    );

    const legendWidth = calculatedWidth;

    // Position legend to the right of the pie chart, outside the pie area
    const legendX = radius + 30; // Position to the right of the pie with some padding
    const legendY = -legendTotalHeight / 2; // Center vertically

    // Set legend position
    legendGroup.attr('transform', `translate(${legendX}, ${legendY})`);

    // Create legend background if border is enabled
    if (legendBorder) {
        // Add generous padding to ensure the border surrounds all text completely
        const borderPadding = {
            left: 10,
            right: 15,
            top: 8,
            bottom: 8
        };

        const borderWidth = legendWidth + borderPadding.left + borderPadding.right;
        const borderHeight = legendTotalHeight + borderPadding.top + borderPadding.bottom;

        legendGroup.append('path')
            .attr('d', createHandDrawnRect(
                -borderPadding.left,
                -borderPadding.top,
                borderWidth,
                borderHeight,
                handDrawnJitter
            ))
            .attr('fill', tooltipBgColor)
            .attr('fill-opacity', tooltipOpacity)
            .attr('stroke', tooltipBorderColor)
            .attr('stroke-width', tooltipBorderWidth)
            .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);
    }

    // Add legend entries
    processedData.forEach((d, i) => {
        // Calculate legend item position
        const itemY = i * legendItemHeight;

        const legendEntry = legendGroup.append('g')
            .attr('transform', `translate(0, ${itemY})`);

        legendEntry.append('rect')
            .attr('x', handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
            .attr('y', handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
            .attr('width', 8)
            .attr('height', 8)
            .attr('fill', useScribbleFill && fillPatterns.length > 0 ? fillPatterns[i % fillPatterns.length] : d.color)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);

        // Calculate maximum label length based on available width
        const maxChars = Math.max(10, Math.min(30, Math.floor((legendWidth - 50) / 6)));

        // Truncate long labels if necessary
        let label = d.label;
        if (label.length > maxChars) {
            label = label.substring(0, maxChars - 3) + '...';
        }

        // Format the percentage
        const percentage = ((d.value / total) * 100).toFixed(1);
        const displayText = `${label} (${percentage}%)`;

        // Add the text with adaptive font size if necessary
        const textElement = legendEntry.append('text')
            .attr('x', 15 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
            .attr('y', 8 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
            .text(displayText)
            .style('font-family', fontFamily)
            .style('fill', tooltipTextColor)
            .attr('alignment-baseline', 'middle');

        // Set font size - smaller for charts with limited space or many items
        const fontSize = processedData.length > 6 || legendWidth < 120 ? 12 : 14;
        textElement.style('font-size', `${fontSize}px`);
    });

    // Create tooltip instance (initially hidden)
    let tooltip = null;

    // Add hover events to the arcs
    arcs.on('mouseover', function (event, d) {
        // Slightly pull out the segment when hovered
        d3.select(this).transition()
            .duration(200)
            .attr('transform', function () {
                // Calculate center of arc to determine direction to pull
                const centroid = arc.centroid(d);
                const angle = Math.atan2(centroid[1], centroid[0]);
                const x = Math.cos(angle) * 10;
                const y = Math.sin(angle) * 10;
                return `translate(${x}, ${y})`;
            });

        // Create tooltip if it doesn't exist, otherwise update it
        const percentage = ((d.data.value / total) * 100).toFixed(1);
        const tooltipItems = [{
            color: d.data.color,
            text: `Value: ${valueFormat(d.data.value)}`
        }, {
            color: d.data.color,
            text: `Percentage: ${percentage}%`
        }];

        // Get mouse position relative to the chart
        const svgNode = svg.node();
        const svgRect = svgNode.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left - width / 2;
        const mouseY = event.clientY - svgRect.top - height / 2;

        if (!tooltip) {
            tooltip = new XkcdTooltip({
                parent: svg,
                title: d.data.label,
                items: tooltipItems,
                position: {
                    type: 'auto',
                    x: mouseX,
                    y: mouseY
                },
                unxkcdify: !handDrawnEffect,
                backgroundColor: tooltipBgColor,
                strokeColor: tooltipBorderColor,
                fontFamily,
                chartWidth: width,
                chartHeight: height
            });
            tooltip.show();
        } else {
            tooltip.update({
                title: d.data.label,
                items: tooltipItems,
                position: {
                    type: 'auto',
                    x: mouseX,
                    y: mouseY
                }
            });
            tooltip.show();
        }
    })
        .on('mousemove', function (event) {
            // Update tooltip position
            if (tooltip) {
                // Get mouse position relative to the chart
                const svgNode = svg.node();
                const svgRect = svgNode.getBoundingClientRect();
                const mouseX = event.clientX - svgRect.left - width / 2;
                const mouseY = event.clientY - svgRect.top - height / 2;

                tooltip.update({
                    position: {
                        type: 'auto',
                        x: mouseX,
                        y: mouseY
                    }
                });
            }
        })
        .on('mouseout', function () {
            // Reset segment position
            d3.select(this).transition()
                .duration(200)
                .attr('transform', 'translate(0, 0)');

            // Hide tooltip
            if (tooltip) {
                tooltip.hide();
            }
        });

    // Return a cleanup function to remove tooltip elements when chart is destroyed
    return function cleanup() {
        if (tooltip) {
            tooltip.svg.remove();
        }
    };
}