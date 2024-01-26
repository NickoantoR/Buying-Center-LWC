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
}