:mod:`doclist` --- Doclist Module
=================================

.. module:: webnotes.model.doclist
   :synopsis: Collection of functions that are used on a list of Document objects (doclist)

.. autofunction:: getlist

.. autofunction:: copy_doclist

.. autofunction:: to_html

functions for internal use
---------------------------

.. autofunction:: expand

.. autofunction:: compress

.. autofunction:: validate_links_doclist 

.. autofunction:: getvaluelist

.. function:: getchildren(name, childtype, field='', parenttype='')
	
   Returns the list of all child records of a particular record (used internally)

