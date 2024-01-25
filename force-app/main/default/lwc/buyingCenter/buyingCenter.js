import { NavigationMixin } from 'lightning/navigation';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
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
    @track error;
    @track d3Initialized = false;
    // Visualization variables
    svgWidth = 800;
    svgHeight = 600;
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
            loadScript(this, D3 + '/d3.v7.min.js'),
            loadStyle(this, D3 + '/style.css')
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

        let DATA = {
            nodeData : [
                { id: 'Einkäufer', group: 1 },
                { id: 'Gatekeeper', group: 2 },
                { id: 'Entscheider', group: 3 },
                { id: 'Nutzer', group: 4 },
                { id: 'Influencer', group: 5 },
                { id: 'Initiator', group: 6 }
            ],
            linkData : [
                { source: 'Nutzer', target: 'Entscheider', value: 20 },
                { source: 'Gatekeeper', target: 'Nutzer', value: 20 },
                { source: 'Influencer', target: 'Initiator', value: 20 }
            ]
        };


        const svg = d3.select(this.template.querySelector('svg.d3'));
        const width = this.svgWidth;
        const height = this.svgHeight;
        const color = d3.scaleOrdinal(d3.schemeDark2);

        const simulation = d3.forceSimulation(DATA.nodeData)
        .force('link', d3.forceLink(DATA.linkData).id((d) => d.id))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

        const link = svg
            .append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(DATA.linkData)
            .enter()
            .append('line')
            .attr('stroke-width', (d) => {
                return Math.sqrt(d.value);
            });

        const node = svg
            .append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(DATA.nodeData)
            .enter()
            .append('circle')
            .attr('r', 10)
            .attr('fill', (d) => {
                return color(d.group);
            });

        node.append('title').text((d) => {
            return d.id;
        });

        simulation.nodes(DATA.nodeData).on('tick', ticked);

        simulation.force('link').links(DATA.linkData);

        function ticked() {
            link.attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
        }

    }

    // Getter-Method.
    get columns() {
        return columns;
    }
}