Form Widget API
===============

Scripting inside Forms
----------------------


Form Events
-----------



Form Container Class
--------------------

.. data:: _f

   Namespace for the Form Widget
   
.. data:: _f.frm_con

   Global FrmContainer. There is only one instance of the Form Container

.. class:: _f.FrmContainer

   This is the object that contains all Forms. The Form Container contains the page header and Form toolbar
   that is refreshed whenever a new record is shown.
   
   .. attribute:: head
   
      Element representing the header of the form.
      
   .. attribute:: body
   
      Element represnting the page body
      
   .. method:: show_head()
   
      Show the head element
      
   .. method:: hide_head()
   
      Show the head element
      
   .. method:: add_frm(doctype, onload, opt_name)
   
      Called internally by :func:`loaddoc`. Adds a new Form of type `doctype` in the FrmContainer.
      
Form Class
----------

.. class:: _f.Frm
      
   Each doctype has a Frm object. When records are loaded on the Frm object, fields inside the form are
   refreshed
   
   .. attribute:: doctype
   
      `doctype` of the current form
      
   .. attribute:: docname
   
      `name` of the current record

   .. method:: show()
   
      Show the form
      
   .. method:: hide()
   
      Hide the form
      
   .. method:: refresh()
   
      Refresh the current form. It will
      
      * Check permission
      * If the record is changed, load the new record data
      * Refresh all fields
      
   .. method:: print_doc()
   
      Show the `Print` dialog
      
   .. method:: email_doc()
   
      Shows the `Email` dialog



   Tips
   ----

      
   .. method:: set_tip(txt)
   
      Clear existing tips and set a new tip (contextual help) in the Form
      
   .. method:: append_tip(txt)
   
      Add another tip to the existing tips
      
   .. method:: clear_tip()
   
      Clear all tips
      
   .. 
      