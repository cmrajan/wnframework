:mod:`doclist` --- Doclist Module
================================-

.. module::doclist
   :synopsis: Collection of methods that are used on a list of Document objects (doclist)

.. method:: getlist(doclist, field)

   Filter a list of records for a specific field from the full doclist

.. method:: to_html(doclist)

   Return a simple HTML format of the doclist

Methods for internal use
------------------------

.. method:: expand(docs)

   Expand a doclist sent from the client side. (Internally used by the request handler)

.. method:: compress(doclist)

   Compress a doclist before sending it to the client side. (Internally used by the request handler)

.. method:: validate_links_doclist(doclist)

   Validate link fields and return link fields that are not correct.
   Calls the `validate_links` method on the Document object
	
.. method:: getvaluelist(doclist, fieldname)

   Returns a list of values of a particualr fieldname from all Document object in a doclist

.. method:: getchildren(name, childtype, field='', parenttype=''):
	
   Returns the list of all child records of a particular record (used internally)

