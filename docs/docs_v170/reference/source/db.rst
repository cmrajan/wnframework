:mod:`db` --- Database
======================

.. automodule:: webnotes.db
   :synopsis: Database Module

database object --- conn
------------------------

.. autoclass:: Database
   :members:
	
   .. attribute:: host
   
      Database host or 'localhost'
      
   .. attribute:: user
   
      Database user
      
   .. attribute:: password
   
      Database password - cleared after connection is made
      
   .. attribute:: is_testing
   
      1 if session is in `Testing Mode` else 0

   .. attribute:: in_transaction
   
      1 if connection is in a Transaction else 0

   .. attribute:: testing_tables
   
      list of tables, tables with `tab` + doctype

   .. method:: connect()
   
   .. method:: use(db_name)
   
   .. method:: set_db(account)
   
      Switch to database of given `account`
   

