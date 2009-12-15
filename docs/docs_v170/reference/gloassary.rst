.. glossary:: DocType

   The basic building block of the Web Notes Framework. A DocType represents multiple things
   
   * A table in the database (if `is_single` is `False`)
   * A class
   * A form
   * An agent to perform certain actions
   
   A `DocType` has :term:`Fields`, :term:`Permissions` and :term:`Code`

.. glossary:: Document

   A single record wrapped by an object-relational mapper.
   The document object's properties can be set or accessed using the simple object notation. For example `doc.owner`

.. glossary:: doclist

   A list of :term:`Document` records representing a single record (along with all its child records). The first
   element in the list `doclist[0]` is the main record, the rest, if any, are child records.