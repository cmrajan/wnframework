import webnotes

sql = webnotes.conn.sql

# main function
# -------------------------

def archive_doc(doctype, name, restore=0):
	archive_record(doctype, name, restore)
	
	tables = sql("select options from tabDocField where parent=%s and fieldtype='Table'", doctype)
	for t in tables:
		try:
			rec_list = sql("select name from `%s%s` where parent=%s" % ((restore and 'arc' or 'tab') ,t[0], '%s'), name)
		except Exception,e:
			if e.args[0]==1146: # no child table
				rec_list = []
			else:
				raise e
		
		for r in rec_list:
			archive_record(t[0], r[0], restore)

# archive individual record
# -------------------------

def archive_record(doctype, name, restore = 0):
	src_tab = (restore and 'arc' or 'tab') + doctype
	tar_tab = (restore and 'tab' or 'arc') + doctype

	# get the record
	try:
		rec = sql("select * from `%s` where name=%s for update" % (src_tab, '%s'), name, as_dict=1)[0]
	except Exception, e:
		if e.args[0]==1146:
			return # source table does not exist
		else:
			raise e
	
	# insert the record
	insert_record(doctype, tar_tab, name)
	
	# put it field by field (ignore missing columns)
	for field in rec.keys():
		if rec.get(field):
			update_value(src_tab, tar_tab, name, rec, field)

	# delete from main
	try:
		sql("delete from `%s` where name=%s limit 1" % (src_tab, '%s'), name)
	except Exception, e:
		if e.arg[0]==1451:
			webnotes.msgprint("Cannot archive %s '%s' as it is referenced in another record. You must delete the referred record first" % (doctype, name))

# insert the record
# -------------------------

def insert_record_name(tab, name):
	sql("insert ignore into `%s` (name) values (%s)" % (tab, '%s'), name)

# insert record
# -------------------------

def insert_record(doctype, tar_tab, name):
	try:
		insert_record_name(tar_tab, name)
	except Exception, e:
		if e.args[0]==1146: 
			# missing table - create it
			from webnotes.model.db_schema import updatedb
			updatedb(doctype, 1)
			
			# again
			insert_record_name(tar_tab, name)
		else:
			raise e

# update single value
# -------------------------

def update_single_value(tab, field, value, name):
	sql("update `%s` set `%s`=%s where name=%s" % (tab, field, '%s', '%s'), (value, name))


# update value
# -------------------------

def update_value(src_tab, tar_tab, name, rec, field):
	try:
		update_single_value(tar_tab, field, rec[field], name)
	except Exception, e:
		if e.args[0]==1054:
			# column missing.... add it?
			ftype = sql("show columns from `%s` like '%s'" % (src_tab, field))[0][1]
			
			webnotes.conn.commit() # causes implict commit
			sql("alter table `%s` add column `%s` %s" % (tar_tab, field, ftype))
			webnotes.conn.begin()
			
			# again
			update_single_value(tar_tab, field, rec[field], name)
		else:
			raise e

