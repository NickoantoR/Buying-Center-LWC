public with sharing class BuyingCenterController {

    // Fetches Contacts related to the specified Account with BuyingCenterMember flag true
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId){
        // Retrieves ID, Name, Role, and Character of Contacts ensuring security enforcement
        return [
        SELECT Id, Name, BuyingCenterRole__c, BuyingCenterCharacter__c 
        FROM Contact 
        WHERE AccountId = :accountId 
        AND BuyingCenterMember__c = true
        WITH SECURITY_ENFORCED
        ];
    }

    // Fetches Relationship__c records linked to the specified contactIds
    @AuraEnabled(cacheable=true)
    public static List<Relationship__c> getRelationships(List<Id> contactIds){
        // Retrieves relationships ensuring security enforcement
        return [
        SELECT Id, Name, Relationship_Type__c, Related_Contact__c, Contact__c
        FROM Relationship__c 
        WHERE Contact__c IN :contactIds
        WITH SECURITY_ENFORCED
        ];
    }
}