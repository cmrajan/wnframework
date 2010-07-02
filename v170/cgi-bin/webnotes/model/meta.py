# metadata

import webnotes

def get_index_fields(dt, index=0):
	return webnotes.conn.sql("SELECT DISTINCT fieldname FROM tabDocField WHERE IFNULL(search_index,0)=%s and parent=%s", (index, dt))

# get fields in a doctype
#=================================================================================
	
def get_dt_fields(doctype):
	sql = webnotes.conn.sql
	if sql("select name from tabDocField where fieldname = 'length' and parent='DocType'"):
		fl = sql(" SELECT oldfieldname, fieldname, fieldtype, `length`, oldfieldtype, search_index FROM tabDocField WHERE parent = '%s'" % doctype)
	else:
		fl = sql(" SELECT oldfieldname, fieldname, fieldtype, '', oldfieldtype, search_index FROM tabDocField WHERE parent = '%s'" % doctype)

	return fl
	
#=================================================================================

def update_oldfield_values(doctype):
	webnotes.conn.sql("UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent= '%s'" % doctype)
	
#=================================================================================

def get_dt_values(doctype, fields, as_dict = 0):
	return webnotes.conn.sql('SELECT %s FROM tabDocType WHERE name="%s"' % (fields, doctype), as_dict = as_dict)

def set_dt_value(doctype, field, value):
	return webnotes.conn.set_value('DocType', doctype, field, value)

def is_single(doctype):
	return get_dt_values(doctype, 'issingle')[0][0]
#=================================================================================

def get_parent_dt(dt):
	parent_dt = webnotes.conn.sql('select parent from tabDocField where fieldtype="Table" and options="%s" and (parent not like "old_parent:%%") limit 1' % dt)
	return parent_dt and parent_dt[0][0] or ''

#=================================================================================

def set_fieldname(field_id, fieldname):
	webnots.conn.set_value('DocField', field_id, 'fieldname', fieldname)

#=================================================================================

def get_link_fields(doctype):
	return webnotes.conn.sql("SELECT fieldname, options, label FROM tabDocField WHERE parent='%s' and (fieldtype='Link' or (fieldtype='Select' and `options` like 'link:%%'))" % (doctype))

#=================================================================================

def get_table_fields(doctype):
	return webnotes.conn.sql("select options, fieldname from tabDocField where parent='%s' and fieldtype='Table'" % doctype)
	
#=================================================================================

def get_search_criteria(dt):
	import webnotes.model.doc
	# load search criteria for reports (all)
	dl = []
	sc_list = webnotes.conn.sql("select name from `tabSearch Criteria` where doc_type = '%s' or parent_doc_type = '%s' and (disabled!=1 OR disabled IS NULL)" % (dt, dt))
	for sc in sc_list:
		dl += webnotes.model.doc.get('Search Criteria', sc[0])
	return dl

#=================================================================================

def get_print_format_html(name):
	html = webnotes.conn.sql('select html from `tabPrint Format` where name="%s"' % name)[0][0]
	return html and html[0][0] or ''
	