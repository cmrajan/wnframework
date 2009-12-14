# Set Column Types
# ----------------

def getcoldef(ftype):
	t=ftype.lower()
	if t in ('date','int','text','time'):
		dt = t
	elif t in ('currency'): 
		dt = 'decimal(14,2)' 
	elif t in ('float'): 
		dt = 'decimal(14,6)' 
	elif t == 'small text':
		dt = 'text';
	elif t == 'check':
		dt = 'int(3)';
	elif t in ('long text', 'code', 'text editor'): 
		dt = 'text';
	elif t in ('data', 'link', 'password', 'select', 'read only'):
		dt = 'varchar(180)';
	elif t == 'blob':
		dt = 'longblob'
	else: dt = ''
	return dt

# Add Columns In Database
# -----------------------

def db_get_newfields(doctype):
	out = []
	flist = sql("SELECT DISTINCT fieldname, fieldtype, label FROM tabDocField WHERE parent='%s'" % doctype)

	exlist = [e[0] for e in sql("DESC `tab%s`" % (doctype))]
	
	for f in flist:
		if not (f[0] in exlist):
			out.append(f)
	return out
	
def addcolumns(doctype, userfields=[]):
	
	if userfields: 
		addlist = userfields
	else: 
		addlist = db_get_newfields(doctype)
		
	for f in addlist:
		ftype =  getcoldef(f[1])
		if ftype: 
			fn = f[0] # name or label
			if not fn:
				fn = f[2].strip().lower().replace(' ','_').replace('.','')
				fn = fn.replace('-','_').replace('&','and').replace('(', '').replace(')','')

			sql("alter table `tab%s` add `%s` %s" % (doctype, fn, ftype))

	if not userfields:
		# update flags
		sql(" UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent='%s' AND ((oldfieldname IS NULL) or (oldfieldname='')) " % (doctype))

# Add Indices
# -----------

def addindex(doctype):
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
		
# Update Columns In Database
# -----------------------

def change_column(dt, old_fn, new_fn, new_type, old_type, new_type_orig):
	if ((old_type.lower() in ['text','small text','code','text editor']) and (new_type_orig.lower() not in ['text', 'small text', 'code', 'text editor'])) or ((old_type.lower() in ['data','select','link']) and (new_type_orig.lower() in ['date','int','currency','float','time','table'])):
		msgprint('%s: Coversion from %s to %s is not allowed' % (new_fn, old_type, new_type_orig))
		raise Exception
	try:
		sql("alter table `tab%s` change `%s` `%s` %s" % (dt, old_fn, new_fn, new_type))
		msgprint("%s: Changed %s to %s" % (new_fn, old_type, new_type_orig))
	except:
		pass

			
def updatecolumns(doctype):
	# modify columns
	modifylist = sql(" SELECT oldfieldname, fieldname, fieldtype, oldfieldtype FROM tabDocField WHERE parent = '%s' AND (fieldname!=oldfieldname OR fieldtype!=oldfieldtype) AND !(fieldname IS NULL OR fieldname='') AND !(fieldtype IS NULL or fieldtype='')" % doctype)
	for f in modifylist:
		change_column(doctype, f[0], f[1], getcoldef(f[2]), f[3], f[2])
		sql("UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent= '%s'" % doctype)

# Get Checkbox Value
# -----------------------

def getcheckval(d, t):
	if d.fields.has_key(t):
		if d.fields[t]=='0' or (not d.fields[t]): return 0
		return 1
	else: return 0

# Make Database Changes
# -----------------------

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
			index parent(parent))""" % (dt))

def update_table(dt, userfields):
	# create table
	names = [rec[0].lower() for rec in sql('SHOW TABLES')]
	if not (('tab'+dt).lower() in names):  create_table(dt)

	# add columns
	addcolumns(dt, userfields)

	# update columns
	updatecolumns(dt)

	# update index
	addindex(dt)

	# update engine - always InnoDB
	update_engine(dt, 'InnoDB')

def updatedb(doctype, userfields = [], args = {}):
	istable = getcheckval(doctype, 'istable')
	issingle = getcheckval(doctype, 'issingle')

	if not issingle:
		update_table(doctype.name, userfields)
		
