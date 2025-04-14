/**
 * Hand-drawn line graph library using D3.js
 * This library creates line graphs with a hand-drawn aesthetic
 * and multi-series tooltips that appear when hovering over X-axis points
 */
import * as d3 from 'd3';
import './styles/graph.scss';
import XkcdTooltip from './XkcdTooltip';
import { addHandDrawnEffect, createXkcdFilter } from './handDrawnUtils';

// Default configuration
const defaultConfig = {
  width: 960,
  height: 500,
  margin: { top: 10, right: 10, bottom: 40, left: 50 },
  jitter: 1.9, // Jitter amount for hand-drawn effect
  lineColor: 'steelblue', // Default line color
  pointRadius: 4,
  fontFamily: 'xkcd', // Default font family
  gridColor: '#e0e0e0', // Light grid lines
  handDrawnEffect: true, // Toggle for hand-drawn effect
  handDrawnPoints: 100, // Number of points to sample for hand-drawn effect
  handDrawnJitter: 2, // Amount of jitter for hand-drawn effect
  strokeLinecap: 'round', // Rounded line caps for hand-drawn effect
  strokeLinejoin: 'round', // Rounded line joins for hand-drawn effect
  tooltipBgColor: '#fff', // Tooltip background color
  tooltipTextColor: '#333', // Tooltip text color
  tooltipBorderColor: '#333', // Tooltip border color
  tooltipBorderWidth: 2, // Tooltip border width
  tooltipBorderRadius: 5, // Tooltip border radius
  tooltipOpacity: 0.9, // Tooltip background opacity
  legendBorder: false // Whether to show border around legend
};

/**
 * Create handwritten-style line graph
 * @param {String} selector - CSS selector for container element
 * @param {Object} data - Chart data with labels and datasets
 * @param {Object} config - Chart configuration
 * @returns {Function} Cleanup function
 */
export function createGraph(selector, data, config = {}) {
  const settings = { ...defaultConfig, ...config };
  const {
    width, height, margin, pointRadius, fontFamily, gridColor,
    handDrawnEffect, handDrawnPoints, handDrawnJitter,
    strokeLinecap, strokeLinejoin, tooltipBgColor, tooltipTextColor,
    tooltipBorderColor, tooltipBorderWidth, tooltipBorderRadius,
    tooltipOpacity, legendBorder
  } = settings;

  const x = d3.scalePoint()
    .domain(data.labels)
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data.datasets.flatMap(dataset => dataset.data)) * 1.2])
    .range([height, 0]);

  const svg = d3.select(selector)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Add grid lines with slightly wavy lines for hand-drawn effect
  const gridLinesX = d3.axisBottom(x)
    .tickSize(-height)
    .tickFormat("");

  const gridLinesY = d3.axisLeft(y)
    .tickSize(-width)
    .tickFormat("");

  svg.append("g")
    .attr("class", "grid grid-x")
    .attr("transform", `translate(0, ${height})`)
    .call(gridLinesX)
    .selectAll("line")
    .attr("stroke", gridColor)
    .attr("stroke-opacity", 0.5)
    .attr("stroke-dasharray", handDrawnEffect ? "5,3" : "none"); // Dashed lines for hand-drawn effect

  svg.append("g")
    .attr("class", "grid grid-y")
    .call(gridLinesY)
    .selectAll("line")
    .attr("stroke", gridColor)
    .attr("stroke-opacity", 0.5)
    .attr("stroke-dasharray", handDrawnEffect ? "5,3" : "none"); // Dashed lines for hand-drawn effect

  // Apply hand-drawn style to axes
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  svg.append('g')
    .attr('class', 'x axis hand-drawn-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-family', fontFamily);

  svg.append('g')
    .attr('class', 'y axis hand-drawn-axis')
    .call(yAxis)
    .selectAll('text')
    .style('font-family', fontFamily);

  // Style the axis paths to look hand-drawn
  if (handDrawnEffect) {
    svg.selectAll(".hand-drawn-axis path")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin);
  }

  // Create SVG defs for filters
  const defs = svg.append('defs');

  // Add xkcdify filter if hand-drawn effect is enabled
  if (handDrawnEffect) {
    createXkcdFilter(defs);
  }

  // Add legend with no outer border
  const legendGroup = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 150}, 20)`);

  // Create legend background if border is enabled
  if (legendBorder) {
    legendGroup.append('rect')
      .attr('fill', tooltipBgColor)
      .attr('fill-opacity', tooltipOpacity)
      .attr('stroke', tooltipBorderColor)
      .attr('stroke-width', tooltipBorderWidth)
      .attr('rx', tooltipBorderRadius)
      .attr('ry', tooltipBorderRadius)
      .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null)
      .attr('width', 120)
      .attr('height', (data.datasets.length * 20) + 10);
  }

  // Create hover overlay for each X point
  const hoverAreas = svg.append('g')
    .attr('class', 'hover-areas');

  // Create hover line
  const hoverLine = svg.append('line')
    .attr('class', 'hover-line')
    .style('opacity', 0);

  data.labels.forEach((label, i) => {
    const xPos = x(label);

    hoverAreas.append('rect')
      .attr('class', 'hover-area')
      .attr('x', xPos - (width / data.labels.length) / 2)
      .attr('y', 0)
      .attr('width', width / data.labels.length)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('data-index', i)
      .attr('data-label', label);
  });

  data.datasets.forEach((dataset, index) => {
    const lineColor = dataset.lineColor || settings.lineColor;

    // Create the line generator
    const line = d3.line()
      .x((d, i) => x(data.labels[i]))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    // Get the path string for the line
    const pathString = line(dataset.data);

    // Create the path element
    const pathElement = svg.append('path')
      .datum(dataset.data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 3);

    // Apply hand-drawn effect if enabled
    if (handDrawnEffect) {
      const handDrawnPath = addHandDrawnEffect(
        pathString,
        handDrawnJitter,
        handDrawnPoints
      );

      pathElement
        .attr('d', handDrawnPath)
        .attr('stroke-linecap', strokeLinecap)
        .attr('stroke-linejoin', strokeLinejoin);
    } else {
      pathElement.attr('d', pathString);
    }

    // Add data points with slight position randomization for hand-drawn effect
    svg.selectAll(`.dot-${index}`)
      .data(dataset.data)
      .enter().append('circle')
      .attr('class', `dot dot-${index}`)
      .attr('cx', (d, i) => {
        const baseX = x(data.labels[i]);
        return handDrawnEffect ? baseX + (Math.random() - 0.5) * (handDrawnJitter / 2) : baseX;
      })
      .attr('cy', d => {
        const baseY = y(d);
        return handDrawnEffect ? baseY + (Math.random() - 0.5) * (handDrawnJitter / 2) : baseY;
      })
      .attr('r', pointRadius)
      .attr('fill', lineColor);

    // Add legend entries with slight position randomization for hand-drawn effect
    legendGroup.append('rect')
      .attr('x', handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
      .attr('y', index * 20 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
      .attr('width', 8)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', lineColor)
      .attr('filter', handDrawnEffect ? 'url(#xkcdify)' : null);

    legendGroup.append('text')
      .attr('x', 15 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
      .attr('y', index * 20 + 8 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
      .text(dataset.label)
      .style('font-size', '14px')
      .style('font-family', fontFamily)
      .style('fill', tooltipTextColor)
      .attr('alignment-baseline', 'middle');
  });

  // Create tooltip instance (initially hidden)
  let tooltip = null;

// Add hover events to the hover areas
  hoverAreas.selectAll('.hover-area')
    .on('mouseover', function (event) {
      const index = parseInt(d3.select(this).attr('data-index'));
      const label = data.labels[index];
      const xPos = x(label);

      // Highlight the corresponding data points
      data.datasets.forEach((dataset, datasetIndex) => {
        svg.selectAll(`.dot-${datasetIndex}`)
          .filter((d, di) => di === index)
          .attr('r', pointRadius * 1.5)
          .attr('stroke', '#000')
          .attr('stroke-width', 1);
      });

      // Create tooltip items
      const tooltipItems = data.datasets.map(dataset => ({
        color: dataset.lineColor || settings.lineColor,
        text: `${dataset.label}: ${dataset.data[index]}`
      }));

      // Get the correct mouse position relative to the chart
      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const mouseX = event.clientX - svgRect.left - margin.left;
      const mouseY = event.clientY - svgRect.top - margin.top;

      // Create tooltip if it doesn't exist, otherwise update it
      if (!tooltip) {
        tooltip = new XkcdTooltip({
          parent: svg,
          title: label,
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
          title: label,
          items: tooltipItems,
          position: {
            type: 'auto',
            x: mouseX,
            y: mouseY
          }
        });
        tooltip.show();
      }

      // Draw vertical line at hover position
      hoverLine
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#888')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,3')
        .style('opacity', 1);
    })
    .on('mousemove', function (event) {
      // Update tooltip position to follow mouse
      if (tooltip) {
        // Get mouse position relative to the chart
        const svgNode = svg.node();
        const svgRect = svgNode.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left - margin.left;
        const mouseY = event.clientY - svgRect.top - margin.top;
        
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
      // Hide the tooltip
      if (tooltip) {
        tooltip.hide();
      }

      // Reset the highlighted data points
      svg.selectAll('.dot')
        .attr('r', pointRadius)
        .attr('stroke', 'none');

      // Hide the hover line
      hoverLine.style('opacity', 0);
    });

  // Return a cleanup function to remove tooltip elements when graph is destroyed
  return function cleanup() {
    if (tooltip) {
      tooltip.svg.remove();
    }
  };
}