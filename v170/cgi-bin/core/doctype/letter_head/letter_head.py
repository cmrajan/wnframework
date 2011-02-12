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
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist

  def on_update(self):
    if self.doc.file_list and not self.doc.content:
      import webnotes
      file_name = self.doc.file_list.split(',')[0]
      img_link = '<div><img src="cgi-bin/getfile.cgi?name=' + file_name + '"/></div>'
      self.doc.content = img_link
      self.doc.save()
    exists = sql("select name from `tabLetter Head` where ifnull(is_default, 0) = 1 and name != '%s'" % self.doc.name)
    if exists:
      if self.doc.is_default:
        msgprint("Only one letter head can be default at the same time. To set this letter head as a default, please uncheck current default letter head: '%s'" % exists[0][0])
        raise Exception
    else:
      sql("update `tabSingles` set value = '%s' where field = 'letter_head' and doctype = 'Control Panel'" % (self.doc.is_default and self.doc.content or ''))
