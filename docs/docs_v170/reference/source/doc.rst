:mod:`doc` --- Document (ORM)
=============================

.. automodule:: webnotes.model.doc
   :synopsis: Document (ORM) Module

.. autofunction:: webnotes.model.doc.get

Document object
---------------

.. autoclass:: Document
   :members: save,clear_table,addchild

   .. attribute:: fields

      Dictionary containing the properties of the record. This dictionary is mapped to the getter and setter
   
Standard methods for API
------------------------
   
.. autofunction:: webnotes.model.doc.addchild
   
.. autofunction:: webnotes.model.doc.removechild

			
Naming
------

.. autofunction:: make_autoname


Inheritance
-----------

.. class:: BaseDocType:
   
   The framework supports simple inheritance using the BaseDocType class.
   It creates the base object and saves it in the property `super`. The getter then tries to retrive the
   property from the `super` object if it exsits before retrieving it from the current record.
   
   
Example
-------

Open an existing Contact::

  c = Document('Contact', 'ABC')
  c.phone_number = '233-3432'
  c.save()

Create a new Contact::

  c = Document('Contact')
  c.name = 'XYZ'
  c.phone_number = '342-3423'
  c.email_id = 'xyz@foo.com'
  c.save(new = 1)
  
