Page Structure and Navigation
=============================

Opening existing resources (Pages, Forms etc)
---------------------------------------------

.. function:: loaddoc(doctype, name, onload, menuitem) 

   Open an exiting record (`doctype`, `name`) from the server or :term:`Locals`
   
   Optionally you can specify onload method and menuitem. If menuitem is specified, it will show the menuitem
   as selected whenever the record is reloaded.
   
.. function:: new_doc(doctype, onload)

   Open a new record of type `doctype`
   
.. function:: loadpage(page_name, call_back, menuitem)

   Open the page specified by `page_name`. If menuitem is specified, it will show the menuitem
   as selected whenever the page is reloaded.
   
.. function:: loadreport(doctype, rep_name, onload, menuitem, reset_report)

   Open the report builder of the given `doctype`. Optionally if `rep_name` is specified, it will
   open the corresponding :term:`Search Criteria` identified by `criteria_name`
   
History
-------

