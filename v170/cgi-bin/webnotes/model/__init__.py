# model __init__.py
import webnotes

sql = webnotes.conn.sql

def get_table_fields(doctype):
	return sql("select options, fieldname from tabDocField where parent='%s' and fieldtype='Table'" % doctype)

def delete_doc(doctype, name):
	tablefields = db_gettablefields(doctype)
	sql("delete from `tab%s` where name='%s' limit 1" % (doctype, name))
	for t in tablefields:
		sql("delete from `tab%s` where parent = '%s' and parentfield='%s'" % (t[0], name, t[1]))

def get_search_criteria(dt):
	# load search criteria for reports (all)
	dl = []
	try: # bc
		sc_list = sql("select name from `tabSearch Criteria` where doc_type = '%s' or parent_doc_type = '%s' and (disabled!=1 OR disabled IS NULL)" % (dt, dt))
		for sc in sc_list:
			dl += server.getdoc('Search Criteria', sc[0])
	except Exception, e:
		pass # no search criteria
	return dl

# Rename Doc
# ----------

def rename(dt, old, new, is_doctype = 0):
	# rename doc
	sql("update `tab%s` set name='%s' where name='%s'" % (dt, new, old))

	# get child docs
	ct = sql("select options from tabDocField where parent = '%s' and fieldtype='Table'" % dt)
	for c in ct:
		sql("update `tab%s` set parent='%s' where parent='%s'" % (c[0], new, old))

	# get links (link / select)
	ll = sql("select parent, fieldname from tabDocField where parent not like 'old%%' and ((options = '%s' and fieldtype='Link') or (options = 'link:%s' and fieldtype='Select'))" % (dt, dt))
	for l in ll:
		is_single = sql("select issingle from tabDocType where name = '%s'" % l[0])
		is_single = is_single and cint(is_single[0][0]) or 0
		if is_single:
			sql("update `tabSingles` set value='%s' where field='%s' and value = '%s' and doctype = '%s' " % (new, l[1], old, l[0]))
		else:
			sql("update `tab%s` set `%s`='%s' where `%s`='%s'" % (l[0], l[1], new, l[1], old))

	# doctype
	if is_doctype:
		sql("RENAME TABLE `tab%s` TO `tab%s`" % (old, new))

		# get child docs (update parenttype)
		ct = sql("select options from tabDocField where parent = '%s' and fieldtype='Table'" % new)
		for c in ct:
			sql("update `tab%s` set parenttype='%s' where parenttype='%s'" % (c[0], new, old))

def clear_recycle_bin():
	tl = sql('show tables')
	total_deleted = 0
	for t in tl:
		fl = [i[0] for i in sql('desc `%s`' % t[0])]
		
		if 'name' in fl:
			total_deleted += sql("select count(*) from `%s` where name like '__overwritten:%%'" % t[0])[0][0]
			sql("delete from `%s` where name like '__overwritten:%%'" % t[0])

		if 'parent' in fl:	
			total_deleted += sql("select count(*) from `%s` where parent like '__oldparent:%%'" % t[0])[0][0]
			sql("delete from `%s` where parent like '__oldparent:%%'" % t[0])
	
			total_deleted += sql("select count(*) from `%s` where parent like 'oldparent:%%'" % t[0])[0][0]
			sql("delete from `%s` where parent like 'oldparent:%%'" % t[0])

			total_deleted += sql("select count(*) from `%s` where parent like 'old_parent:%%'" % t[0])[0][0]
			sql("delete from `%s` where parent like 'old_parent:%%'" % t[0])

	msgprint("%s records deleted" % str(int(total_deleted)))
	
	
# Make Table Copy
# ---------------

def copytables(srctype, src, srcfield, tartype, tar, tarfield, srcfields, tarfields=[]):
	if not tarfields: 
		tarfields = srcfields
	l = []
	data = getchildren(src.name, srctype, srcfield)
	for d in data:
		newrow = addchild(tar, tarfield, tartype, local = 1)
		newrow.idx = d.idx
	
		for i in range(len(srcfields)):
			newrow.fields[tarfields[i]] = d.fields[srcfields[i]]
			
		l.append(newrow)
	return l
