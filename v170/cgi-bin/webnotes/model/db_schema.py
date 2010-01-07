# Set Column Types
# ----------------

import webnotes

sql = webnotes.conn.sql

def getcoldef(ftype, length=''):
	t=ftype.lower()
	if t in ('date','int','text','time'):
		dt = t
	elif t in ('currency'): 
		dt = 'decimal'
		if not length: length = '14,2' 
	elif t in ('float'): 
		dt = 'decimal' 
		if not length: length = '14,6' 
	elif t == 'small text':
		dt = 'text'
	elif t == 'check':
		dt = 'int'
		if not length: length = '1' 
	elif t in ('long text', 'code', 'text editor'): 
		dt = 'text';
	elif t in ('data', 'link', 'password', 'select', 'read only'):
		dt = 'varchar';
		if not length: length = '180' 
	elif t == 'blob':
		dt = 'longblob'
	else: dt = ''
	
	if length:
		dt += ('(%s)' % length)
	
	return dt

# Add Columns In Database
# -----------------------

def _validate_column_name(n):
	n = n.replace(' ','_').strip().lower()
	import re
	if not re.match("[a-zA-Z_][a-zA-Z0-9_]*$", n):
		webnotes.msgprint('err:%s is not a valid fieldname.<br>A valid name must contain letters / numbers / spaces.<br><b>Tip: </b>You can change the Label after the fieldname has been set' % n)
		raise Exception
	return n
	
def _add_column(f, dt):		
	ftype =  getcoldef(f[2], f[3])
	if ftype:
		fn = _validate_column_name(f[1]) # name or label
		sql("alter table `tab%s` add `%s` %s" % (dt, fn, ftype))

		
# Update Columns In Database
# -----------------------

def _validate_type_change(new, old):
	if ((old.lower() in ['text','small text','code','text editor']) and (new.lower() not in ['text', 'small text', 'code', 'text editor'])) or ((old.lower() in ['data','select','link']) and (new.lower() in ['date','int','currency','float','time','table'])):
		webnotes.msgprint('%s: Coversion from %s to %s is not allowed' % (new_fn, old_type, new_type_orig))
		raise Exception		

def _change_column(f, dt, col_def):
	if col_def:
		sql("alter table `tab%s` change `%s` `%s` %s" % (dt, f[0], _validate_column_name(f[1]), col_def))
		webnotes.msgprint("Column Changed: `%s` to `%s` %s" % (f[0], _validate_column_name(f[1]), col_def))
			
def updatecolumns(doctype):
	if sql("select name from tabDocField where fieldname = 'length' and parent='DocType'"):
		flist = sql(" SELECT oldfieldname, fieldname, fieldtype, `length`, oldfieldtype FROM tabDocField WHERE parent = '%s'" % doctype)
	else:
		flist = sql(" SELECT oldfieldname, fieldname, fieldtype, '', oldfieldtype FROM tabDocField WHERE parent = '%s'" % doctype)

	# list of existing columns
	cur_fields = sql("DESC `tab%s`" % (doctype))

	old_fields = [f[0] for f in flist]

	for f in flist:
		change = 0

		# not in current fields
		if not (f[1] in [e[0] for e in cur_fields]):

			# name changed
			if f[0]: change = 1
			
			# new field
			else: _add_column(f, doctype)
		
		# type or length has changed
		col_def = getcoldef(f[2], f[3])
		
		# find exisiting def
		cur_def = ''
		for e in cur_fields:
			if e[0]==f[1]:
				cur_def = e[1]
		
		# changed
		if change or (cur_def and col_def.lower() != cur_def.lower()):
			# validate type change
			_validate_type_change(f[2], f[4])
			
			_change_column(f, doctype, col_def)
	
	# update the "old" columns
	sql("start transaction")
	sql("UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent= '%s'" % doctype)


# Add Indices
# -----------

def updateindex(doctype):
	addlist = sql("SELECT DISTINCT fieldname FROM tabDocField WHERE search_index=1 and parent='%s'" % doctype)
	for f in addlist:
		try:
			sql("alter table `tab%s` add index %s(%s)" % (doctype, f[0], f[0]))
		except:
			pass

	# remove
	addlist = sql("SELECT DISTINCT fieldname FROM tabDocField WHERE IFNULL(search_index,0)=0 and parent='%s'" % doctype)
	for f in addlist:
		try:
			sql("alter table `tab%s` drop index %s" % (doctype, f[0]))
		except:
			pass

# update engine
# -------------

def update_engine(doctype=None, engine='InnoDB'):
	if doctype:
		sql("ALTER TABLE `tab%s` ENGINE = '%s'" % (doctype, engine))
	else:
		for t in sql("show tables"):
			sql("ALTER TABLE `%s` ENGINE = '%s'" % (t[0], engine))

def create_table(dt):
	sql("""
		create table `tab%s` (
			name varchar(120) not null primary key, 
			creation datetime, 
			modified datetime, 
			modified_by varchar(40), 
			owner varchar(40), 
			docstatus int(1) default 0, 
			parent varchar(120), 
			parentfield varchar(120), 
			parenttype varchar(120), 
			idx int(8),
			index parent(parent)) ENGINE=InnoDB""" % (dt))

def updatedb(doctype):
	dt = doctype.name

	# if single type, nothing to do
	if sql("select issingle from tabDocType where name=%s", dt)[0][0]:
		return

	# create table
	names = [rec[0].lower() for rec in sql('SHOW TABLES')]
	if not (('tab'+dt).lower() in names):  
		create_table(dt)

	# update columns
	updatecolumns(dt)

	# update index
	updateindex(dt)		
