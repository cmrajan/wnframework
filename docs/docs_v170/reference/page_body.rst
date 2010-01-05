:mod:`module` --- Page Body Serverside Module
=============================================

.. module:: page_body
   :synopsis: Collection of methods that generate the `index.cgi` template and Crawler / Spider friendly
   static content
   
.. attribute:: index_template

   HTML Template of index.cgi
   
.. method:: get_page_content(page)

   Gets the HTML content from `static_content` or `content` property of a `Page`

.. method:: get_doc_content(dt, dn)

   Gets the HTML content of a document record by using the overridden or standard :method: `doclist.to_html`

.. method:: get_static_content()

   Returns the static content from the permalink using the `page` property of the URL (webnotes.form)
   
   ..
      Standard format is:
   
      * Form/Ticket/T001 - renders the `Ticket` T001
      * Page/Welcome - renders the `Welcome` page
	
.. method:: get()

   returns the full rendered index.cgi
   Gets `keywords` and `site_description` from the `Control Panel`
