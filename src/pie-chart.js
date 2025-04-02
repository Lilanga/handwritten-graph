/**
 * Hand-drawn pie chart library using D3.js
 * This creates pie charts with a hand-drawn aesthetic
 * and tooltips that appear when hovering over segments
 */
import * as d3 from 'd3';
import './styles/graph.scss';
import XkcdTooltip from './XkcdTooltip';
import { createHandDrawnRect, createXkcdFilter } from './handDrawnUtils';

// Default configuration
const defaultConfig = {
    width: 500,
    height: 500,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    innerRadius: 0, // Set > 0 for a donut chart
    padAngle: 0.02,
    cornerRadius: 3,
    jitter: 1.5, // Jitter amount for hand-drawn effect
    fontFamily: 'xkcd', // Default font family
    handDrawnEffect: true, // Toggle for hand-drawn effect
    handDrawnJitter: 2, // Amount of jitter for hand-drawn effect
    strokeLinecap: 'round', // Rounded line caps for hand-drawn effect
    strokeLinejoin: 'round', // Rounded line joins for hand-drawn effect
    tooltipBgColor: '#fff', // Tooltip background color
    tooltipTextColor: '#333', // Tooltip text color
    tooltipBorderColor: '#333', // Tooltip border color
    tooltipBorderWidth: 2, // Tooltip border width
    tooltipBorderRadius: 5, // Tooltip border radius
    tooltipOpacity: 0.9, // Tooltip background opacity
    legendBorder: false, // Whether to show border around legend
    valueFormat: d => d3.format('.1f')(d) // Format for values
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
        jitter, fontFamily, handDrawnEffect, handDrawnJitter,
        strokeLinecap, strokeLinejoin, tooltipBgColor, tooltipTextColor,
        tooltipBorderColor, tooltipBorderWidth, tooltipBorderRadius,
        tooltipOpacity, legendBorder, valueFormat
    } = settings;

    // Calculate radius
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

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
        .attr('fill', d => d.data.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-linecap', strokeLinecap)
        .attr('stroke-linejoin', strokeLinejoin)
        .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);

    // Calculate total for percentage
    const total = d3.sum(processedData, d => d.value);

    // Add Legend
    const legendGroup = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${radius + 20}, ${-radius})`);

    // Create legend background if border is enabled
    if (legendBorder) {
        legendGroup.append('path')
            .attr('d', createHandDrawnRect(0, 0, 150, processedData.length * 20 + 10, handDrawnJitter))
            .attr('fill', tooltipBgColor)
            .attr('fill-opacity', tooltipOpacity)
            .attr('stroke', tooltipBorderColor)
            .attr('stroke-width', tooltipBorderWidth)
            .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);
    }

    // Add legend entries
    processedData.forEach((d, i) => {
        const legendEntry = legendGroup.append('g')
            .attr('transform', `translate(10, ${i * 20 + 15})`);

        legendEntry.append('rect')
            .attr('x', handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
            .attr('y', handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
            .attr('width', 8)
            .attr('height', 8)
            .attr('fill', d.color)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);

        legendEntry.append('text')
            .attr('x', 15 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
            .attr('y', 8 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
            .text(`${d.label} (${((d.value / total) * 100).toFixed(1)}%)`)
            .style('font-size', '14px')
            .style('font-family', fontFamily)
            .style('fill', tooltipTextColor)
            .attr('alignment-baseline', 'middle');
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

        if (!tooltip) {
            tooltip = new XkcdTooltip({
                parent: svg,
                title: d.data.label,
                items: tooltipItems,
                position: {
                    type: 'auto',
                    x: event.offsetX - width / 2,
                    y: event.offsetY - height / 2
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
                    x: event.offsetX - width / 2,
                    y: event.offsetY - height / 2
                }
            });
            tooltip.show();
        }
    })
        .on('mousemove', function (event) {
            // Update tooltip position
            if (tooltip) {
                tooltip.update({
                    position: {
                        type: 'auto',
                        x: event.offsetX - width / 2,
                        y: event.offsetY - height / 2
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