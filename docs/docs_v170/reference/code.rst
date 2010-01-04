:mod:`code` --- Code Execution Module
=====================================

.. module::code
   :synopsis: Code Execution module

This is where all the plug-in code is executed. The standard method for DocTypes is declaration of a 
standardized `DocType` class that has the methods of any DocType. When an object is instantiated using the
`get_obj` method, it creates an instance of the `DocType` class of that particular DocType and sets the 
`doc` and `doclist` attributes that represent the fields (properties) of that record.

Following modules are declared for backward compatibility

.. method:: execute(code, doc=None, doclist=[])
   
   Execute the code, if doc is given, then return the instance of the `DocType` class created
	
.. method:: get_server_obj(doc, doclist = [], basedoctype = '')

   Returns the instantiated `DocType` object. Will also manage caching & compiling

.. method:: get_obj(dt = None, dn = None, doc=None, doclist=[], with_children = 0)

   Returns the instantiated `DocType` object. Here you can pass the DocType and name (ID) to get the object.
   If with_children is true, then all child records will be laoded and added in the doclist.
      
.. method:: run_server_obj(server_obj, method_name, arg=None)

   Executes a method from the given server_obj
   
