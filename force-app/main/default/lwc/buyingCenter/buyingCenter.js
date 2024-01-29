import { NavigationMixin } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { LightningElement, api, wire } from 'lwc';
// Utilized Apex Classes
import getContacts from '@salesforce/apex/BuyingCenterController.getContacts';
import getRelationships from '@salesforce/apex/BuyingCenterController.getRelationships';
// Static resources stored on the Salesforce Org
import D3 from '@salesforce/resourceUrl/d3';
const contactColumns = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: false },
    { label: 'Rolle', fieldName: 'BuyingCenterRole__c', type: 'text', editable: false },
    { label: 'Character', fieldName: 'BuyingCenterCharacter__c', type: 'text', editable: false },
    { label: 'ContactId', fieldName: 'Id', type: 'text', editable: false }
];
const relationshipColumns = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: false },
    { label: 'Relationship Type', fieldName: 'Relationship_Type__c', type: 'text', editable: false },
    { label: 'Related Contact', fieldName: 'Related_Contact__c', type: 'text', editable: false },
    { label: 'Contact', fieldName: 'Contact__c', type: 'text', editable: false }
];
export default class BuyingCenter extends NavigationMixin (LightningElement) {
    // System control
    error;
    d3Initialized = false;
    // Visualization variables
    svgWidth = 540;
    svgHeight = 500;
    // Data
    contacts;
    wiredContactResult
    relationships;
    // API query of the recordID
    @api recordId;
    // Wire method to fetch data via Apex
    @wire(getContacts, {accountId: '$recordId'})
    wiredContacts(result) {
        this.wiredContactResult = result;
        if (result.data) {
            this.contacts = result.data;
            this.error = undefined;
            // Extract contact IDs
            const contactIds = this.contacts.map(contact => contact.Id);
            // Fetch relationships after contacts are loaded
            this.fetchRelationships(contactIds);
        } else if (result.error) {
            this.contacts = undefined;
            this.error = result.error;
        }
    }

    async fetchRelationships(contactIds) {
        try {
            this.relationships = await getRelationships({ contactIds });
        } catch (error) {
            this.error = error;
            this.relationships = undefined;
        }
    }

    async renderedCallback() {
        if (this.d3Initialized) {
            return;
        }
        this.d3Initialized = true;
        await Promise.all([
            loadScript(this, D3 + '/d3.v7.js')
        ]).then(() => {
            this.initializeD3();
        }).catch((error) => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error loading D3",
                    message: error.message,
                    variant: "error",
                }),
            );
        });
    }
    
    initializeD3(){
    if(this.contacts && this.relationships){

        const svg = d3.select(this.template.querySelector('svg.d3'));
        const width = this.svgWidth;
        const height = this.svgHeight;
        const halfRect = width / 8;
        const circle1CenterX = width / 2 - 1.2 * halfRect;
        const circle2CenterX = width / 2 + 1.2 * halfRect;
        const centerY = height / 1.75;

        const rolePositions = {
            'Influencer': { x: width * 0.175, y: height / 2 },
            'Economic Buyer': { x: width * 0.175, y: height / 1.5 },
            'Decider': { x: width * 0.5, y: height / 1.75 },
            'Gatekeeper': { x: width * 0.5, y: height / 8 },
            'User': { x: width * 0.825, y: height / 2 },
            'Initiator': { x: width * 0.825, y: height / 1.5 }
        };
        let nodeData = this.contacts.map(contacts => {
            let position = rolePositions[contacts.BuyingCenterRole__c];
            return {
                id: contacts.Id,
                name: contacts.Name,
                group: contacts.BuyingCenterRole__c,
                character: contacts.BuyingCenterCharacter__c,
                x: position.x,
                y: position.y
            };
        });

        let nodeMap = new Map (nodeData.map(node => [node.id, node]));
        let linkData = this.relationships.map(relationship => {
            if(nodeMap.has(relationship.Contact__c) && nodeMap.has(relationship.Related_Contact__c)) {
                return{
                    source: nodeMap.get(relationship.Contact__c),
                    target: nodeMap.get(relationship.Related_Contact__c),
                    color: getColorBasedOnRelationshipType(relationship.Relationship_Type__c),
                    name: relationship.Name
                };
            }
        });

        let DATA = {
            nodeData: nodeData,
            linkData: linkData
        };
    
        const ticked = () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            node
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
            linkText
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);
        };
        const simulation = d3.forceSimulation(DATA.nodeData).on('tick', ticked);

        const drag = d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
        
        const circle1 = svg
            .append('circle')
            .attr('cx', circle1CenterX)
            .attr('cy', centerY)
            .attr('r', height / 2.75) // Radius des Kreises
            .style('fill', 'blue')
            .style('fill-opacity', 0.2)
            .style('stroke', 'black')
            .style('stroke-width', 2)
        circle1.append('text')
            .attr('dx', 5)
            .attr('dy', 15)
            .text('Macht')
            .style('fill', 'black')
            .style('text-anchor', 'middle')

        const circle2 = svg
            .append('circle')
            .attr('cx', circle2CenterX)
            .attr('cy', centerY)
            .attr('r', height / 2.75) // Radius des Kreises
            .style('fill', 'red')
            .style('fill-opacity', 0.2)
            .style('stroke', 'black')
            .style('stroke-width', 2);
        
        const link = svg
            .append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(DATA.linkData)
            .enter()
            .append('line')
            .attr('stroke', d => d.color) // Should later be changed to the Sentiment on an opportunity
            .attr('stroke-width', '2')
        
        const node = svg
            .append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(DATA.nodeData)
            .enter()
            .append('g')
            .call(drag)

            node.append('rect')
                .attr('width', width / 4) // Set the width of the rectangle
                .attr('height', 60) // Set the height of the rectangle
                .attr('x', -halfRect) // Position the rectangle centered on the node
                .attr('y', -30) // Position the rectangle centered on the node
                .attr('rx', 10)
                .attr('rx', 10)
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('fill', 'white')

            node.append('text')
                .attr('dx', -halfRect + 5)
                .attr('dy', -15)
                .text(d => d.name)
                .style('fill', 'black')
                .style('text-anchor', 'start')
            node.append('text')
                .attr('dx', -halfRect + 5)
                .attr('dy', 0)
                .text(d => d.group)
                .style('fill', 'black')
            node.append('text')
                .attr('dx', -halfRect + 5)
                .attr('dy', 15)
                .text(d => d.character)
                .style('fill', 'black')

        const linkText = svg
            .append('g')
            .attr('class', 'link-texts')
            .selectAll('text')
            .data(DATA.linkData)
            .enter()
            .append('text')
            .attr('x', d => (d.source.x + d.target.x) / 2) // Position text in the middle of the link
            .attr('y', d => (d.source.y + d.target.y) / 2)
            .text(d => d.name) // Set the text to be the relationship name
            .attr('fill', 'black') // Set the text color
            .attr('font-size', '12px')
            .attr('text-anchor', 'middle'); // Center the text on its position

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
            link
                .attr('x1', link => link.source.x)
                .attr('y1', link => link.source.y)
                .attr('x2', link => link.target.x)
                .attr('y2', link => link.target.y);
            node
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
            linkText
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = d.x;
            d.fy = d.y;
        }
        function getColorBasedOnRelationshipType(relationshipType) {
            switch (relationshipType) {
                case 'Positive':
                    return 'green';
                case 'Negative':
                    return 'red';
                default:
                    return 'black'; // Default color if neither positive nor negative
            }
        }
    } else {
        this.d3Initialized = false;
        return;
    };
    }

    // Getter-Methods for the tables.
    get contactColumns() {
        return contactColumns;
    }
    get relationshipColumns() {
        return relationshipColumns;
    }
}