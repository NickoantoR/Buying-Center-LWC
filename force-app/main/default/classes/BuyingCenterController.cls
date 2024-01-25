public with sharing class BuyingCenterController {


    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId){

        //List<Contact> dummy = new List<Contact>{};
        //dummy = [SELECT Id, Name FROM Contact WHERE AccountId = :accountId WITH SECURITY_ENFORCED];
        //System.debug(dummy.toString());

        return [
        SELECT Id, Name, BuyingCenterRole__c, BuyingCenterCharacter__c 
        FROM Contact 
        WHERE AccountId = :accountId 
        AND BuyingCenterMember__c = true
        WITH SECURITY_ENFORCED
        ];
    }
}