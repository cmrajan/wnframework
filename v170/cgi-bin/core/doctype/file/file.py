# Please edit this list and import only required elements
import webnotes

from webnotes.utils import add_days, add_months, add_years, cint, cstr, date_diff, default_fields, flt, fmt_money, formatdate, generate_hash, getTraceback, get_defaults, get_first_day, get_last_day, getdate, has_common, month_name, now, nowdate, replace_newlines, sendmail, set_default, str_esc_quote, user_format, validate_email_add
from webnotes.model import db_exists
from webnotes.model.doc import Document, addchild, removechild, getchildren, make_autoname, SuperDocType
from webnotes.model.doclist import getlist, copy_doclist
from webnotes.model.code import get_obj, get_server_obj, run_server_obj, updatedb, check_syntax
from webnotes import session, form, is_testing, msgprint, errprint

set = webnotes.conn.set
sql = webnotes.conn.sql
get_value = webnotes.conn.get_value
in_transaction = webnotes.conn.in_transaction
convert_to_lists = webnotes.conn.convert_to_lists
	
# -----------------------------------------------------------------------------------------


class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d,dl
    
  def validate(self):
    if not self.doc.file_list:
      msgprint("Warning: No files attached")

    # set mime type
    if not self.doc.mime_type:
      import mimetypes
      self.doc.mime_type = mimetypes.guess_type(self.doc.name)[0] or 'application/unknown'

    if not self.doc.file_name:
      fname = self.doc.file_list.split(',')[0]
      self.doc.file_name = fname