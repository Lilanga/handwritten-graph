// Import D3.js
import * as d3 from 'd3';
import './styles/graph.scss';

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
  strokeLinejoin: 'round' // Rounded line joins for hand-drawn effect
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

// Create handwritten-style line graph
export function createGraph(selector, data, config = {}) {
  const settings = { ...defaultConfig, ...config };
  const { 
    width, height, margin, pointRadius, fontFamily, gridColor, 
    handDrawnEffect, handDrawnPoints, handDrawnJitter,
    strokeLinecap, strokeLinejoin
  } = settings;

  const x = d3.scalePoint()
    .domain(data.labels)
    .range([0, width]);

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

  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('background', '#fff')
    .style('padding', '5px')
    .style('border', '1px solid #000')
    .style('border-radius', '5px')
    .style('visibility', 'hidden');

  // Add legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 150}, 20)`);

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
      .attr('cx', (d, i) => {
        const baseX = x(data.labels[i]);
        return handDrawnEffect ? baseX + (Math.random() - 0.5) * (handDrawnJitter / 2) : baseX;
      })
      .attr('cy', d => {
        const baseY = y(d);
        return handDrawnEffect ? baseY + (Math.random() - 0.5) * (handDrawnJitter / 2) : baseY;
      })
      .attr('r', pointRadius)
      .attr('fill', lineColor) // Ensure dot color matches the line
      .on('mouseover', (event, d) => {
        tooltip.style('visibility', 'visible')
          .text(d)
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

    // Add legend entries with slight position randomization for hand-drawn effect
    legend.append('circle')
      .attr('cx', handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
      .attr('cy', index * 20 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
      .attr('r', 5)
      .attr('fill', lineColor);

    legend.append('text')
      .attr('x', 10 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
      .attr('y', index * 20 + 5 + (handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
      .text(dataset.label)
      .style('font-size', '14px')
      .style('font-family', fontFamily)
      .attr('alignment-baseline', 'middle');
  });
}