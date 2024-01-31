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

    // Function to get color based on relationship type
    getColorBasedOnRelationshipType(relationshipType) {
        // Determine color based on the type of relationship
        switch (relationshipType) {
            case 'Positive':
                return 'lightgreen';
            case 'Negative':
                return '#ea5b0b';
            case 'Neutral':
                return '#FDC300';
            default:
                return 'grey'; // Default color if neither positive or negative
        }
    }

    // Function to get color based on attitude type
    getColorBasedOnAttitude(contactId, attitudes) {
        // Find the attitude object for the given contactId
        let attitudeObject = attitudes.find(attitude => attitude.Contact__c === contactId);
        if(attitudeObject) {
            switch (attitudeObject.AttitudeToOpp__c) {
                case 'Positive':
                    return 'lightgreen';
                case 'Negative':
                    return '#ea5b0b';
                case 'Neutral':
                    return '#FDC300';
                default:
                    return 'grey'; // Default color if neither positive or negative
            }
        }
        return 'white'; // Default color if attitudeObject is not found
    }

    // Method to ensure nodes stay within the SVG boundaries
    enforceBoundaries(nodeData, width, height) {
        nodeData.forEach(node => {
            const nodeRadius = width / 10; // Adjust based on your node size
            node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
            node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
        });
    }
}