/**
 * XKCD-style tooltip component for D3.js
 * Provides tooltips with hand-drawn styling matching the chart.xkcd library
 */
import * as d3 from 'd3';

class XkcdTooltip {
    /**
     * Create a new XKCD-style tooltip
     * @param {Object} options - Tooltip configuration
     * @param {Object} options.parent - D3 selection of parent element
     * @param {String} options.title - Tooltip title
     * @param {Array} options.items - Array of tooltip items with color and text
     * @param {Object} options.position - Position of tooltip
     * @param {String} options.position.type - Position type (auto, upLeft, upRight, downLeft, downRight)
     * @param {Number} options.position.x - X position
     * @param {Number} options.position.y - Y position
     * @param {Boolean} options.unxkcdify - Whether to disable xkcd filter
     * @param {String} options.backgroundColor - Background color
     * @param {String} options.strokeColor - Stroke color
     * @param {String} options.fontFamily - Font family to use
     * @param {Number} options.chartWidth - Chart width for edge detection
     * @param {Number} options.chartHeight - Chart height for edge detection
     */
    constructor({
        parent, title, items, position, unxkcdify,
        backgroundColor, strokeColor, fontFamily,
        chartWidth, chartHeight
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

    /**
     * Show the tooltip
     */
    show() {
        this.svg.style('visibility', 'visible');
    }

    /**
     * Hide the tooltip
     */
    hide() {
        this.svg.style('visibility', 'hidden');
    }

    /**
     * Update tooltip position / content
     * @param {Object} options - Update options
     * @param {String} options.title - New title
     * @param {Array} options.items - New items
     * @param {Object} options.position - New position
     */
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

    /**
     * Generate a tooltip item (color square + text)
     * @private
     */
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

    /**
     * Calculate tooltip background width
     * @private
     */
    _getBackgroundWidth() {
        const maxItemLength = this.items.reduce(
            (pre, cur) => (pre > cur.text.length ? pre : cur.text.length), 0,
        );
        const maxLength = Math.max(maxItemLength, this.title.length);

        return maxLength * 7.4 + 25;
    }

    /**
     * Calculate tooltip background height
     * @private
     */
    _getBackgroundHeight() {
        const rows = this.items.length + 1;
        return rows * 20 + 10;
    }

    /**
     * Calculate tooltip X position, adjusting for chart edges
     * @private
     */
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

    /**
     * Calculate tooltip Y position, adjusting for chart edges
     * @private
     */
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

export default XkcdTooltip;