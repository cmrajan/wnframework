:mod:`page_body` --- Page Body Serverside Module
================================================

.. automodule:: webnotes.widgets.page_body
   :members:	
   :synopsis: Collection of methods that generate the `index.cgi` template and Crawler / Spider friendly static content
   
.. function:: get_static_content()

   Returns the static content from the permalink using the `page` property of the URL (webnotes.form)
   
   ..
      Standard format is:
   
      * Form/Ticket/T001 - renders the `Ticket` T001
      * Page/Welcome - renders the `Welcome` page
	


