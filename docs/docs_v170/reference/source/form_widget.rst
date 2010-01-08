Form Widget API
===============

Scripting Forms
----------------

Custom scripts can be written in forms by writing events in "Client Script" / "Client Script Core" in the
DocType. Some conventions for writing client scripts

* All functions should be written in the namespace `cur_frm.cscript`. This namespace is set aside
  for customized client scripts
* `cur_frm` is the global variable that represents the Current Form that is open.

See Examples

Form Events (Triggers)
----------------------

Standard Form-level Triggers are

* refresh - This is called whenever a new record is loaded, or a record is opened, or when a record is saved
* onload - This is called the first time a record is loaded
* setup - This is called the first time a Form is loaded

Some Examples::

  cur_frm.cscript.refresh = function(doc, dt, dn) {
     // set contextual help
     
     cur_frm.clear_tip();
     if(doc.city && !doc.location) cur_frm.set_tip("Its always a good idea to add location to the city");
  }

Accessing / Updating Field Objects
----------------------------------

Every input / field in the Form is an instance of the :class:`_f.Field`. The reference to the field object
can be got using `cur_frm.fields_dict` property. This is a dictionary that contains reference to all field
objects by name or label (in case there is no name). 

Properties of the field can be set by setting the `df` dictionary (which represents the `DocField`). Example::

  var f = cur_frm.fields_dict['first_name']
  f.df.hidden = 1;
  f.refresh();

Field Events (Triggers)
-----------------------

Field `onchange` triggers can be set by declaring a function in the `cur_frm.cscript` object (namespace). The
function will be called when the onchange event will be triggered. The function will be passed 3 parameters

* doc - reference to the current main record
* dt - reference to the DocType (this will be different to `doc.doctype` in case of a child (table) trigger)
* dn - reference to the DocType (this will be different to `doc.name` in case of a child (table) trigger)

Example::

  cur_frm.cscript.first_name(doc, dt, dn) {
  	if(doc.first_name.length < 3) {
  	   msgprint("First Name should atleast be 3 characters long.")	
  	}
  }


Overloading Link Field queries
------------------------------

If a filter is to be added to validate values that can be set by `Link` fields, it is necessary to
overload the exiting query method. This can be done by setting the `get_query` method on 
the `Field` object. Example::

   // standard field
   cur_frm.fields_dict['test_link'].get_query = function(doc,dt,dn) {
      return "SELECT tabDocType.name FROM tabDocType WHERE IFNULL(tabDocType.issingle,0)=0 AND tabDocType.name LIKE '%s'"
   }
   
   // field in a grid
   cur_frm.fields_dict['test_grid'].get_fields('my_link').get_query = function(doc,dt,dn) {
      return "SELECT tabDocType.name FROM tabDocType WHERE IFNULL(tabDocType.issingle,0)=0 AND tabDocType.name LIKE '%s'"
   }   

Setting contextutal help (Tips)
-------------------------------

Contextual help can be set using the :meth:`_f.Frm.set_tip`, :meth:`_f.Frm.append_tip`, :meth:`_f.Frm.clear_tip`
methods. See Examples::

  cur_frm.cscript.refresh = function(doc, dt, dn) {
     // set contextual help
     
     cur_frm.clear_tip();
     if(doc.city && !doc.location) cur_frm.set_tip("Its always a good idea to add location to the city");
  }


Custom UI using the HTML Field
------------------------------

Custom UI Objects can be added to forms by using the HTML field. The object can be added in the form wrapper
and reset with latest values on the `refresh` event. Example::

  cur_frm.cscript.refresh = function(doc, dt, dn) {
     var cs = cur_frm.cscript;
     if(!cs.my_object) {
     	
     	// lets add a listing
        cs.my_object = new Listing();
        ..
        ..	
     }
     
     cs.my_object.refresh();
  }

Useful API Methods
------------------

.. function:: get_server_fields(method, arg, table_field, doc, dt, dn, allow_edit, call_back)

   Update the values in the current record by calling a remote method. Example Client Side::
   
      cur_frm.cscript.contact_person = function(doc, cdt, cdn) {
        if(doc.contact_person) {
          var arg = {'customer':doc.customer_name,'contact_person':doc.contact_person};
          get_server_fields('get_contact_details',docstring(arg),'',doc, cdt, cdn, 1);
        }
      }
      
   Server side version::
   
      def get_contact_details(self, arg):
        arg = eval(arg)
        contact = sql("select contact_no, email_id from `tabContact` where contact_name = '%s' and customer_name = '%s'" %(arg['contact_person'],arg['customer']), as_dict = 1)
        ret = {
          'contact_no'       :    contact and contact[0]['contact_no'] or '',
          'email_id'         :    contact and contact[0]['email_id'] or ''
        }
        return str(ret)   

.. function:: $c_get_values(args, doc, dt, dn, user_callback) 

   Similar to get_server_fields, but no serverside required::
   
      cur_frm.cscript.item_code = function(doc, dt, dn) {
        var d = locals[dt][dn];

        $c_get_values({
          fields:'description,uom'       // fields to be updated
          ,table_field:'sales_bom_items'           // [optional] if the fields are in a table
          ,select:'description,stock_uom' // values to be returned
          ,from:'tabItem'
          ,where:'name="'+d.item_code+'"'
        }, doc, dt, dn);
      }
   
   
.. function:: set_multiple(dt, dn, dict, table_field)

   Set mutliple values from a dictionary to a record. In case of Table, pass `tablefield`
   
.. function:: refresh_many(flist, dn, table_field)

   Refresh multiple fields. In case of Table, pass `tablefield`

.. function:: refresh_field(n, docname, table_field)

   Refresh a field widget. In case of a table record, mention the `table_field` and row ID `docname`

.. function:: set_field_tip(fieldname, txt)

   Set `txt` comment on a field

.. function:: set_field_options(n, options)

   Set `options` of a field and `refresh`

.. function:: set_field_permlevel(n, permlevel)

   Set `permlevel` of a field and `refresh`

.. function:: hide_field(n)

   Hide a field of fieldname `n` or a list of fields `n`

.. function:: unhide_field(n)

   Unhide a field of fieldname `n` or a list of fields `n`


Using Templates
---------------

The standard Form UI Engine can be overridden using the templates. The `template` is HTML code and can be
set in the `template` field of the DocType. To render fields in the template, Element IDs must be set in a 
specific pattern. The pattern is

* frm_[DocType]_[fieldname]

See Example::
  
  <h1>Contact Form</h1>
  <table>
    <tr>
      <td>First Name</td>
      <td id="frm_Contact_first_name"></td>
    </tr>
    <tr>
      <td>Last Name</td>
      <td id="frm_Contact_last_name"></td>
    </tr>
    <tr>
      <td>Email ID</td>
      <td id="frm_Contact_email"></td>
    </tr>
    <tr>
      <td></td>
      <td><button onclick="cur_frm.save('Save', function() { loadpage('Thank You'); })">Save</button></td>
    </tr>
  </table>

Form Container Class
--------------------

.. data:: _f

   Namespace for the Form Widget
   
.. data:: _f.frm_con

   Global FrmContainer. There is only one instance of the Form Container

.. function:: _f.get_value(dt, dn, fn)

   Returns the value of the field `fn` from DocType `dt` and name `dn`
   
.. function:: _f.get_value(dt, dn, fn, v)

   Sets value `v` in the field `fn` of the give `dt` and `dn`
   
   * Will also set the record as __unsaved = 1
   * Will refresh the display so that the record is set as "Changes are not saved"

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

   .. attribute:: fields
   
      List of all `Field` objects in the form
      
   .. attribute:: fields_dict
   
      Dictionary of all `Field` objects in the form, identified by the `fieldname` or `label` (if no fieldname)
      exists

   .. attribute:: sections
   
      List of all sections known by section id (`sec_id`). (Id because Sections may not have headings / labels)
      
   .. attribute:: sections_by_label
   
      Dictionary of all sections by label. This can be used to switch to a particular section. Example::
      
         cur_frm.set_section(cur_frm.sections_by_label['More Details'].sec_id);

   .. method:: show()
   
      Show the form
      
   .. method:: hide()
   
      Hide the form
   
   .. method:: sec_section(sec_id)
   
      Show the section identified by
   
   .. method:: refresh()
   
      Refresh the current form. It will
      
      * Check permission
      * If the record is changed, load the new record data
      * Run 'refresh' method
      * Refresh all fields
      * Show the form
      
   .. method:: refresh_fields()
   
      Will refresh all fields
      
   .. method:: refresh_dependancy()
   
      Will refresh hide / show based on 'depends_on'
   
   .. method:: save(save_action, call_back)
   
      Will save the current record (function called from the "Save" button)
      
      save_action can be `Save`, `Submit`, `Cancel`
      
   .. method:: print_doc()
   
      Show the `Print` dialog
      
   .. method:: email_doc()
   
      Shows the `Email` dialog
      
   .. method:: copy_doc()
   
      Copy the current record
      
   .. method:: reload_doc()
   
      Reload the current record from the server
      
   .. method:: amend_doc()
   
      Amend the current Cancelled record
      
   .. method:: check_required(dt, dn)
   
      Checks whether all mandatory fields are filled
   
   .. method:: runscript(scriptname, callingfield, onrefresh)
   
      Run a server-side script where Trigger is set as `Server`. The server method is identified by
      `scriptname`
      
   .. method:: runclientscript(caller, cdt, cdn)
   
      Run a client script identified by the calling fieldname `caller`. `cdt` and `cdn` are the
      id of the calling `DocType and `name`
      
   .. method:: set_tip(txt)
   
      Clear existing tips and set a new tip (contextual help) in the Form
      
   .. method:: append_tip(txt)
   
      Add another tip to the existing tips
      
   .. method:: clear_tip()
   
      Clear all tips
      
Field Class
-----------

.. class:: _f.Field()

  .. attribute:: df
  
     the `df` attribute represents the Field data. Standard Field properties are
     
     * fieldname
     * fieldtype
     * options
     * permlevel
     * description
     * reqd
     * hidden
     * search_index
     
     Example::
     
        var field = cur_frm.fields_dict['first_name']
        field.df.reqd = 1;
        field.refresh();

  .. attribute:: wrapper
  
     Wrapping DIV Element
     
  .. attribute:: label_area
  
     HTML Element where the label of the field is printed
     
  .. attribute:: disp_area
  
     HTML Element where the value of the field is printed in "Read" mode

  .. attribute:: input_area
  
     HTML Element where the widget is placed in "Write" mode

  .. attribute:: comment_area
  
     HTML Element where the comment (description) is printed

  .. attribute:: parent_section
  
     If the `section_style` of the doctype is `Tray` or `Tabbed`, then this represents the SectionBreak
     object in which this field is. This is used to switch to the section in case of an error.

  .. method:: get_status()
  
     Retuns the whether the field has permission to `Read`, `Write` or `None`
  
  .. method:: set(v)
  
     Sets a value to the field. Value is set in `locals` and the widget
     
  .. method:: run_trigger()
  
     Runs any client / server triggers. Called `onchange`

Grid Class
----------

.. class:: _f.FormGrid()

   The FromGrid Class inherits from the Grid class. The Grid class was designed to be a generic INPUT.
   
   * The metadata of the grid is defined by the `DocType` of the `Table` field.
   * Each column of the grid represents a field.
   * Each row of the grid represents a record

   **Grid Types**
   
   There are two type of Grids:
   
   #. Standard: Where fields can be edited within the cell
   #. Simple: Where fields are edited in a popup Dialog box. A Simple Grid can be created by setting the 
      `default` property of the Table field to "Simple"

   When the user clicks on an editable Grid cell, it adds an `Field` object of that particular column to the
   cell so that the user can edit the values inside the cell. This `Field` object is known as the `template`
   The `template` can be accessed by the `get_field` method
   
   .. method:: get_field(fieldname)
   
      Returns the `template` (`Field` object) identified by `fieldname`
      
   .. method:: refresh()
   
      Refresh all data in the Grid

Examples
--------

