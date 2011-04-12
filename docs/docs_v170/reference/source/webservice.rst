:mod:`webservice` --- Remote Framework Access via HTTP
======================================================

.. automodule:: webnotes.utils.webservice
   :synopsis: Class for Remote Framework Access via HTTP

Framework Server Class
----------------------

.. autoclass:: FrameworkServer
   :members:	

Example
-------

Connect to a remote server a run a method `update_login` on `Login Control` on a remote server::

   # connect to a remote server
   remote = FrameworkServer('s2.iwebnote.com', '/v170', 'testuser', 'testpwd', 'testaccount')
   
   # update the login on a remote server
   response = remote.runserverobj('Login Control', 'Login Control', 'update_login', session['user'])
