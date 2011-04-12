:mod:`doctype` --- DocType
==========================

.. automodule:: webnotes.model.doctype
   :synopsis: DocType module

_DocType object
---------------------

.. method:: get

   returns a :term:`doclist` of :term:`DocType`, `dt`

.. autoclass:: _DocType
   
   .. attribute:: name
   
      name of the doctype
      
   .. automethod:: is_modified 
   
   .. method:: get_parent_dt()
   
      return the **first** parent DocType of the current doctype

   .. automethod:: make_doclist 
   
.. method:: get()

   execute `Request` to load a `DocType`
   
.. method:: update_doctype(doclist)

   method to be called to update the DocType
   
   * creates field names from labels
   * updates schema
   * saves compiled code
   * marks cache for clearing
