:mod:`code` --- Code Execution Module
=====================================

.. automodule:: webnotes.model.code
   :synopsis: Code Execution module


Global Properties / Methods (generally) used in server side scripts
-------------------------------------------------------------------

.. data:: version
   
   "v170"
 
.. data:: NEWLINE

   "\\n" - used in plug in scripts
   	
.. function:: set 

   Same as `webnotes.conn.set`
   Sets a value 
  
.. function:: sql(query, values=(), as_dict = 0, as_list = 0, allow_testing = 1)

   Same as `webnotes.conn.sql`

.. function:: get_value

   Sames as `webnotes.conn.get_value`

.. function:: convert_to_lists

	Same as `webnotes.conn.convert_to_lists`

Module Methods
--------------

.. autofunction:: execute 
   
.. autofunction:: get_server_obj 

.. autofunction:: get_obj

.. autofunction:: run_server_obj  



