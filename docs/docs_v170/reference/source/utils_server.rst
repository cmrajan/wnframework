:mod:`utils` --- Utilities Module
=================================

.. automodule:: webnotes.utils
   :synopsis: Utility functions

Date and Time Functions
-----------------------

.. autodata:: user_format

.. autofunction:: webnotes.utils.getdate

.. autofunction:: webnotes.utils.add_days

.. autofunction:: webnotes.utils.now

.. autofunction:: webnotes.utils.nowdate 

.. autofunction:: webnotes.utils.get_first_day

.. autofunction:: webnotes.utils.get_last_day

.. autofunction:: webnotes.utils.formatdate 


Datatype Conversions
--------------------

.. autofunction:: webnotes.utils.dict_to_str

.. autofunction:: webnotes.utils.isNull

.. autofunction:: webnotes.utils.has_common

.. autofunction:: webnotes.utils.flt

.. autofunction:: webnotes.utils.cint

.. autofunction:: webnotes.utils.cstr

.. autofunction:: webnotes.utils.str_esc_quote

.. autofunction:: webnotes.utils.replace_newlines

.. autofunction:: webnotes.utils.parse_val

.. autofunction:: webnotes.utils.fmt_money
   
	
Defaults
--------

.. autofunction:: webnotes.utils.get_defaults

.. autofunction:: webnotes.utils.set_default


File (BLOB) Functions
---------------------

.. function:: get_file(fname)

   Returns result set of ((fieldname, blobcontent, lastmodified),) for a file of name or id `fname`


Email Functions
---------------

.. autofunction:: validate_email_add 

.. autofunction:: sendmail


Other Functions
---------------

.. autofunction:: getCSVelement 

.. autofunction:: generate_hash

.. autofunction:: getTraceback 

