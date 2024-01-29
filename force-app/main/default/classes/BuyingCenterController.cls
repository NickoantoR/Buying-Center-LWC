public with sharing class BuyingCenterController {

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId){
        return [
        SELECT Id, Name, BuyingCenterRole__c, BuyingCenterCharacter__c 
        FROM Contact 
        WHERE AccountId = :accountId 
        AND BuyingCenterMember__c = true
        WITH SECURITY_ENFORCED
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Relationship__c> getRelationships(List<Id> contactIds){
        System.debug(contactIds);
        return [
        SELECT Id, Name, Relationship_Type__c, Related_Contact__c, Contact__c
        FROM Relationship__c 
        WHERE Contact__c IN :contactIds
        WITH SECURITY_ENFORCED
        ];
    }

}