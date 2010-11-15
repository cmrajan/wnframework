<?php

//Exception Types
define('ERROR_CODE_USER_DOES_NOT_EXIST', 'UserDoesNotExist'); //thow this error when the user does not exist
define('ERROR_CODE_USER_DATA', 'ValidationException');
define('ERROR_CODE_AUTH', 'AuthenticationException');
define('ERROR_CODE_REALM_DOES_NOT_EXIST', 'RealmDoesNotExistException');
define('ERROR_CODE_REALM_ALREADY_EXISTS', 'DuplicateRealmException');
define('ERROR_CODE_USER_ALREADY_EXISTS', 'DuplicateUserException');
define('ERROR_CODE_INTERNAL_SERVER_ERROR', 'InternalException');

//Soap Exception Fault Codes
define('ERROR_CODE_CLIENT', "Client");
define('ERROR_CODE_SERVER', "Server");

/**
 * 
 * This class handles the Single Sign-On Soap Requests
 *  
 */
class ProvisionServiceClass
{
	/**
	 * Create an exception 
	 * 
	 * <ns2:ValidationException xmlns:ns2="http://service.globalsaas.com/soap/">
     *    <message>Transaction ID not provided</message>
     * </ns2:ValidationException>
     *	
	 * @param object $exception
	 * @return 
	 */
	function createException($exception,$message)
	{
		$typedException = new StdClass();
		$typedException->message = $message;
		$detail = null;
		$error_code = ERROR_CODE_CLIENT;
		
		if ($exception == ERROR_CODE_USER_DATA)
		{
			$detail->ValidationException = $typedException;
		}
		elseif ($exception == ERROR_CODE_INTERNAL_SERVER_ERROR)
		{
			$error_code = ERROR_CODE_SERVER;
			$detail->InternalException = $typedException;
		}
		elseif ($exception == ERROR_CODE_AUTH)
		{
			$detail->AuthenticationException = $typedException;
		}
		elseif ($exception == ERROR_CODE_USER_DOES_NOT_EXIST)
		{
			$detail->UserDoesNotExistException = $typedException;
		}
		elseif ($exception == ERROR_CODE_REALM_DOES_NOT_EXIST)
		{
			$detail->RealmDoesNotExistException = $typedException;
		}
		elseif ($exception == ERROR_CODE_REALM_ALREADY_EXISTS)
		{
			$detail->DuplicateRealmException = $typedException;
		}
		elseif ($exception == ERROR_CODE_USER_ALREADY_EXISTS)
		{
			$detail->DuplicateUserException = $typedException;
		}
		return new SoapFault($error_code,$exception,null,$detail,$exception);
	}
	
	/**
	 * This method inserts a new realm with a realm name and an array of custom fields
	 * See the specification document for additional information.
	 * 
	 * @param object $InsertRealmRequest
	 * 
	 * @return 
	 */
    function InsertRealm($InsertRealmRequest)
    {
        $num_of_args = func_num_args();
        
		//In this example the custom fields are compulsory
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:InsertRealm -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:InsertRealm -Incorrect parameters passed in.");
        }
		
		$Timestamp = $InsertRealmRequest->Timestamp;
		$AdminUserName = $InsertRealmRequest->AdminUserName;
		$AdminPassWord = $InsertRealmRequest->AdminPassWord;
		$RealmName = $InsertRealmRequest->RealmName;
		$CustomFields = $InsertRealmRequest->CustomFields;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:InsertRealm -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:InsertRealm -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		if($this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:InsertRealm -Attempted to insert a realm that already exists");
			return $this->createException(ERROR_CODE_REALM_ALREADY_EXISTS, "ISVIntegrationService:InsertRealm -Attempted to insert a realm that already exists");
		}
		
		
		$num_custom_fields = count($CustomFields->CustomField);
				
		/**
		 * This is to demonstate how to access the custom fields. For this wsdl we have specified 2 custom fields,
		 * named Logo which is a logo and companyName which is a company name.
		 * 
		 * If only one custom field is required, access is 
		 * 
		 * $logo = $CustomFields->CustomField->FieldValue
		 */
		if($num_custom_fields == 2)
		{
			if($CustomFields->CustomField[0]->FieldName == 'logo')
			{
				$logo = $CustomFields->CustomField[0]->FieldValue;
				$companyName = $CustomFields->CustomField[1]->FieldValue;
			}
			
			if($CustomFields->CustomField[0]->FieldName == 'companyName')
			{
				$companyName = $CustomFields->CustomField[0]->FieldValue;
				$logo = $CustomFields->CustomField[1]->FieldValue;
			}
		}

		if(!$logo || !$companyName)
		{
			error_log("ISVIntegrationService:InsertRealm -Error with specifying the custom fields");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:InsertRealm -Error with specifying the custom fields");
		}
		
		
		try 
		{
			//with the data provided it is now possible to save the data to the database
			
			//TODO: implement this
			
		}catch(Exception $e) {
			error_log("ISVIntegrationService:InsertRealm ->An unhandled exception occurred".$e);
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:InsertRealm ->An unhandled exception occurred");
		}
    }
	
	/**
	 * This method enables the realm with the specified name
	 * 
	 * @param object $EnableRealmRequest
	 * 
	 * @return 
	 */
	function EnableRealm($EnableRealmRequest) 
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:EnableRealm -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA);
        }

		$Timestamp = $EnableRealmRequest->Timestamp;
		$AdminUserName = $EnableRealmRequest->AdminUserName;
		$AdminPassWord = $EnableRealmRequest->AdminPassWord;
		$RealmName = $EnableRealmRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:EnableRealm -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:EnableRealm -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the realm name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:EnableRealm -No valid RealmName provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:EnableRealm -No valid RealmName provided");
		}
		
		//check that the user id exists
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:EnableRealm -No Realm with the name provided exists");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST, "ISVIntegrationService:EnableRealm -No Realm with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to enable the realm from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:EnableRealm -Unexpected error occcured when attempting to enable the realm");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:EnableRealm -Unexpected error occcured when attempting to enable the realm");	
		}
	}
	
	/**
	 * This method disables the specified realm given the realm name
	 * 
	 * @param object $DisableRealmRequest
	 * 
	 * @return 
	 */
	function DisableRealm($DisableRealmRequest) 
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:DisableRealm -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:DisableRealm -Incorrect number of parameters passed in.");
        }
		
		$Timestamp = $DisableRealmRequest->Timestamp;
		$AdminUserName = $DisableRealmRequest->AdminUserName;
		$AdminPassWord = $DisableRealmRequest->AdminPassWord;
		$RealmName = $DisableRealmRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:DisableRealm -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH);
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the realm name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:DisableRealm -No valid RealmName provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:DisableRealm -No valid RealmName provided");
		}
		
		//check that the realm name exists
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:DisableRealm -No Realm with the name provided exists");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST, "ISVIntegrationService:DisableRealm -No Realm with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to disable the realm from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:DisableRealm -Unexpected error occcured when attempting to disable the realm");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:DisableRealm -Unexpected error occcured when attempting to disable the realm");	
		}
	}
	
	/**
	 * This method removes the specified realm given the realm name
	 * See the specification document for further details
	 * 
	 * @param object $RemoveRealmRequest
	 * 
	 * @return 
	 */
	function RemoveRealm($RemoveRealmRequest) 
	{
		if(func_num_args()<4)
        {
            error_log("ISVIntegrationService:RemoveRealm -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:RemoveRealm -Incorrect number of parameters passed in.");
        }
		
		$Timestamp = $RemoveRealmRequest->Timestamp;
		$AdminUserName = $RemoveRealmRequest->AdminUserName;
		$AdminPassWord = $RemoveRealmRequest->AdminPassWord;
		$RealmName = $RemoveRealmRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:RemoveRealm -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:RemoveRealm -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the realm name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:RemoveRealm -No valid RealmName provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:RemoveRealm -No valid RealmName provided");
		}
		
		//check that the realm exists
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:RemoveRealm -No realm with the name provided exists");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST, "ISVIntegrationService:RemoveRealm -No realm with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to remove the realm from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:RemoveRealm -Unexpected error occcured when attempting to remove the realm");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:RemoveRealm -Unexpected error occcured when attempting to remove the realm");	
		}
	}
	
	/**
	 * This method enables all users from a specified realm name
	 * 
	 * @param object $EnableAllUsersRequest
	 * 
	 * @return 
	 */
	function EnableAllUsers($EnableAllUsersRequest)
	{
		if(func_num_args()<4)
        {
            error_log("ISVIntegrationService:EnableAllUsers -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:EnableAllUsers -Incorrect number of parameters passed in.");
        }
		
		$Timestamp = $EnableAllUsersRequest->Timestamp;
		$AdminUserName = $EnableAllUsersRequest->AdminUserName;
		$AdminPassWord = $EnableAllUsersRequest->AdminPassWord;
		$RealmName = $EnableAllUsersRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:EnableAllUsers -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH,"ISVIntegrationService:EnableAllUsers -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the realm name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:EnableAllUsers -No valid RealmName provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:EnableAllUsers -No valid RealmName provided");
		}
		
		//check that the realm exists
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:EnableAllUsers -No Realm with the name provided exists");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST, "ISVIntegrationService:EnableAllUsers -No Realm with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to enable the realm from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:EnableAllUsers -Unexpected error occcured when attempting to enable the users");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:EnableAllUsers -Unexpected error occcured when attempting to enable the users");	
		}
	}
	
	/**
	 * This method removes the specified user given the user name and realm name
	 * 
	 * @param object $EnableUserRequest
	 * 
	 * @return 
	 */
	function EnableUser($EnableUserRequest) 
	{
		if(func_num_args()<5)
        {
            error_log("ISVIntegrationService:EnableUser -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA);
        }
		
		$Timestamp = $EnableUserRequest->Timestamp;
		$AdminUserName = $EnableUserRequest->AdminUserName;
		$AdminPassWord = $EnableUserRequest->AdminPassWord;
		$RealmName = $EnableUserRequest->RealmName;
		$UserName = $EnableUserRequest->UserName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:EnableUser -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:EnableUser -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the user name is valid
		if(!$UserName) {
			error_log("ISVIntegrationService:EnableUser -No valid UserName provided");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:EnableUser -No valid UserName provided");
		}
		
		//check that the user name exists
		if(!$this->userExists($UserName))
		{
			error_log("ISVIntegrationService:EnableUser -No User with the name provided exists");
			return $this->createException(ERROR_CODE_USER_DOES_NOT_EXIST, "ISVIntegrationService:EnableUser -No User with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to enable the user from the database
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:EnableUser -Unexpected error occcured when attempting to enable the user");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"ISVIntegrationService:EnableUser -Unexpected error occcured when attempting to enable the user");	
		}
	}
	
	/**
	 * This method disables all users from a specified realm
	 * 
	 * @param object $DisableAllUsersRequest
	 * 
	 * @return 
	 */
	function DisableAllUsers($DisableAllUsersRequest)
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:DisableAllUsers -Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:DisableAllUsers -Incorrect parameters passed in.");
        }
		
		$Timestamp = $DisableAllUsersRequest->Timestamp;
		$AdminUserName = $DisableAllUsersRequest->AdminUserName;
		$AdminPassWord = $DisableAllUsersRequest->AdminPassWord;
		$RealmName = $DisableAllUsersRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:DisableAllUsers -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH,"ISVIntegrationService:DisableAllUsers -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the realm name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:DisableAllUsers -No valid RealmName provided");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:DisableAllUsers -No valid RealmName provided");
		}
		
		//check that the realm name exists
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:DisableAllUsers -No Realm with the name provided exists");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST,"ISVIntegrationService:DisableAllUsers -No Realm with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to disable the realm from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:DisableAllUsers -Unexpected error occcured when attempting to disable the users");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:DisableAllUsers -Unexpected error occcured when attempting to disable the users");	
		}
	}
	
	/**
	 * This method disables the specified user given the user name and realm name
	 * 
	 * @param object $DisableUserRequest
	 * 
	 * @return 
	 */
	function DisableUser($DisableUserRequest) 
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:DisableUser -Incorrect parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:DisableUser -Incorrect parameters passed in.");
        }
		
		$Timestamp = $DisableUserRequest->Timestamp;
		$AdminUserName = $DisableUserRequest->AdminUserName;
		$AdminPassWord = $DisableUserRequest->AdminPassWord;
		$RealmName = $DisableUserRequest->RealmName;
		$UserName = $DisableUserRequest->UserName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:DisableUser - Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:DisableUser - Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the user name is valid
		if(!$UserName) {
			error_log("ISVIntegrationService:DisableUser - No valid UserName provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:DisableUser - No valid UserName provided");
		}
		
		//check that the user name exists
		if(!$this->userExists($UserName))
		{
			error_log("ISVIntegrationService:DisableUser - No User with the name provided exists");
			return $this->createException(ERROR_CODE_USER_DOES_NOT_EXIST,"ISVIntegrationService:DisableUser - No User with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to disable the user from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:DisableUser - Unexpected error occcured when attempting to disable the user".$e);
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"ISVIntegrationService:DisableUser -Unexpected error occcured when attempting to disable the user");	
		}
	}
	
	/**
	 * This method removes all users from a specified realm id
	 * 
	 * @param object $RemoveAllUsersRequest
	 * 
	 * @return 
	 */
	function RemoveAllUsers($RemoveAllUsersRequest)
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:RemoveAllUsers -Incorrect parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:RemoveAllUsers -Incorrect parameters passed in.");
        }
		
		$Timestamp = $RemoveAllUsersRequest->Timestamp;
		$AdminUserName = $RemoveAllUsersRequest->AdminUserName;
		$AdminPassWord = $RemoveAllUsersRequest->AdminPassWord;
		$RealmName = $RemoveAllUsersRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:RemoveAllUsers -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH,"ISVIntegrationService:RemoveAllUsers -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the realm name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:RemoveAllUsers - No valid RealmName provided");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:RemoveAllUsers - No valid RealmName provided");
		}
		
		//check that the realm name exists
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:RemoveAllUsers - No Realm with the name provided exists");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST,"ISVIntegrationService:RemoveAllUsers - No Realm with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to delete the realm from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:RemoveAllUsers - Unexpected error occcured when attempting to remove the user");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"ISVIntegrationService:RemoveAllUsers - Unexpected error occcured when attempting to remove the user");	
		}
	}
	
	/**
	 * This method removes the specified user given the user name and realm name
	 * 
	 * @param object $RemoveUserRequest
	 * 
	 * @return 
	 */
	function RemoveUser($RemoveUserRequest) 
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:RemoveUser - Incorrect parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:RemoveUser - Incorrect parameters passed in.");
        }
		
		$Timestamp = $RemoveUserRequest->Timestamp;
		$AdminUserName = $RemoveUserRequest->AdminUserName;
		$AdminPassWord = $RemoveUserRequest->AdminPassWord;
		$RealmName = $RemoveUserRequest->RealmName;
		$UserName = $RemoveUserRequest->UserName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:RemoveUser - Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH,"ISVIntegrationService:RemoveUser - Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		$mysql_conn = mysql_connect('localhost','accounts','ac_user09')
 			or die('Could not connect:'.mysql_error());
		echo 'Connected Successfully';
		mysql_select_db('accounts') or die('Could not select database');
		
	
		$query = printf('delete from tabProfile where name = %s',$UserName);


		$result = mysql_query(query) or die (mysql_error());

		mysql_free_result($result);
		mysql_close($mysql_conn);


		//check the user name is valid
		if(!$UserName) {
			error_log("ISVIntegrationService:RemoveUser - No valid UserName provided");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:RemoveUser - No valid UserName provided");
		}
		
		//check that the user name exists
		if(!$this->userExists($UserName))
		{
			error_log("ISVIntegrationService:RemoveUser - No User with the name provided exists");
			return $this->createException(ERROR_CODE_USER_DOES_NOT_EXIST, "ISVIntegrationService:RemoveUser - No User with the name provided exists");
		}
		
		try
		{
			//TODO: Implement the code to delete the user from the database
			
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:RemoveUser - Unexpected error occcured when attempting to remove the user");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:RemoveUser - Unexpected error occcured when attempting to remove the user");	
		}
	}
	
	/**
	 * This method returns an array of user objects given the Realm provided
	 * See the specification document for additional information
	 * 
	 * @param object $SelectAllUsersRequest
	 * 
	 * @return 
	 */
	function SelectAllUsers($SelectAllUsersRequest)
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:SelectAllUsers - Incorrect parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:SelectAllUsers - Incorrect parameters passed in.");
        }
		
		$Timestamp = $SelectAllUsersRequest->Timestamp;
		$AdminUserName = $SelectAllUsersRequest->AdminUserName;
		$AdminPassWord = $SelectAllUsersRequest->AdminPassWord;
		$RealmName = $SelectAllUsersRequest->RealmName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:SelectAllUsers -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH,"ISVIntegrationService:SelectAllUsers -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the user name is valid
		if(!$RealmName) {
			error_log("ISVIntegrationService:SelectAllUsers -No valid Realm provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:SelectAllUsers -No valid Realm provided");
		}
		
		if(!$this->realmExists($RealmName))
		{
			error_log("ISVIntegrationService:SelectAllUsers -The specified realm does not exist");
			return $this->createException(ERROR_CODE_REALM_DOES_NOT_EXIST, "ISVIntegrationService:SelectAllUsers -The specified realm does not exist");	
		}
		
		try
		{
			//try and load from the database the users in the specified realm
			//TODO: Implement this and remove this sample data
			
			$sample_user = new StdClass();
			$sample_user->FirstName = "Scott";
			$sample_user->LastName = "Tiger";
			$sample_user->Email = "Scott.Tiger@testdomain.com";
			$sample_user->RealmName = "TestRealm";
			$sample_user->RoleName = "Admin";
			$sample_user->UserName = "Scott@TestRealm";
			$sample_user->PassWord = "p@ssw0rd";
			
			$custom_logo = new StdClass();
			$custom_logo->FieldName = 'logo';
			$custom_logo->FieldValue = 'A logo';
			
			$nickname = new StdClass();
			$nickname->FieldName = 'nickname';
			$nickname->FieldValue = 'Scotty';
			
			$custom_logo2 = new StdClass();
			$custom_logo2->FieldName = 'logo';
			$custom_logo2->FieldValue = 'A logo';
			
			$nickname2 = new StdClass();
			$nickname2->FieldName = 'nickname';
			$nickname2->FieldValue = 'Scotty';
			
			$custom_fields = array($custom_logo, $nickname);
			$custom_fields2 = array($custom_logo2, $nickname2);
			
			$sample_user->CustomFields = $custom_fields;
			
			$sample_user2 = new StdClass();
			$sample_user2->FirstName = "Hello";
			$sample_user2->LastName = "World";
			$sample_user2->Email = "Hello.World@testdomain.com";
			$sample_user2->RealmName = "TestRealm";
			$sample_user2->RoleName = "Guest";
			$sample_user2->UserName = "Hello@TestRealm";
			$sample_user2->PassWord = "p@ssw0rd2";
			
			$sample_user2->CustomFields = $custom_fields2;
			
			$users = array($sample_user, $sample_user2);
			
			return array(
				'users'=>$users
			);
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:SelectAllUsers -Unexpected error occurred".$e);
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"ISVIntegrationService:SelectAllUsers -Unexpected error occurred");
		}
	}
	
	/**
	 * This method returns an existing user object given the UserName and RealmName.
	 * See the specification document for additional information.
	 * 
	 * @param object $SelectUserRequest
	 * 
	 * @return 
	 */
	function SelectUser($SelectUserRequest)
	{
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:SelectUser - Incorrect parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:SelectUser - Incorrect parameters passed in.");
        }
		
		$Timestamp = $SelectUserRequest->Timestamp;
		$AdminUserName = $SelectUserRequest->AdminUserName;
		$AdminPassWord = $SelectUserRequest->AdminPassWord;
		$RealmName = $SelectUserRequest->RealmName;
		$UserName = $SelectUserRequest->UserName;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:SelectUser -Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH,"ISVIntegrationService:SelectUser -Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//check the user name is valid
		if(!$UserName) {
			error_log("ISVIntegrationService:SelectUser - No valid UserName provided");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:SelectUser - No valid UserName provided");
		}
		
		try
		{
			//search the database to see if the user exists
			
			if(!$this->userExists($UserName))
			{
				error_log("ISVIntegrationService:SelectUser - User does not exist");
				return $this->createException(ERROR_CODE_USER_DOES_NOT_EXIST, "ISVIntegrationService:SelectUser - User does not exist");
			}
			else
			{
				//TODO: Implement this and remove this samepl data
				//for demonstration, we'll return some test data
				
				$custom_logo = new StdClass();
				$custom_logo->FieldName = 'logo';
				$custom_logo->FieldValue = 'A logo';
				
				$nickname = new StdClass();
				$nickname->FieldName = 'nickname';
				$nickname->FieldValue = 'Scotty';
				
				$custom_fields = array($custom_logo, $nickname);
				
				return array(
					'RealmName'=>'TestRealm',
					'FirstName'=>'Scott',
					'LastName'=>'Tiger',
					'Email'=>'Scott.Tiger@testdomain.com',
					'RoleName'=>'Admin',
					'UserName'=>'Scott@TestRealm',
					'PassWord'=>'p@ssw0rd',
					'CustomFields'=>$custom_fields
				);
			}
		}
		catch(Exception $e)
		{
			error_log("ISVIntegrationService:SelectUser ->An unhandled exception occurred".$e);
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR);
		}
	}
	
	/**
	 * This method adds a new user to the application in the realm specified by the Realm Name.
     *  See the specification document for additional information.
     * 
	 * @param object $InsertUserRequest
	 * 
	 * @return 
	 */
    function InsertUser($InsertUserRequest)
    {
		if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:InsertUser - Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:InsertUser - Invalid request passed into the InsertUser method");
        }
		
		$Timestamp = $InsertUserRequest->Timestamp;
		$AdminUserName = $InsertUserRequest->AdminUserName;
		$AdminPassWord = $InsertUserRequest->AdminPassWord;
		$RealmName = $InsertUserRequest->RealmName;
			
		
		$UserInfo = $InsertUserRequest->UserInfo;
		$FirstName = $UserInfo->FirstName;
		$LastName = $UserInfo-LastName;
		$RoleName = $UserInfo->RoleName;
		$UserName = $UserInfo->UserName;
		$PassWord = $UserInfo->PassWord;
		$Email = $UserInfo->Email;
		$CustomFields = $UserInfo->CustomFields;
		
		
		$mysql_conn = mysql_connect('localhost','accounts','ac_user09') 			
			or die('Could not connect:'.mysql_error());
		echo 'Connected Successfully';
		mysql_select_db('accounts') or die('Could not select database')
			or die ('Couldnot Select DB');
		
	
		$query = printf('insert into tabProfile set (name,first_name,last_name,password,email) values (%s,%s,%s,%s,%s)',
			$UserName,$FirstName,$LastName,$Password,$Email);


		$result = mysql_query(query);

		mysql_free_result($result);
		mysql_close($mysql_conn);
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:InsertUser - Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:InsertUser - Failed to authenticate admin username and password");
		}
		
		//convert the timestamp from string
		$date = strtotime($Timestamp);
		
		//Perform the user validation
		if(!$this->validateUserDetails($date,$RealmName, $FirstName, $LastName, $Email,$RoleName, $UserName, $PassWord))
		{
			error_log("ISVIntegrationService:InsertUser - Validation Error");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:InsertUser - Data Validation Error");
		}
		
		if($this->userExistsInRealm($UserName, $RealmName))
		{
			error_log("ISVIntegrationService:InsertUser - User already exists in the realm");
			return $this->createException(ERROR_CODE_USER_ALREADY_EXISTS,"ISVIntegrationService:InsertUser - User already exists in this realm");
		}
		
		
		$num_custom_fields = count($CustomFields->CustomField);
				
		/**
		 * This is to demonstate how to access the custom fields. For this wsdl we have specified 2 custom fields,
		 * named Logo which is a logo and ShortName which is a nickname.
		 * 
		 * If only one custom field is required, access is 
		 * 
		 * $logo = $CustomFields->CustomField->FieldValue
		 */
		if($num_custom_fields >= 2)
		{
			if($CustomFields->CustomField[0]->FieldName == 'logo')
			{
				$logo = $CustomFields->CustomField[0]->FieldValue;
				$nickname = $CustomFields->CustomField[1]->FieldValue;
			}
			
			if($CustomFields->CustomField[0]->FieldName == 'nickname')
			{
				$nickname = $CustomFields->CustomField[0]->FieldValue;
				$logo = $CustomFields->CustomField[1]->FieldValue;
			}
		}

		if(!$logo || !$nickname)
		{
			error_log("ISVIntegrationService:InsertUser - Error with specifying the custom fields");
			return $this->createException(ERROR_CODE_USER_DATA, "ISVIntegrationService:InsertUser - Error with specifying the custom fields");
		}
		
		
		try 
		{
			//with the data provided it is now possible to save the data to the database
			
			//TODO: implement this
			
		}catch(Exception $e) {
			error_log("ISVIntegrationService:InsertUser - An unhandled exception occurred".$e);
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR, "ISVIntegrationService:InsertUser - Unexpected server error");
		}
    }
	
	/**
	 * This method updates an existing user to the application in the realm specified by the Realm Name.
     *  See the specification document for additional information.
     * 
	 * @param object $UpdateUserRequest
	 * 
	 * @return 
	 */
	function UpdateUser($UpdateUserRequest)
    {
    	if(func_num_args()<1)
        {
            error_log("ISVIntegrationService:UpdateUser - Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:UpdateUser - Invalid request passed in");
        }
		
		$Timestamp = $UpdateUserRequest->Timestamp;
		$AdminUserName = $UpdateUserRequest->AdminUserName;
		$AdminPassWord = $UpdateUserRequest->AdminPassWord;
		$RealmName = $UpdateUserRequest->RealmName;
			
		
		$UserInfo = $UpdateUserRequest->UserInfo;
		$FirstName = $UserInfo->FirstName;
		$LastName = $UserInfo-LastName;
		$RoleName = $UserInfo->RoleName;
		$UserName = $UserInfo->UserName;
		$PassWord = $UserInfo->PassWord;
		$Email = $UserInfo->Email;
		$CustomFields = $UserInfo->CustomFields;
		
		//Authenticate the admin username and password
		if(!$this->authenticate($AdminUserName,$AdminPassWord)) {
			error_log("ISVIntegrationService:UpdateUser - Failed to authenticate admin username and password");
			return $this->createException(ERROR_CODE_AUTH, "ISVIntegrationService:UpdateUser - Wrong admin username and password");
		}
		
		//convert the timestamp from string
		$mysql_conn = mysql_connect('localhost','accounts','ac_user09')
			or die('Could not connect:'.mysql_error());
		echo 'Connected Successfully';
		mysql_select_db('accounts') or die('Could not select database')
			or die ('Couldnot Select DB');
		
	
		$query = printf('update tabProfile set name = %s,first_name = %s,last_name = %s ,password = %s ,email = %s ',$UserName,$FirstName,$LastName,$Password,$Email);


		$result = mysql_query(query);

		mysql_free_result($result);
		mysql_close($mysql_conn);

		$date = strtotime($Timestamp);
		
		//Perform the user validation
		if(!$this->validateUserDetails($date,$RealmName, $FirstName, $LastName, $Email,$RoleName,$UserName,$PassWord))
		{
			error_log("ISVIntegrationService:UpdateUser - Validation Error");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:UpdateUser - Validation Error");
		}
		
		if(!$this->userExistsInRealm($UserName, $RealmName))
		{
			error_log("ISVIntegrationService:UpdateUser - User does not exist in the realm");
			return $this->createException(ERROR_CODE_USER_DOES_NOT_EXIST,"ISVIntegrationService:UpdateUser - User does not exist in the realm");
		}
		
		
		$num_custom_fields = count($CustomFields->CustomField);
				
		/**
		 * This is to demonstate how to access the custom fields. For this wsdl we have specified 2 custom fields,
		 * named Logo which is a logo and ShortName which is a nickname.
		 * 
		 * If only one custom field is required, access is 
		 * 
		 * $logo = $CustomFields->CustomField->FieldValue
		 */
		if($num_custom_fields == 2)
		{
			if($CustomFields->CustomField[0]->FieldName == 'logo')
			{
				$logo = $CustomFields->CustomField[0]->FieldValue;
				$nickname = $CustomFields->CustomField[1]->FieldValue;
			}
			
			if($CustomFields->CustomField[0]->FieldName == 'nickname')
			{
				$nickname = $CustomFields->CustomField[0]->FieldValue;
				$logo = $CustomFields->CustomField[1]->FieldValue;
			}
		}

		if(!$logo || !$nickname)
		{
			error_log("ISVIntegrationService:UpdateUser - Error with specifying the custom fields");
			return $this->createException(ERROR_CODE_USER_DATA,"ISVIntegrationService:UpdateUser - Error with specifying the custom fields");
		}
		
		try 
		{
			//with the data provided it is now possible to save the data to the database
			//TODO: implement this
		}catch(Exception $e) {
			error_log("ISVIntegrationService:UpdateUser - An unhandled exception occurred".$e);
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"ISVIntegrationService:UpdateUser -An unhandled exception occurred");
		}
	}
	
	//Private methods
	
	/**
	 * Authenticate the admin in order to perform operations in this web service
	 * 
	 * @param object $AdminUserName
	 * @param object $AdminPassWord
	 * @return 
	 */
	function authenticate($AdminUserName, $AdminPassWord) {
		//TODO: Implement this
		return ($AdminUserName == 'admin' && $AdminPassWord == 'password');
		//return true;
	}
	
	/**
	 * Perform common validation for user details. Refer to the specification for detailed
	 * rules on the required properties and maximum lengths
	 * 
	 * @param object $RealmName
	 * @param object $FirstName
	 * @param object $LastName
	 * @param object $LastName
	 * @param object $Email
	 * @param object $RoleName
	 * @param object $UserName
	 * @param object $Password
	 * @return 
	 */
	function validateUserDetails($Timestamp,$RealmName, $FirstName, $LastName, $Email, $RoleName, $UserName, $PassWord)
	{
	
		if(!$Timestamp)
	    {
	        return false;
	    }
		
		//TODO: implement any further checks as necessary
		return (
			($RealmName && strlen($RealmName) <= 50) &&
			($FirstName && strlen($FirstName) <= 25) &&
			($LastName && strlen($LastName) <= 25) &&
			($RoleName && strlen($RoleName) <= 50) &&
			($UserName && strlen($UserName) <= 100) &&
			($PassWord && strlen($PassWord) <= 25) &&
			($Email && strlen($Email) <= 250 && substr_count($Email, "@") == 1)
		);
	}
	
	/**
	 * This function checks to see if a user exists in the realm to avoid duplicate users in a realm
	 * 
	 * @param object $UserName
	 * @param object $RealmName
	 * @return 
	 */
	function userExistsInRealm($UserName, $RealmName) {
		//check the users and realm database
		//TODO: Implement this!
		return false;
	}
	
	/**
	 * This function checks to see if a user exists by user name
	 * 
	 * @param object $UserName
	 * @return 
	 */
	function userExists($UserName) {
		//check the users database
		//TODO: Implement this!
		return true;
	}
	
	/**
	 * This function checks to see if a realm exists by realm name
	 * 
	 * @param object $RealmName
	 * @return 
	 */
	function realmExists($RealmName) {
		//check the database to see if the realm exists
		//TODO: implement this
		if ($RealmName == "?")
			return true;
		return false;
	}
}
?>
