:mod:`auth` --- Authentication
==============================

Authentication object
---------------------

.. class:: Authentication(self, form, in_cookies, out_cookies, out)
   
   A new Authenticate object is created at the beginning of any request. It will manage login, session and
   cookie management. :method:update must be called at the end of the request so that the cookies and
   session object will be updated.
   
   To enable a login, the :object:form must have a cmd = "login" (see request handling for more details)
   
   .. attribute::conn
   
      `webnotes.db.Database` object created after authentication
      
   .. attribute::session
   
      session dictionary of the current session
   
   .. method::set_env()
   
   	  Sets the properties `domain` and `remote_ip` from the environmental variables 
   	  
   .. method::set_db()
   
      In case of a multi-database system, this methods sets the correct database connection.
      
      * It will first search for cookie `account_id`
      * It will next search for cookies or form variable `__account`
      * It will try and search from the domain mapping table `Account Domain` in the `accounts` database
      * It will try and use the default
   
