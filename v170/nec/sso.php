<?php
  
ini_set("soap.wsdl_cache_enabled", "0");

require_once('./SSOServiceClass.php');

$server = new SoapServer('SSOService.wsdl');
$server->setClass('SSOServiceClass');
$server->handle();

//debug the php information
//phpinfo();

?>