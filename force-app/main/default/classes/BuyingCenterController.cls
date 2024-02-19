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

    // Fetches Contacts related to the specified Opportunity with BuyingCenterMember flag true
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContactsFromOpp(Id oppId){
        // Query the AccountId from the Opportunity and proceed if it's not null
        ID accountID = [SELECT AccountId FROM Opportunity WHERE Id = :oppId LIMIT 1].AccountId;

        // Query and return Contacts related to the Account where BuyingCenterMember is true
        if(accountId != null) {
            return [
            SELECT Id, Name, BuyingCenterRole__c, BuyingCenterCharacter__c 
            FROM Contact 
            WHERE AccountId = :accountId 
            AND BuyingCenterMember__c = true
            WITH SECURITY_ENFORCED
            ];
        }
        // Return an empty list if the Opportunity didn't have a related Account
        return new List<Contact>();
    }

    // Fetches Relationship__c records linked to the specified contactIds
    @AuraEnabled
    public static List<Relationship__c> getRelationships(List<Id> contactIds){
        // Retrieves relationships ensuring security enforcement
        return [
        SELECT Id, Name, Relationship_Type__c, Related_Contact__c, Contact__c
        FROM Relationship__c 
        WHERE Contact__c IN :contactIds
        WITH SECURITY_ENFORCED
        ];
    }

    // Fetches AttitudeToOpp__c records linked to the specified contactId
    @AuraEnabled
    public static List<AttitudeToOpp__c> getAttitudes(List<Id> contactIds){
        // Retrieves AttitudeToOpp ensuring security enforcement
        return [
        SELECT Id, AttitudeToOpp__c, Contact__c
        FROM AttitudeToOpp__c 
        WHERE Contact__c IN :contactIds
        WITH SECURITY_ENFORCED
        ];
    }
}