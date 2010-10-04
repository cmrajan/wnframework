class DocType:
        def __init__(self, doc, doclist):
		self.doc = doc
		self.doclist = doclist

	def export(self):
		exp_list = self.doc.export_doctype_list.split(NEWLINE)
		doc_list = []

		for e in exp_list:
			if e.strip(): # ignore blanks
				t, n = e.split(',')
				doc_list += getdoc(t.strip(), n.strip())

		l = '['
		for d in doc_list:
			if d.fields.has_key('creation'): del d.fields['creation']
			if d.fields.has_key('modified'): del d.fields['modified']
			if d.fields.has_key('owner'): del d.fields['owner']
			l += str(d.fields) + "," + NEWLINE
	
		l += ']'

		self.doc.export_data = l
		
	def import_docs(self):
		self.doc.response = import_docs(self.doc.messages)
	
	def parse_data(self):
		# parse csv

		import csv
		l = csv.reader(self.doc.messages.splitlines())

		self.dt_list, self.msg = [], []

		# MAKE THE LIST OF ALL DIFFERENT TABLES
		# EACH SEPARATED BY '#'
		
		self.msg.append('<p><b>Identifying DocTypes</b></p>')
		for r in l:
			if len(r)>0 and r[0]: # first cell must not be blank!
				if r[0].strip() == '#': # new type
					data=[]
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
			c = getcursor()

			is_doctype = 1
			try:
				c.execute("select * from `tab%s` limit 0" % dt)
			except:
				is_doctype = 0
				self.msg.append('<div style="color: RED">Error: No DocType: %s</div>' % dt)
			
			if is_doctype:
				# 2. check field names
				fl = [f[0] for f in c.description]
			
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

		self.doc.response = NEWLINE.join(self.msg)			
			
	def import_csv(self):
		self.parse_data()
                docs, doc_groups = [], {}
		for typedata in self.dt_list:
			ischild = 0
			data, dt = typedata[0], typedata[1]
			
			# identify fields
			fields = data[0] 
			data = data[1:]
			
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
						if self.doc.import_date_format=='yyyy-mm-dd':
							fd[f] = d[i]
						elif d[i] and self.doc.import_date_format=='dd-mm-yyyy':
							tmpd = d[i].split('-')
							if len(tmpd)==3:
								fd[f] = tmpd[2]+'-'+tmpd[1]+'-'+tmpd[0]
						elif d[i] and self.doc.import_date_format=='mm/dd/yyyy':
							tmpd = d[i].split('/')
							if len(tmpd)==3:
								fd[f] = tmpd[2]+'-'+tmpd[0]+'-'+tmpd[1]
						elif d[i] and self.doc.import_date_format=='mm/dd/yy':
							tmpd = d[i].split('/')
							if len(tmpd)==3:
								fd[f] = '20'+tmpd[2]+'-'+tmpd[0]+'-'+tmpd[1]
						elif d[i] and self.doc.import_date_format=='dd/mm/yyyy':
							tmpd = d[i].split('/')
							if len(tmpd)==3:
								fd[f] = tmpd[2]+'-'+tmpd[1]+'-'+tmpd[0]
					else:
						fd[f] = d[i]
				
				# load metadata
				cur_doc = Document(fielddata = fd)
				cur_doc.doctype = dt
				cur_doc.parenttype = typedata[2]
				cur_doc.parentfield = typedata[3]
				# save the document
				try:
                                        if cur_doc.name and db_exists(dt, cur_doc.name):
						if self.doc.over_write:
                                                        cur_doc.save()
							self.msg.append('<div style="color: ORANGE">Over-written: %s</div>' % (cur_doc.name))
						else:
							self.msg.append('<div style="color: ORANGE">Ignored: %s</div>' % (cur_doc.name))
					else:
						cur_doc.save(1)
					        self.msg.append('<div style="color: GREEN">Created: %s</div>' % (cur_doc.name))
				except Exception, e:
					self.msg.append('<div style="color: RED">ERROR: %sData:%s</div>' % (str(e) + NEWLINE, str(cur_doc.fields)))

				# make in groups
				if cur_doc.parent:
					docs.append(cur_doc)
					if not doc_groups.has_key(cur_doc.parent):
						doc_groups[cur_doc.parent] = []
						doc_groups[cur_doc.parent].append(cur_doc)

			for m in docs:
				try:
					obj = get_server_obj(m, doc_groups.get(m.name, []))
					out = run_server_obj(obj, 'validate')
					if not out:
						out1 = run_server_obj(obj, 'on_update')
						self.msg.append('<div style="color: GREEN">On Update: %s - %s</div>' % (m.name, out1))
					else:
						self.msg.append('<div style="color: Red">Validation Failed: %s - %s</div>' % (m.name, out))
				except Exception, e:
					self.msg.append('<div style="color: RED">On Update ERROR: %s - %s</div>' % (cur_doc.name, str(e)))
			
			self.doc.response = NEWLINE.join(self.msg)
			tables = sql("show tables");
	
	def clear_deleted(self):
		self.doc.messages = ''
		for t in tables:
			try:
				self.doc.messages += 'deleted from %s' % t[0]
			except:
				self.doc.messages += 'no table: %s' % t[0]

	def execute_test(self, arg=''):
                out = ''
                exec(arg and arg or self.doc.test_code)
                return out

        def upload_many(self,form):
                form_name = form.getvalue('form_name')
                if form_name == 'File Browser':
                        self.ret = get_obj('File Browser Control').upload_many(form)

        def upload_callback(self,form):
                form_name = form.getvalue('form_name')
		if(self.ret) and form_name == 'File Browser':
			if self.ret == 'No file found.':
				return 'window.parent.msgprint("No file found.")'
			elif self.ret == 'File Group is mandatory.':
				return 'window.parent.msgprint("File Group is mandatory.")'
			else:
				ret = eval(self.ret)
				return "window.parent.pscript.load_child_nodes()"