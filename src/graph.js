// Import D3.js
import * as d3 from 'd3';
import './styles/graph.scss';

// Default configuration
const defaultConfig = {
  width: 960,
  height: 500,
  margin: { top: 10, right: 10, bottom: 40, left: 50 },
  jitter: 1.9,
  lineColor: 'steelblue', // Default line color
  pointRadius: 4,
  fontFamily: 'xkcd', // Default font family
};

// Create handwritten-style line graph
export function createGraph(selector, data, config = {}) {
  const settings = { ...defaultConfig, ...config };
  const { width, height, margin, pointRadius } = settings;

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

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-family', settings.fontFamily);

  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .selectAll('text')
    .style('font-family', settings.fontFamily); 

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

    const line = d3.line()
      .x((d, i) => x(data.labels[i]))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(dataset.data)
      .attr('class', 'line')
      .attr('d', line)
      .attr('stroke', lineColor) // Ensure the correct color is applied
      .attr('fill', 'none')
      .attr('stroke-width', 3);

    // Add data points
    svg.selectAll(`.dot-${index}`)
      .data(dataset.data)
      .enter().append('circle')
      .attr('cx', (d, i) => x(data.labels[i]))
      .attr('cy', d => y(d))
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

    // Add legend entries
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', index * 20)
      .attr('r', 5)
      .attr('fill', lineColor); // Ensure legend color matches the dataset

    legend.append('text')
      .attr('x', 10)
      .attr('y', index * 20 + 5)
      .text(dataset.label)
      .style('font-size', '14px')
      .attr('alignment-baseline', 'middle');
  });
}