# Set Column Types
# ----------------

import webnotes

# prefer Application Database for the schema (if exists)
sql = webnotes.app_conn and webnotes.app_conn.sql or webnotes.conn.sql

def getcoldef(ftype, length=''):
	t=ftype.lower()
	if t in ('date','text','time'):
		dt = t
	elif t == 'int':
		dt = 'int'
		if not length: length = '11'
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
		# always user db
		webnotes.conn.sql("alter table `tab%s` add `%s` %s" % (dt, fn, ftype))

		
# Update Columns In Database
# -----------------------

def _validate_type_change(new, old):
	if not old:
		return
	if ((old.lower() in ['text','small text','code','text editor']) and (new.lower() not in ['text', 'small text', 'code', 'text editor'])) or ((old.lower() in ['data','select','link']) and (new.lower() in ['date','int','currency','float','time','table'])):
		webnotes.msgprint('Coversion from %s to %s is not allowed. Please contact your Administrator' % (new, old))
		raise Exception		

def _change_column(f, dt, col_def):
	if col_def and f[0]:
		# always user db
		try:
			webnotes.conn.sql("alter table `tab%s` change `%s` `%s` %s" % (dt, f[0], _validate_column_name(f[1]), col_def))
		except Exception, e:
			if e.args[0] == 1054:
				_add_column(f, dt)
			if e.args[0] == 1060:
				pass # duplicate column (already exists by another name)
			else:
				raise e
		#webnotes.msgprint("Column Changed: `%s` to `%s` %s" % (f[0], _validate_column_name(f[1]), col_def))

def _get_dt_fields(doctype):
	if sql("select name from tabDocField where fieldname = 'length' and parent='DocType'"):
		fl = sql(" SELECT oldfieldname, fieldname, fieldtype, `length`, oldfieldtype, search_index FROM tabDocField WHERE parent = '%s'" % doctype)
	else:
		fl = sql(" SELECT oldfieldname, fieldname, fieldtype, '', oldfieldtype, search_index FROM tabDocField WHERE parent = '%s'" % doctype)

	fl2 = _get_custom_fields(doctype)
	if fl2:
		return fl + fl2
	else:
		return fl

def _get_custom_fields(doctype):
	if 'tabCustom Field' in  [t[0] for t in sql("show tables")]:
		return webnotes.conn.sql(" SELECT '', fieldname, fieldtype, '', '', 0 FROM `tabCustom Field` WHERE dt = '%s' and ifnull(docstatus, 0) < 2" % doctype)

			
def updatecolumns(doctype):

	flist = _get_dt_fields(doctype)


	# list of existing columns - always from user db
	cur_fields = webnotes.conn.sql("DESC `tab%s`" % (doctype))

	for f in flist:
		change = 0

		# not in current fields
		if not (f[1] in [e[0] for e in cur_fields]):

			# name changed --- will not work in add_conn
			#if (not webnotes.app_conn) and f[0]: change = 1
			
			# new field
			#else: 
			_add_column(f, doctype)
		
		# type or length has changed
		col_def = getcoldef(f[2], f[3])
		
		# find exisiting def
		cur_def = ''
		for e in cur_fields:
			if e[0]==f[1]:
				cur_def = e[1]
				break
		
		# changed
		if change or (cur_def and col_def.lower() != cur_def.lower()):
			# validate type change
			if f[4]:
				_validate_type_change(f[2], f[4])				
				_change_column(f, doctype, col_def)
	
	# update the "old" columns
	sql("start transaction")
	sql("UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent= '%s'" % doctype)


# Add Indices
# -----------

def updateindex(doctype):
	addlist = sql("SELECT DISTINCT fieldname FROM tabDocField WHERE IFNULL(search_index,0)=1 and parent='%s'" % doctype)
	
	# get keys
	kl = [i[4] for i in webnotes.conn.sql("show keys from `tab%s`" % doctype)]

	for f in addlist:
		try:
			if not f[0] in kl: # if not exists
				webnotes.conn.sql("alter table `tab%s` add index %s(%s)" % (doctype, f[0], f[0]))
		except:
			pass

	# remove
	addlist = sql("SELECT DISTINCT fieldname FROM tabDocField WHERE IFNULL(search_index,0)=0 and parent='%s'" % doctype)
	for f in addlist:
		try:
			if f[0] in kl: # if exists
				webnotes.conn.sql("alter table `tab%s` drop index %s" % (doctype, f[0]))
		except:
			pass

# update engine
# -------------

def update_engine(doctype=None, engine='InnoDB'):
	if doctype:
		webnotes.conn.sql("ALTER TABLE `tab%s` ENGINE = '%s'" % (doctype, engine))
	else:
		for t in sql("show tables"):
			webnotes.conn.sql("ALTER TABLE `%s` ENGINE = '%s'" % (t[0], engine))

def create_table(dt):
	
	# get fields specified from docfields
	add_fields, add_index = [], []
	
	# build
	flist = _get_dt_fields(dt)
	fname_list = []
	for f in flist:
		ft = getcoldef(f[2], f[3])
		if f[1] and ft and (f[1] not in ['name','creation','modified','modified_by','owner','docstatus','parent','parenttype','parentfield','idx']):
			
			if not f[1] in fname_list: # check for duplicate
				add_fields.append('`' + f[1] + '` ' + ft)
				
				fname_list.append(f[1])
				
				if f[5]:
					if not ft.startswith('text'):
						add_index.append('index `' + f[1] + '`(`' + f[1] + '`)')

	add_fields = add_fields and (', '.join(add_fields) + ', ') or ''
	
	# add indexes
	add_fields += add_index and (', '.join(add_index) + ', ') or ''

	# add indexes

	# make the query
	q = """create table `tab%s` (
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
			%s
			index parent(parent)) ENGINE=InnoDB""" % (dt, add_fields)
		
	# execute
	webnotes.conn.sql(q)

def updatedb(dt):
	# if single type, nothing to do
	if sql("select issingle from tabDocType where name=%s", dt)[0][0]:
		return

	# create table
	names = [rec[0].lower() for rec in webnotes.conn.sql('SHOW TABLES')]
	if not (('tab'+dt).lower() in names):  
		create_table(dt)

	else:
		# update columns
		updatecolumns(dt)
	
		# update index
		updateindex(dt)

# Synchronize tables from Application Database, if exists
# -------------------------------------------------------

def sync_all(verbose=0):
	# check the last modified table, if this table is also modified in the current, then the system
	# synched, if not then it must be synched
	t1 = webnotes.app_conn.sql("SELECT MAX(modified) from `tabDocType`" )
	try:
		t2 = webnotes.conn.sql("SELECT MAX(modified) from `tabDocType Update Register`", ignore_no_table = 0)
	except Exception, e:
		if e.args[0] == 1146:
			create_adt_update_table()
			if verbose:
				webnotes.msgprint("Created `tabDocType Update Register`")
			t2 = None
		else:
			raise e
	
	if t2 and verbose:
		webnotes.msgprint('Target last updated on: ' + str(t2[0][0]))
		webnotes.msgprint('Source last updated on: ' + str(t2[0][0]))
			
	if t1 and t2 and t1[0][0] == t2[0][0]:
		# all clear
		if verbose:
			webnotes.msgprint("Nothing to sync")
		pass
	else:
		# sync all tables (?)
		tl = webnotes.app_conn.sql("select name from tabDocType")
		for t in tl:
			sync_dt(t[0])
			if verbose:
				webnotes.msgprint("Synched %s" % t[0])

# create update register
# ----------------------

def create_adt_update_table():
	webnotes.conn.sql('COMMIT')

	webnotes.conn.sql("""
		create table `tabDocType Update Register` (
			name varchar(120) not null primary key, 
			modified datetime) ENGINE=InnoDB""")

	webnotes.conn.sql('START TRANSACTION')

def _sync_dt(dt, issingle):
	if issingle:
		# compile the code
		import webnotes.model.doctype
		webnotes.model.doctype.get(dt)
	else:
		updatedb(dt)

# sync metadata / code from master
# --------------------------------
def sync_dt(dt):
	if not webnotes.app_conn:
		return

	# check modified date
	t1 = webnotes.app_conn.sql("SELECT modified, issingle from `tabDocType` where name='%s'" % dt)
	try:
		t2 = webnotes.conn.sql("SELECT modified from `tabDocType Update Register` where name='%s'" % dt, ignore_no_table = 0)
	except Exception, e:
		if e.args[0] == 1146:
			# No table created yet (?), create one
			create_adt_update_table()
			t2 = None
		else:
			raise e
	
	# new
	if not t2:
		# first time creation
		_sync_dt(dt, t1[0][1])
		
		webnotes.conn.sql("INSERT INTO `tabDocType Update Register`(name, modified) VALUES (%s, %s)", (dt, t1[0][0]))
	
	# exists
	elif t1[0][0] != t2[0][0]:
		# if different, sync the databases
		_sync_dt(dt, t1[0][1])

		# update the register
		webnotes.conn.sql("UPDATE `tabDocType Update Register` set modified = %s where name=%s", (t1[0][0], dt))

