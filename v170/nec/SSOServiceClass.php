<?php

//Soap Exception Fault Codes
define('ERROR_CODE_CLIENT', "Client");
define('ERROR_CODE_SERVER', "Server");

//Exception Types
define('ERROR_CODE_USER_DATA', 'ValidationException');
define('ERROR_CODE_AUTH', 'AuthenticationException');
define('ERROR_CODE_INTERNAL_SERVER_ERROR', 'InternalException');
define('ERROR_CODE_INVALID_SESSION', 'InvalidSessionException');

/**
 * 
 * This class handles the Single Sign-On Soap Requests
 *  
 */
class SSOServiceClass {
	
	/**
	 * Create an exception 
	 * 
	 * <ns2:ValidationException xmlns:ns2="http://service.globalsaas.com/soap/">
     *    <message>ID is not provided</message>
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
		elseif($exception == ERROR_CODE_INTERNAL_SERVER_ERROR)
		{
			$error_code = ERROR_CODE_SERVER;
			$detail->InternalException = $typedException;
		}
		elseif($exception == ERROR_CODE_AUTH)
		{
			$detail->AuthenticationException = $typedException;
		}
		elseif($exception == ERROR_CODE_INVALID_SESSION)
		{
			$detail->InvalidSessionException = $typedException;
		}
		return new SoapFault($error_code,$exception,null,$detail,$exception);
	}
	
	/**
	 * This method implements the logout procedure for users using SSO
	 * See the specification document for additional details.
	 * 
	 * @param object $LogoutRequest
	 * 
	 * @return 
	 */
	function Logout($LogoutRequest)
	{
		$num_of_args = func_num_args();
 
		if(func_num_args()<1)
        {
            error_log("SSOService:Logout - Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"SSOService:Logout - Invalid Request passed into the Logout method");
        }
		
		$timestamp = strftime($LogoutRequest->Timestamp);
		$SessionId = $LogoutRequest->SessionId;
		
		if(!$timestamp)
		{
			//TODO: Implement time synchornization strategy
			error_log("SSOService:Logout - Invalid timestamp passed in.");
			return $this->createException(ERROR_CODE_USER_DATA, "SSOService:Logout - Invalid timestamp passed in.");
		}
		
		if(!$SessionId)
		{
			error_log("SSOService:Logout - Invalid Session");
			return $this->createException(ERROR_CODE_INVALID_SESSION, "SSOService:Logout - Invalid Session");
		}
		
		try
		{
			//TODO: Implement the correct logout logic
			$result = new StdClass();
			$result->TimestampOfLastLogin = $timestamp;
			
			return $result;
		}
		catch(Exception $e)
		{
			error_log("SSOService:Logout -> Unexpected error occured when attempting to log out");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"SSOService:Logout - Unexpected error occured when attempting to log out");
		}
	}
	
	function PostRequest($url, $referer, $_data) {
	 
	 
	    // parse the given URL
	    $url = parse_url($url);
	    if ($url['scheme'] != 'http') { 
		die('Only HTTP request are supported !');
	    }
	 
	    // extract host and path:
	    $host = $url['host'];
	    $path = $url['path'];
	 
	    // open a socket connection on port 80
	    $fp = fsockopen($host, 80);
	 
	    // send the request headers:
	    fputs($fp, "POST $path HTTP/1.1\r\n");
	    fputs($fp, "Host: $host\r\n");
	    fputs($fp, "Referer: $referer\r\n");
	    fputs($fp, "Content-type: application/x-www-form-urlencoded\r\n");
	    fputs($fp, "Content-length: ". strlen($data) ."\r\n");
	    fputs($fp, "Connection: close\r\n\r\n");
	    fputs($fp, $data);
	 
	    $result = ''; 
	    while(!feof($fp)) {
		// receive the results of the request
		$result .= fgets($fp, 128);
	    }
	 
	    // close the socket connection:
	    fclose($fp);
	 
	    // split the result header from the content
	    $result = explode("\r\n\r\n", $result, 2);
	 
	    $header = isset($result[0]) ? $result[0] : '';
	    $content = isset($result[1]) ? $result[1] : '';
	 
	    // return as array:
	    return array($header, $content);
	}
	 


	/**
	 * This method implements the login procedure for users using SSO.
	 * See the specification document for additional information.
	 * 
	 * @param object $LoginRequest
	 * 
	 * @return 
	 */
	function Login($LoginRequest) 
	{
	//Just a http request with the arguments passed.
	if(func_num_args()<1)
	
        {
            error_log("SSOService:Login - Incorrect number of parameters passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"Invalid Request passed in to Logout method");	
        }
        
		self.base_url = $http = "http://brownie.s5.iwebnotes.com/v170/index.cgi?";	
	        $UserName = $LoginRequest->UserName;
		$Timestamp = $LoginRequest->Timestamp;
		$UserName = $LoginRequest->UserName;
		$PassWord = $LoginRequest->PassWord;
		
		$timestamp = strftime($Timestamp);
		
		$cookie_value = array($UserName,$Password,'login');
		$cookies_array = array("UserName","Password","cmd");  //,"acx",) not needed at the moment but can be useful in the future.
		
		for ($i = 0;$i < sizeof($cookies_array); ++$i)
		{
			
			$data[$i] = "$cookies_array[$i]=$cookies_value";
		}

		$data = implode('&',$data);
		echo $data;
		$result = self.PostRequest(self.$base_url,'http://localhost',$data);
		echo $result
		if(!$timestamp)
		{
			//TODO: Implement time synchornization strategy
			error_log("SSOService:Login - Invalid timestamp passed in.");
			return $this->createException(ERROR_CODE_USER_DATA,"SSOService:Login - Invalid timestamp passed in.");
		}
		
		try
		{
			//TODO: Implement the correct login logic
			if($UserName == 'username' && $PassWord == 'wrongpassword')
			{
				return $this->createException(ERROR_CODE_AUTH,"SSOService:Login - Wrong username and password");
			}
			else
			{
				$result = new StdClass();
				$result->ValidTo = $timestamp;
				$result->SessionId = "Logged in to PHP Web Service";
			}
			return $result;
		}
		catch(Exception $e)
		{
			error_log("SSOService:Login - Unexpected error occured when attempting to log in");
			return $this->createException(ERROR_CODE_INTERNAL_SERVER_ERROR,"SSOService:Login - Unexpected error occured when attempting to log in");
		}
	}
}

?>
