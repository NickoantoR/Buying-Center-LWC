// Import statements for necessary Salesforce modules and components
import { NavigationMixin } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { LightningElement, api } from 'lwc';

import D3Utility from './d3Utility';

// Apex classes for fetching data from Salesforce
import getContacts from '@salesforce/apex/BuyingCenterController.getContacts';
import getRelationships from '@salesforce/apex/BuyingCenterController.getRelationships';

// Reference to D3.js library stored in Salesforce static resources
import D3 from '@salesforce/resourceUrl/d3';

export default class BuyingCenter extends NavigationMixin (LightningElement) {

    // Variables for handling errors and checking D3 initialization status
    error;
    d3Initialized = false;

    // Variables for setting SVG dimensions
    svgWidth;
    svgHeight;

    // Variables to store data fetched from Salesforce
    contacts;
    relationships;

    // Record ID passed to the component, used for fetching related data
    @api recordId;


    // Lifecycle hook called after the component is inserted into the DOM
    async connectedCallback() {
        if (this.d3Initialized) {
            return;
        }
        this.d3Initialized = true;
        // Load D3.js library and then initialize the D3 visualization
        await Promise.all([
            loadScript(this, D3 + '/d3.v7.js')
        ]).then(() => {
            this.fetchData();
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

    async fetchData() {
        try {
            this.contacts = await getContacts({ accountId: this.recordId });
            const contactIds = this.contacts.map(contact => contact.Id);
            this.relationships = await getRelationships({ contactIds });
            this.initializeD3(); // Call this here if data is ready
        } catch (error) {
            this.error = error;
        }
    }

    // Update SVG dimensions based on the current size of the container
    updateSVGDimensions() {
        const container = this.template.querySelector('.container');
        if(container) {
            const rect = container.getBoundingClientRect();
            if (this.svgWidth !== rect.width) {
                this.svgWidth = rect.width;
                this.svgHeight = rect.width * 0.925; // Maintain aspect ratio
            }
        }
    }

    // Initialize D3 visualization
    initializeD3(){
        // Check if both contacts and relationships data are available
        if(this.contacts && this.relationships){
            // Update the dimensions of the SVG to match the current container size
            this.updateSVGDimensions();

            // Select the SVG element in the template and set its dimensions
            const svg = d3.select(this.template.querySelector('svg.d3'))
            .attr('width', this.svgWidth)
            .attr('height', this.svgHeight);

            // Define constants for visualization layout calculations
            const width = this.svgWidth;
            const height = this.svgHeight;
            const halfRect = width / 10; // Half the width of the rectangle representing a node
            const fontSize = width / 45; // Dynamically set font size based on SVG width

            const d3Utility = new D3Utility();
            d3Utility.drawStaticElements(svg, width, height);

            // Define role positions for nodes on the SVG based on their role
            const rolePositions = {
                'Influencer': { x: width * 0.175, y: height / 2.25 },
                'Economic Buyer': { x: width * 0.175, y: height / 1.4 },
                'Decider': { x: width * 0.5, y: height / 1.75 },
                'Gatekeeper': { x: width * 0.5, y: height / 8 },
                'User': { x: width * 0.825, y: height / 2.25 },
                'Initiator': { x: width * 0.825, y: height / 1.4 }
            };

            // Map contact data to nodeData for D3 visualization, setting initial positions
            let nodeData = this.contacts.map(contact => {
                let position = rolePositions[contact.BuyingCenterRole__c];
                return {
                    id: contact.Id,
                    name: contact.Name,
                    group: contact.BuyingCenterRole__c,
                    character: contact.BuyingCenterCharacter__c,
                    x: position.x,
                    y: position.y
                };
            });

            // Create a map to easily access nodes by their ID
            let nodeMap = new Map (nodeData.map(node => [node.id, node]));

            // Prepare link data for D3 by mapping relationship data
            let linkData = this.relationships.map(relationship => {

                // Check if both source and target nodes are present
                if(nodeMap.has(relationship.Contact__c) && nodeMap.has(relationship.Related_Contact__c)) {
                    return{
                        source: nodeMap.get(relationship.Contact__c),
                        target: nodeMap.get(relationship.Related_Contact__c),
                        color: d3Utility.getColorBasedOnRelationshipType(relationship.Relationship_Type__c),
                        name: relationship.Name
                    };
                }
            });

            // Aggregate node and link data
            let DATA = {
                nodeData: nodeData,
                linkData: linkData
            };
        
            // Define tick function for force simulation
            const ticked = () => {
                link.attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node.attr('transform', d => `translate(${d.x}, ${d.y})`);

                linkText.attr('x', d => (d.source.x + d.target.x) / 2)
                        .attr('y', d => (d.source.y + d.target.y) / 2);
            };

            // Initialize force simulation with nodes, charge, collision forces, and tick function
            let simulation = d3.forceSimulation(DATA.nodeData)
                .force('charge', d3.forceManyBody().strength(0)) // Repulsion strength
                .force('collision', d3.forceCollide().radius(halfRect / 2)) 
                .on('tick', ticked)
                .on('end', () => {});

            // Configuration for alpha decay and velocity decay of the simulation
            simulation.alphaDecay(0.0228); // Adjust as needed
            simulation.velocityDecay(0.4); // Adjust as needed

            // Drag functionality for nodes
            const drag = d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
            
            // Create link elements for each relationship
            const link = svg.append('g')
                .attr('class', 'links')
                .selectAll('line')
                .data(DATA.linkData)
                .enter()
                .append('line')
                .attr('stroke', d => d.color) // Could later be changed to the Sentiment on an opportunity
                .attr('stroke-width', '2');

            // Create node elements for each contact
            const node = svg.append('g')
                .attr('class', 'nodes')
                .selectAll('g')
                .data(DATA.nodeData)
                .enter()
                .append('g')
                .on('click', function(event, d) {
                    this.handleNodeClick(d.id); // Handle click event on nodes
                }.bind(this))
                .call(drag) // Apply drag behavior

                // Append a rectangle to each node group to represent the node visually
                node.append('rect')
                    .attr('width', halfRect * 2) // Set the width of the rectangle
                    .attr('height', halfRect) // Set the height of the rectangle
                    .attr('x', -halfRect) // Position the rectangle centered on the node
                    .attr('y', -halfRect / 1.8) // Position the rectangle centered on the node
                    .attr('rx', 10)
                    .attr('rx', 10)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
                    .attr('fill', 'white')

                // Append name text to each node group
                node.append('text')
                    .attr('dx', -halfRect + 5)
                    .attr('dy', -halfRect / 3)
                    .text(d => d.name)
                    .style('fill', 'black')
                    .style('text-anchor', 'start')
                    .style('font-weight', 'bold')
                    .style('font-size', `${fontSize}px`)

                // Append role text to each node group
                node.append('text')
                    .attr('dx', -halfRect + 5)
                    .attr('dy', 0)
                    .text(d => d.group)
                    .style('fill', 'black')
                    .style('text-anchor', 'start')
                    .style('font-size', `${fontSize}px`)

                // Append character text to each node group
                node.append('text')
                    .attr('dx', -halfRect + 5)
                    .attr('dy', halfRect / 3)
                    .text(d => d.character)
                    .style('fill', 'black')
                    .style('text-anchor', 'start')
                    .style('font-size', `${fontSize}px`)

            // Create text elements for each link to show relationship names
            const linkText = svg.append('g')
                .attr('class', 'link-texts')
                .selectAll('text')
                .data(DATA.linkData)
                .enter()
                .append('text')
                .attr('x', d => (d.source.x + d.target.x) / 2) // Position text in the middle of the link
                .attr('y', d => (d.source.y + d.target.y) / 2)
                .text(d => d.name) // Set the text to be the relationship name
                .attr('fill', 'black') // Set the text color
                .attr('text-anchor', 'middle')
                .style('font-size', `${fontSize}px`)

            // Function to handle drag start event
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            // Function to handle drag event
            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
                link.attr('x1', link => link.source.x)
                    .attr('y1', link => link.source.y)
                    .attr('x2', link => link.target.x)
                    .attr('y2', link => link.target.y);

                node.attr('transform', d => `translate(${d.x}, ${d.y})`);

                linkText.attr('x', d => (d.source.x + d.target.x) / 2)
                        .attr('y', d => (d.source.y + d.target.y) / 2);
            }

            // Function to handle drag end event
            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            } 
        } else {
            // If data is not ready, mark D3 as not initialized
            this.d3Initialized = false;
            return;
        };
    }
    // Method to handle navigation to a specific contact record page
    handleNodeClick(contactId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: contactId,
                objectApiName: 'Contact',
                actionName: 'view'
            },
        });
    }
}