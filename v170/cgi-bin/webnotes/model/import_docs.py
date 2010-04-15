import webnotes

def import_docs(docs = []):
	from webnotes.model.doc import Document
	import webnotes.model.code

	doc_list = {}
	created_docs = []
	already_exists = []

	out, tmp ="", ""

	for d in docs:
		cur_doc = Document(fielddata = d)
		if not cur_doc.parent in already_exists: # parent should not exist
			try:
				cur_doc.save(1)
				out += "Created: " + cur_doc.name + "\n"
				created_docs.append(cur_doc)
	
				# make in groups
				if cur_doc.parent:
					if not doc_list.has_key(cur_doc.parent):
						doc_list[cur_doc.parent] = []
					doc_list[cur_doc.parent].append(cur_doc)

			except Exception, e:
				out += "Creation Warning/Error: " + cur_doc.name + " :"+ str(e) + "\n"
				already_exists.append(cur_doc.name)

	# Run scripts for main docs
	for m in created_docs:
		if doc_list.has_key(m.name):
			tmp = webnotes.model.code.run_server_obj(webnotes.model.code.get_server_obj(m, doc_list.get(m.name, [])),'on_update')

			# update database (in case of DocType)
			if m.doctype=='DocType':
				import webnotes.model.doctype
				try: webnotes.model.doctype.update_doctype(doc_list.get(m.name, []))
				except: pass
			
			out += 'Executed: '+ str(m.name) + ', Err:' + str(tmp) + "\n"

	return out

#  When a DocType is imported, upgrade it (instead of re-creating it)
#
#  1. custom added fieds are not overwritten
#  2. server_code_core and client_script_core are not over-written
#  --------------------------------------------------------------------

def ovr_doctype(doclist, ovr, ignore, onupdate):
	from webnotes.model.doc import Document
	from webnotes.model.doclist import getlist
	import webnotes.model.code
	from webnotes.utils import cstr
	
	sql = webnotes.conn.sql
	
	doclist = [Document(fielddata = d) for d in doclist]
	doc = doclist[0]
	cur_doc = Document('DocType',doc.name)
	added = 0
	
	# fields
	# ------
	for d in getlist(doclist, 'fields'):
		# if exists
		if d.fieldname:
			fld = sql("select name from tabDocField where fieldname=%s and parent=%s", (d.fieldname, d.parent))
		else:
			fld = sql("select name from tabDocField where label=%s and parent=%s", (d.label, d.parent))

		if (not fld) and d.label: # must have label
			# re number - following fields
			
			sql("update tabDocField set idx = idx + 1 where parent=%s and idx > %s", (d.parent, d.idx))
			
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore)
			added += 1

	# code
	# ----
	
	cur_doc.server_code_core = cstr(doc.server_code_core)
	cur_doc.client_script_core = cstr(doc.client_script_core)
	
	cur_doc.save(ignore_fields = ignore)
	
	if onupdate:
		so = webnotes.model.code.get_obj('DocType', doc.name, with_children = 1)

		# update database (in case of DocType)
		if so.doc.doctype=='DocType':
			import webnotes.model.doctype
			try: 
				webnotes.model.doctype.update_doctype(so.doclist)
			except: 
				pass

	if webnotes.conn.in_transaction: sql("COMMIT")

	return doc.name + (' Upgraded: %s fields added' % added)

# Import a record (with its chilren)
# Used by transfer
# --------------------------------------------------------------------

def set_doc(doclist, ovr=0, ignore=1, onupdate=1, allow_transfer_control=1):
	from webnotes.model.doc import Document
	from webnotes.model.code import get_obj
	from webnotes.model.code import get_server_obj
	from webnotes.model import get_table_fields
	
	sql = webnotes.conn.sql
	override = 0
	
	if not doclist:
		return 'No Doclist'
	doc = Document(fielddata = doclist[0])
	orig_modified = doc.modified

	exists = webnotes.conn.exists(doc.doctype, doc.name)

	if not webnotes.conn.in_transaction: 
		sql("START TRANSACTION")
	
	if exists: 
		if ovr:
			# Special Treatement
			# ------------------
			if allow_transfer_control:
				if webnotes.conn.exists('DocType', 'Transfer Control'):
					tc = get_obj('Transfer Control')
					if tc.override_transfer.has_key(doc.doctype):
						return getattr(tc, tc.override_transfer.get(doc.doctype))(doclist, ovr, ignore, onupdate) # done
			
				if doc.doctype == 'DocType':
					return ovr_doctype(doclist, ovr, ignore, onupdate) # done

			# check modified timestamp
			# ------------------------
			ts = sql("select modified from `tab%s` where name=%s" % (doc.doctype, '%s'), doc.name)[0][0]
			if str(ts)==doc.modified:
				return doc.name + ": <span style='color: #888'>No update</span>"

			# Replace the record
			# ------------------

			# remove main doc
			newname = '__overwritten:'+doc.name
			n_records = sql("SELECT COUNT(*) from `tab%s` WHERE name like '%s%%'" % (doc.doctype, newname))
			if n_records[0][0]:
				newname = newname + '-' + str(n_records[0][0])
				
			sql("UPDATE `tab%s` SET name='%s', docstatus=2 WHERE name = '%s' limit 1" % (doc.doctype, newname, doc.name))
			
			# remove child elements
			tf_list = get_table_fields(doc.doctype)
			for t in tf_list:
				sql("UPDATE `tab%s` SET parent='%s', docstatus=2 WHERE parent='%s' AND parentfield='%s'" % (t[0], 'oldparent:'+doc.name, doc.name, t[1]))
				
		else:
			if webnotes.conn.in_transaction: 
				sql("ROLLBACK")
			return doc.name + ": Exists / No change"

	# save main
	doc.save(new = 1, ignore_fields = ignore, check_links=0)
	
	# save others
	dl = [doc]
	for df in doclist[1:]:
		try:
			d = Document(fielddata = df)
			d.save(new = 1, ignore_fields = ignore, check_links=0)
			dl.append(d)
		except:
			pass # ignore tables
	
	if onupdate:
		so = get_server_obj(doc, dl)
		if hasattr(so, 'on_update'):
			so.on_update()

	# reset modified
	webnotes.conn.set(doc, 'modified', orig_modified)

	if webnotes.conn.in_transaction: 
		sql("COMMIT")

	return doc.name + ' <span style="color:GREEN; font-weight:bold">Completed</span>'

#=============================================================================================
	
class CSVImport:
	def __init__(self):
		self.msg = []
		self.csv_data = None
		self.import_date_format = None

	# Parse data
	# --------------------------------------------------------------------
	def parse_data(self):
		# parse csv

		import csv
		l = csv.reader(self.csv_data.splitlines())

		self.dt_list, self.msg = [], []

		# MAKE THE LIST OF ALL DIFFERENT TABLES
		# EACH SEPARATED BY '#'
		
		self.msg.append('<p><b>Identifying DocTypes</b></p>')
		for r in l:
			if len(r)>0 and r[0]: # first cell must not be blank!
				if r[0].strip() == '#': # new type
					data = []
					# format : data, doctype, parenttype, parentfield
					self.dt_list.append([data, r[1], len(r)>2 and r[2] or '', len(r)>3 and r[3] or ''])
					self.msg.append('<div>Identified DocType: ' +r[1] + '</div>')
				else:
					try:
						data.append(r)
					except:
						self.msg.append('<div style="color:RED">Error: No Doctypes Identified using "#"</div>')
						return
		if not len(self.dt_list):
			self.msg.append('<div style="color:RED">Error: No Doctypes Identified using "#"</div>')

	# Check CSV
	# --------------------------------------------------------------------
	def check_csv(self):
		self.parse_data()
		
		for typedata in self.dt_list:
			ischild = 0
			data = typedata[0]
			
			# identify fields
			fields = data[0] 
			data = data[1:]
			
			dt = typedata[1]
			
			# 1. check if doctype exists
			is_doctype = 1
			try:
				webnotes.conn.sql("select * from `tab%s` limit 0" % dt)
			except:
				is_doctype = 0
				self.msg.append('<div style="color: RED">Error: No DocType: %s</div>' % dt)
			
			if is_doctype:
				# 1. check field names
				fl = [f[0] for f in webnotes.conn.get_description()]
			
				self.msg.append('<p><b>Checking fieldnames for %s</b></p>' % dt)
				has_field_err = 0
				for f in fields:
					if not f.strip() in fl:
						self.msg.append('<div style="color: RED">Error: Field %s is not present in %s</div>' % (f, dt))
						has_field_err = 1
						
				if not has_field_err:
					self.msg.append('<div style="color: GREEN">Fields OK for %s</div>' % dt)
					
				# 2. check whether new or exists
				# load data
				for d in data:
					fd = {}
					tmp = len(fields)
					if len(d)<len(fields): 
						tmp = len(d)
	
					for i in range(tmp):
						if fields[i].strip():
							fd[fields[i].strip()] = d[i]
					
					if fd.has_key('name'):
						if sql('select name from `tab%s` where name = "%s"' % (dt, fd['name'])):
							self.msg.append('<div style="color: ORANGE">WARNING %s, %s: Document exists, will be over-written</div>' % (dt, fd['name']))

		return '\n'.join(self.msg)			
	
	# Date parsing
	# --------------------------------------------------------------------
	def parse_date(self, d):
		out = ''
		if self.import_date_format=='yyyy-mm-dd':
			out = d
		elif d and self.import_date_format=='dd-mm-yyyy':
			tmpd = d.split('-')
						
			if len(tmpd)==3:
				out = tmpd[2]+'-'+tmpd[1]+'-'+tmpd[0]
			
		elif d and self.import_date_format=='mm/dd/yyyy':
			tmpd = d.split('/')
			
			if len(tmpd)==3:
				out = tmpd[2]+'-'+tmpd[0]+'-'+tmpd[1]
				
		elif d and self.import_date_format=='mm/dd/yy':
			tmpd = d.split('/')
			
			if len(tmpd)==3:
				out = '20'+tmpd[2]+'-'+tmpd[0]+'-'+tmpd[1]
		
		elif d and self.import_date_format=='dd/mm/yyyy':
			tmpd = d.split('/')
			if len(tmpd)==3:
				out = tmpd[2]+'-'+tmpd[1]+'-'+tmpd[0]

		elif d and self.import_date_format=='dd/mm/yy':
			tmpd = d.split('/')
			if len(tmpd)==3:
				out = '20'+tmpd[2]+'-'+tmpd[1]+'-'+tmpd[0]

		
		return out
		
	# do import
	# --------------------------------------------------------------------
	def import_csv(self, csv_data, import_date_format = 'yyyy-mm-dd', overwrite = 0):
		self.csv_data = csv_data
		self.import_date_format = import_date_format
	
		import webnotes.model.code
		from webnotes.model.doc import Document
		sql = webnotes.conn.sql
	
		self.parse_data()

		docs, doc_groups = [], {}
		for typedata in self.dt_list:
			ischild = 0
			data, dt = typedata[0], typedata[1]
			
			# identify fields
			fields = []
			for f in data[0]:
				if not f: 
					break # only add upto blank field
				fields.append(f)
			data = data[1:]

			self.msg.append('<p>Fields Identified: %s</p>' % fields)
			
			# find if child type
			for f in fields:
				if f=='parent':
					ischild = 1

			# find date strings
			date_list = [d[0] for d in sql('SELECT fieldname from `tabDocField` where parent = "%s" and fieldtype="Date"' % dt)]
			
			# load data
			for d in data:
				self.msg.append('<p><b>Importing From: %s</b></p>' % dt)
				fd = {}
				tmp = len(fields)
				if len(d)<len(fields): 
					tmp = len(d)
					
				for i in range(tmp):
					f = fields[i].strip()
					if f in date_list:
						# date formats
						fd[f] = self.parse_date(d[i])
					else:
						fd[f] = d[i]
				
				# load metadata
				cur_doc = Document(fielddata = fd)
				cur_doc.doctype = dt
				cur_doc.parenttype = typedata[2]
				cur_doc.parentfield = typedata[3]
				
				# save the document
				try:
					if cur_doc.name and webnotes.conn.exists(dt, cur_doc.name):
						if overwrite:
							cur_doc.save()
							self.msg.append('<div style="color: ORANGE">Over-written: %s</div>' % (cur_doc.name))
						else:
							self.msg.append('<div style="color: ORANGE">Ingored: %s</div>' % (cur_doc.name))
					else:
						cur_doc.save(1)
					self.msg.append('<div style="color: GREEN">Created: %s</div>' % (cur_doc.name))
				except Exception, e:
					self.msg.append('<div style="color: RED">ERROR: %sData:%s</div>' % (str(e) + '\n', str(cur_doc.fields)))

				# make in groups
				docs.append(cur_doc)
				if cur_doc.parent:

					if not doc_groups.has_key(cur_doc.parent):
						doc_groups[cur_doc.parent] = []
						doc_groups[cur_doc.parent].append(cur_doc)

			for m in docs:
				try:
					obj = webnotes.model.code.get_server_obj(m, doc_groups.get(m.name, []))
					out = webnotes.model.code.run_server_obj(obj, 'validate')
					if not out:
						out1 = webnotes.model.code.run_server_obj(obj, 'on_update')
						self.msg.append('<div style="color: GREEN">On Update: %s - %s</div>' % (m.name, out1))
					else:
						self.msg.append('<div style="color: Red">Validation Failed: %s - %s</div>' % (m.name, out))
				except Exception, e:
					self.msg.append('<div style="color: RED">On Update ERROR: %s - %s</div>' % (cur_doc.name, str(webnotes.utils.getTraceback())))
			
		return '\n'.join(self.msg)

#=============================================================================================

def get_template():
	import webnotes.model

	from webnotes.utils import getCSVelement
	
	form = webnotes.form
	sql = webnotes.conn.sql

	dt = form.getvalue('dt')
	pt, pf = '', ''
	
	# is table?
	dtd = sql("select istable, autoname from tabDocType where name='%s'" % dt)
	if dtd and dtd[0][0]:
		res1 = sql("select parent, fieldname from tabDocField where options='%s' and fieldtype='Table' and docstatus!=2" % dt)
		if res1:
			pt, pf = res1[0][0], res1[0][1]

	# line 1
	dset = []
	if pt and pf:
		fl = ['parent']
		line1 = '#,%s,%s,%s' % (getCSVelement(dt), getCSVelement(pt), getCSVelement(pf))
	else:
		if dtd[0][1]=='Prompt':
			fl = ['name']
		else:
			fl = []
		line1 = '#,%s' % getCSVelement(dt)
		
	# fieldnames
	res = sql("select fieldname, fieldtype from tabDocField where parent='%s' and docstatus!=2" % dt)
	for r in res:
		if not r[1] in webnotes.model.no_value_fields:
			fl.append(getCSVelement(r[0]))
	
	dset.append(line1)
	dset.append(','.join(fl))
	
	txt = '\n'.join(dset)
	webnotes.response['result'] = txt
	webnotes.response['type'] = 'csv'
	webnotes.response['doctype'] = dt
