// Import D3.js
import * as d3 from 'd3';
import './styles/graph.scss';

/**
 * Hand-drawn line graph library using D3.js
 * This library creates line graphs with a hand-drawn aesthetic
 * and multi-series tooltips that appear when hovering over X-axis points
 */

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

// Function to add jitter to a path for hand-drawn effect
function addHandDrawnEffect(pathString, jitterAmount = 2, numPoints = 100) {
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

// XKCD-style tooltip class
class XkcdTooltip {
  /**
   * Create a new XKCD-style tooltip
   * @param {Object} options - Tooltip configuration
   * @param {Object} options.parent - D3 selection of parent element
   * @param {String} options.title - Tooltip title
   * @param {Array} options.items - Array of tooltip items with color and text
   * @param {Object} options.position - Position of tooltip
   * @param {String} options.position.type - Position type (upLeft, upRight, downLeft, downRight)
   * @param {Number} options.position.x - X position
   * @param {Number} options.position.y - Y position
   * @param {Boolean} options.unxkcdify - Whether to disable xkcd filter
   * @param {String} options.backgroundColor - Background color
   * @param {String} options.strokeColor - Stroke color
   */
  constructor({
    parent, title, items, position, unxkcdify, backgroundColor, strokeColor, fontFamily, chartWidth, chartHeight
  }) {
    this.title = title;
    this.items = items;
    this.position = position;
    this.filter = !unxkcdify ? 'url(#xkcdify)' : null;
    this.backgroundColor = backgroundColor;
    this.strokeColor = strokeColor;
    this.fontFamily = fontFamily;
    this.chartWidth = chartWidth;
    this.chartHeight = chartHeight;

    // Create SVG container
    this.svg = parent.append('svg')
      .attr('class', 'xkcd-tooltip')
      .attr('x', this._getUpLeftX())
      .attr('y', this._getUpLeftY())
      .style('visibility', 'hidden')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Create tooltip background
    this.tipBackground = this.svg.append('rect')
      .style('fill', this.backgroundColor)
      .attr('fill-opacity', 0.9)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('filter', this.filter)
      .attr('width', this._getBackgroundWidth())
      .attr('height', this._getBackgroundHeight())
      .attr('x', 5)
      .attr('y', 5);

    // Create tooltip title
    this.tipTitle = this.svg.append('text')
      .style('font-size', 15)
      .style('font-weight', 'bold')
      .style('fill', this.strokeColor)
      .style('font-family', this.fontFamily)
      .attr('x', 15)
      .attr('y', 25)
      .text(title);

    // Create tooltip items
    this.tipItems = items.map((item, i) => {
      const g = this._generateTipItem(item, i);
      return g;
    });
  }

  show() {
    this.svg.style('visibility', 'visible');
  }

  hide() {
    this.svg.style('visibility', 'hidden');
  }

  // Update tooltip position / content
  update({ title, items, position }) {
    if (title && title !== this.title) {
      this.title = title;
      this.tipTitle.text(title);
    }

    if (items && JSON.stringify(items) !== JSON.stringify(this.items)) {
      this.items = items;

      // Remove existing items
      this.tipItems.forEach((g) => g.svg.remove());

      // Create new items
      this.tipItems = this.items.map((item, i) => {
        const g = this._generateTipItem(item, i);
        return g;
      });

      // Update background size
      const maxWidth = Math.max(
        ...this.tipItems.map((item) => item.width),
        this.tipTitle.node().getBBox().width,
      );

      this.tipBackground
        .attr('width', maxWidth + 15)
        .attr('height', this._getBackgroundHeight());
    }

    if (position) {
      this.position = position;
      this.svg.attr('x', this._getUpLeftX());
      this.svg.attr('y', this._getUpLeftY());
    }
  }

  _generateTipItem(item, i) {
    const svg = this.svg.append('svg');

    // Add color square
    svg.append('rect')
      .style('fill', item.color)
      .attr('width', 8)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('filter', this.filter)
      .attr('x', 15)
      .attr('y', 37 + 20 * i);

    // Add item text
    svg.append('text')
      .style('font-size', '15')
      .style('fill', this.strokeColor)
      .style('font-family', this.fontFamily)
      .attr('x', 15 + 12)
      .attr('y', 37 + 20 * i + 8)
      .text(item.text);

    // Calculate dimensions
    const bbox = svg.node().getBBox();
    const width = bbox.width + 15;
    const height = bbox.height + 10;
    
    return {
      svg,
      width,
      height,
    };
  }

  _getBackgroundWidth() {
    const maxItemLength = this.items.reduce(
      (pre, cur) => (pre > cur.text.length ? pre : cur.text.length), 0,
    );
    const maxLength = Math.max(maxItemLength, this.title.length);

    return maxLength * 7.4 + 25;
  }

  _getBackgroundHeight() {
    const rows = this.items.length + 1;
    return rows * 20 + 10;
  }

  _getUpLeftX() {
    const tooltipWidth = this._getBackgroundWidth() + 20;
    
    // Auto-adjust position based on available space
    if (this.position.type === 'auto') {
      // If tooltip would go off the right edge
      if (this.position.x + tooltipWidth > this.chartWidth) {
        return this.position.x - tooltipWidth;
      }
      // Otherwise show to the right of the cursor
      return this.position.x;
    }
    
    // Explicit positioning
    if (this.position.type === 'upRight' || this.position.type === 'downRight') {
      return this.position.x;
    }
    return this.position.x - tooltipWidth;
  }

  _getUpLeftY() {
    const tooltipHeight = this._getBackgroundHeight() + 20;
    
    // Auto-adjust position based on available space
    if (this.position.type === 'auto') {
      // If tooltip would go off the bottom
      if (this.position.y + tooltipHeight > this.chartHeight) {
        return this.position.y - tooltipHeight;
      }
      // Otherwise show below the cursor
      return this.position.y;
    }
    
    // Explicit positioning
    if (this.position.type === 'downLeft' || this.position.type === 'downRight') {
      return this.position.y;
    }
    return this.position.y - tooltipHeight;
  }
}

// Create handwritten-style line graph
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
    .on('mouseover', function(event) {
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
      
      // Create tooltip if it doesn't exist, otherwise update it
      if (!tooltip) {
        tooltip = new XkcdTooltip({
          parent: svg,
          title: label,
          items: tooltipItems,
          position: {
            type: 'auto',
            x: event.pageX - margin.left,
            y: event.pageY - margin.top - 10
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
            x: event.pageX - margin.left,
            y: event.pageY - margin.top - 10
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
    .on('mousemove', function(event) {
      // Update tooltip position to follow mouse
      if (tooltip) {
        tooltip.update({
          position: {
            type: 'auto',
            x: event.pageX - margin.left,
            y: event.pageY - margin.top - 10
          }
        });
      }
    })
    .on('mouseout', function() {
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