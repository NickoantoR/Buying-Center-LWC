
export default class d3Utility {

    // Method to draw static elements like influence zones and their labels
    drawStaticElements(svg, width, height) {
        const halfRect = width / 10;
        const circle1CenterX = width / 2 - 1.6 * halfRect;
        const circle2CenterX = width / 2 + 1.6 * halfRect;
        const centerY = height / 1.75;
        const fontSize = width / 45; // Dynamically set font size based on SVG width

        // Append a circle SVG element to represent influence zones
        svg.append('circle')
            .attr('cx', circle1CenterX)
            .attr('cy', centerY)
            .attr('r', height / 2.75) // Radius des Kreises
            .style('fill', 'white')
            .style('fill-opacity', 0.2)
            .style('stroke', 'black')
            .style('stroke-width', 2)

        // Append text SVG element to label the influence zone
        svg.append('text')
            .attr('dx', width / 10)
            .attr('dy', height / 4)
            .text('Macht')
            .style('fill', 'black')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', `${fontSize}px`)
        
        // Repeat for urgency zone
        svg.append('circle')
            .attr('cx', circle2CenterX)
            .attr('cy', centerY)
            .attr('r', height / 2.75) // Radius des Kreises
            .style('fill', 'white')
            .style('fill-opacity', 0.2)
            .style('stroke', 'black')
            .style('stroke-width', 2);

        svg.append('text')
            .attr('dx', width / 1.1)
            .attr('dy', height / 4)
            .text('Dringlichkeit')
            .style('fill', 'black')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', `${fontSize}px`)
    }
}