import { NavigationMixin } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { LightningElement, api, track, wire } from 'lwc';
// Utilized Apex Classes
import getContacts from '@salesforce/apex/BuyingCenterController.getContacts';
// Static resources stored on the Salesforce Org
import D3 from '@salesforce/resourceUrl/d3';
const columns = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: true },
    { label: 'Rolle', fieldName: 'BuyingCenterRole__c', type: 'text', editable: true },
    { label: 'Character', fieldName: 'BuyingCenterCharacter__c', type: 'text', editable: true }
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
    wiredContactResult;
    // API query of the recordID
    @api recordId;
    // Wire method to fetch data via Apex
    @wire(getContacts, {accountId: '$recordId'})
    wiredContacts(result) {
        this.wiredContactResult = result;
        if (result.data) {
            this.contacts = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.contacts = undefined;
            this.error = result.error;
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

        if(!this.contacts || this.contacts.length === 0){
            this.d3Initialized = false;
            return;
        }

        let nodeData = this.contacts.map(contacts => {
            return {
                id: contacts.Id,
                name: contacts.Name,
                group: contacts.BuyingCenterRole__c,
                character: contacts.BuyingCenterCharacter__c
            };
        });

        let nodeMap = new Map (nodeData.map(node => [node.id, node]));
        let linkData = [];

        if (this.contacts.length > 1) {
            linkData.push({
                source: nodeMap.get(this.contacts[0].Id),
                target: nodeMap.get(this.contacts[1].Id)
            });
        }

        let DATA = {
            nodeData: nodeData,
            linkData: linkData
        };
        
        const svg = d3.select(this.template.querySelector('svg.d3'));
        const width = this.svgWidth;
        const height = this.svgHeight;
        const halfRect = width / 8;
        const circle1CenterX = width / 2 - 80;
        const circle2CenterX = width / 2 + 80;
        const centerY = height / 1.75;
        const simulation = d3.forceSimulation(DATA.nodeData)

        const drag = d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
        
        const circle1 = svg
            .append('circle')
            .attr('cx', circle1CenterX)
            .attr('cy', centerY)
            .attr('r', this.svgHeight / 2.75) // Radius des Kreises
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
            .attr('r', this.svgHeight / 2.75) // Radius des Kreises
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
            .attr('stroke', 'green') // Should later be changed to the Sentiment on an opportunity
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
/*              .attr('fill', (d) => {
                    return color(d.opinion); // Color the rectangle based on the group
                }); */
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
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
            link.filter(link => link.source === d || link.target === d)
                .attr('x1', link => link.source.x)
                .attr('y1', link => link.source.y)
                .attr('x2', link => link.target.x)
                .attr('y2', link => link.target.y);
            node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = d.x;
            d.fy = d.y;
        }
    }
    // Getter-Method.
    get columns() {
        return columns;
    }
}





/*         let DATA = {
            nodeData : [
                { id: 'PeterMüller_Einkäufer_Kalt', group: 1 },
                { id: 'FrankGünther_Gatekeeper_Freundlich', group: 2 },
                { id: 'AnnaSchulte_Entscheider_Faktengetrieben', group: 3 },
                { id: 'Nutzer', group: 4 },
                { id: 'Influencer', group: 5 },
                { id: 'Initiator', group: 6 }
            ],
            linkData : [
                { source: 'Nutzer', target: 'AnnaSchulte_Entscheider_Faktengetrieben', value: 20 },
                { source: 'FrankGünther_Gatekeeper_Freundlich', target: 'Nutzer', value: 20 },
                { source: 'Influencer', target: 'Initiator', value: 20 }
            ]
        }; */