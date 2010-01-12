# Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 
#
#   Web Notes Framework is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    For a copy of the GNU General Public License see 
#    <http://www.gnu.org/licenses/>.
#    
#    Web Notes Framework is also available under a commercial license with
#    patches, upgrades and support. For more information see 
#    <http://webnotestech.com>
#    testing for svn  by nabin

import cgi, Cookie, sys, time, os
import server

form = cgi.FieldStorage()
cookies = Cookie.SimpleCookie()

incookies = {}
session = {}

out = {'message':'', 'exc':''}

msgprint = server.msgprint
errprint = server.errprint

sql = server.sql
errdoc = ''
errdoctype = ''
errmethod = ''
fw_folder = '/Users/rushabh/workbench/www/'

server.set_timezone()

def eq(s):
	return s.replace("'","\'")

# Privileges
# ----------

def init_privileges(role_options):
	readtypes = []
	m_rt = []
	
	no_search_list = [r[0] for r in sql('SELECT name FROM tabDocType WHERE read_only = 1 ORDER BY name')]
	all_readtypes = [r[0] for r in sql('SELECT DISTINCT parent FROM `tabDocPerm` where (`read`=1 or `write`=1) AND (%s) AND (parent not like "old_parent:%%") AND permlevel = 0' % (' OR '.join(role_options)))]
	all_tabletypes = []
	
	# include children for search
	res = sql('SELECT parent, options from tabDocField where fieldtype="Table"')
	table_types = {}
	for t in res: # make a dictionary fo all table types
		all_tabletypes.append(t[1])
		if not table_types.has_key(t[0]):
			table_types[t[0]] = []
		table_types[t[0]].append(t[1])
	
	# make the lists
	for f in all_readtypes:
		tl = table_types.get(f, None)
		if tl:
			for t in tl:
				if t and (not t in readtypes) and (not t in no_search_list):
					readtypes.append(t)
		
		if f and (not f in readtypes) and (not f in no_search_list): 
			readtypes.append(f)
			m_rt.append(f) # main read types
	
	readtypes.sort()
	m_rt.sort()
	return all_readtypes + all_tabletypes, readtypes, m_rt

# Menu Items
# ----------

def init_menuitems(role_options, all_readtypes):		
	menuitems = []
	# pages
	pages = sql("select distinct parent from `tabPage Role` where docstatus!=2 and (%s)" % (' OR '.join(role_options)))
	for p in pages:
		tmp = sql("select icon, parent_node, menu_index, show_in_menu from tabPage where name = '%s'" % p[0])
		if tmp and tmp[0][3]:
			menuitems.append(['Page', p[0] or '', tmp[0][1] or '', tmp[0][0] or '', server.cint(tmp[0][2])])
			
	# singles
	tmp = sql("select smallicon, parent_node, menu_index, name from tabDocType where (show_in_menu = 1 and show_in_menu is not null)")
	singles = {}
	for t in tmp: singles[t[3]] = t
		
	for p in all_readtypes:
		tmp = singles.get(p, None)
		if tmp: menuitems.append([p, p, tmp[1] or '', tmp[0] or '', server.cint(tmp[2])])
	
	return menuitems

# Init Defaults
# -------------

def init_userdefaults(roles):
	roles.append(session['user'])
	role_options = ["parent = '"+r+"'" for r in roles]
	res = sql('select defkey, defvalue from `tabDefaultValue` where %s' % ' OR '.join(role_options))
	
	defaults = {'owner': [session['user'],]}

	for rec in res: 
		if not defaults.has_key(rec[0]): defaults[rec[0]] = []
		defaults[rec[0]].append(rec[1] or '')

	return defaults

# Home Page
# ---------

def init_page(page):
	hp = server.getdoc('Page', page)
	hp[0].__script = server.page_import(hp[0].script)
	if hp[0].fields.get('content') and hp[0].content.startswith('#python'):
		hp[0].__content = server.exec_page(hp[0].content)
	return hp


# Load Session

def initdata(form, session):
	s_data, doclist = session['data'], []
	if not s_data.get('roles', None):
		# get roles
		roles = server.get_roles()
		role_options = ["role = '"+r+"'" for r in roles]
		s_data['roles'] = roles
	
		# allowed to create
		s_data['newtypes'] = server.get_create_list(roles)
	
		# privileges
		all_readtypes, readtypes, m_rt = init_privileges(role_options)
		s_data['all_readtypes'] = all_readtypes
		s_data['readtypes'] = readtypes
		s_data['m_rt'] = m_rt
	
		# menu items
		s_data['menuitems'] = init_menuitems(role_options, all_readtypes)

		# Load User Defaults
		s_data['defaults'] = init_userdefaults(roles)
		
		# Control Panel
		cp = server.getdoc('Control Panel')
		doclist += [d.fields for d in cp]
		doclist += [d.fields for d in server.getdoctype('Event')]
		doclist += [d.fields for d in server.getdoctype('ToDo Item')]

		try: 	doclist += [d.fields for d in server.getdoctype('Search Criteria')]
		except: pass # bc

		s_data['doclist'] = server.compress_doclist(doclist)
		for f in cp[0].fields.keys():
			if cp[0].fields[f]==None: cp[0].fields[f] = ''
		s_data['control_panel'] = cp[0].fields
		
	# startup script (opt)
	# --------------------
	cp = server.Document(fielddata = s_data['control_panel'])
	cp_obj = server.get_obj(doc = cp)
	if hasattr(cp_obj, 'startup'): out['startup'] = cp_obj.startup() or ''

	# standard loading
	# ----------------
	out['roles'] = s_data['roles']
	out['defaults'] = s_data['defaults']
	out['mi'] = s_data['menuitems']
	out['rt'] = s_data['readtypes']
	out['m_rt'] = s_data['m_rt']
	out['nt'] = s_data['newtypes']
	if s_data.has_key('from_gateway'):
		out['from_gateway'] = s_data['from_gateway']

	# user data
	# ------------
	out['user'] = session['user']
	t = sql('select email, first_name, last_name, recent_documents from tabProfile where name = %s', session['user'])
	if t:
		out['user_fullname'] = (t[0][1] or '') + (t[0][1] and ' ' or '') + (t[0][2] or '')	
		out['user_email'] = t[0][0] or ''
		out['recent_documents']=t[0][3] or ''
	else:
		out['user_fullname'] = session['user']
		out['user_email'] = session['user']
		out['recent_documents'] = ''
	
	out['account'] = server.encrypt(server.db_name)
	out['account_id'] = cp.account_id or ''
	out['sysdefaults'] = server.get_defaults()
	out['n_online'] = server.cint(sql("SELECT COUNT(DISTINCT user) FROM tabSessions")[0][0])
	out['docs'] = s_data['doclist']

	# Testing Mode
	# ------------
	out['testing_mode'] = str(session['data'].get('__testing', ''))
	
	# Home Page
	# ---------
	out_docs = []
	if form.getvalue('page'): 
		out_docs += init_page(form.getvalue('page'))
	else:
		try:
			hp = server.get_home_page()
			out['home_page'] = hp or ''
			if hp:
				out_docs += init_page(hp)
		except:
			errprint(server.getTraceback())
			msgprint('Error in Home Page')

	out['docs1'] = server.compress_doclist(out_docs)

# Get user image
# --------------
def get_user_img(form,session):
	f = sql("select file_list from tabProfile where name=%s", form.getvalue('username',''))
	if f and f[0][0]:
		out['message'] = f[0][0].split(',')[1]
	else:
		out['message'] = 'no_img'


# Document Load
# -------------

def getdoc(form, session):
	doclist = []
	if form.getvalue('doctype'):
		doclist = _getdoc(form.getvalue('doctype'), form.getvalue('name'), (form.getvalue('user') or session['user']))

		# execute page
		if form.getvalue('doctype')=='Page' and server.cint(form.getvalue('is_page'))==1:
			# check for import
			doclist[0].__script = server.page_import(doclist[0].script)
			
			if doclist[0].fields.get('content') and doclist[0].content.startswith('#python'):
				doclist[0].__content = server.exec_page(doclist[0].content)

	if form.getvalue('getdoctype'):
		doclist += server.getdoctype(form.getvalue('doctype'))

	out['docs'] = server.compress_doclist(doclist)
	#try:
	if 1:
		tag = doclist[0].doctype + '/' + doclist[0].name
		out['n_tweets'] = server.cint(sql("select count(*) from tabTweet where tag=%s", (tag))[0][0] or 0)
		lc = sql("select creation,`by`,comment from tabTweet where tag=%s order by name desc limit 1", tag)
		out['last_comment'] = lc and [server.cstr(t) for t in lc[0]] or []
	#except: pass

def get_print_format(form, session):
	out['message'] = server.get_print_format(form.getvalue('name'))

def rename(form, session):
	if form.getvalue('dt') and form.getvalue('old') and form.getvalue('new'):
		server.rename(form.getvalue('dt'), form.getvalue('old'), form.getvalue('new'))
		
		getdoc(form, session)

def _getdoc(dt, dn, user):
	if not dn: dn = dt
	dl = server.getdoc(dt, dn)

	try:
		so = server.get_server_obj(dl[0], dl)
		r = server.run_server_obj(so, 'onload')
		if hasattr(so, 'custom_onload'):
			r = server.run_server_obj(so, 'custom_onload')
		if r: 
			msgprint(r)
	except Exception, e:
		errprint(server.getTraceback())
		msgprint('Error in script while loading')
		raise e

	if dl and not dn.startswith('_'):
		update_recent(dt, dn, dl[0].owner, dl[0].creation, dl[0].modified, user)

	# load search criteria ---- if doctype
	if dt=='DocType':
		dl += get_search_criteria(dt)

	return dl
	
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
	
def update_recent(dt, dn, owner, created, modified, user):

	# update recent documents
	if not (dt in ['Print Format', 'Start Page', 'Event', 'ToDo Item', 'Search Criteria']) and not server.is_testing:
		rec = sql('select recent_documents from tabProfile where name="%s"' % user)
		if not rec:
			return # not a profile
		rec = rec and rec[0][0] or ''
		rec = rec and rec.split('\n') or []

		tmp = '~~~'.join((dn,dt,owner,created or  '',server.nowdate(),'__#STARRED#__'))
		new = [tmp]
		starred = '0'
		for r in rec:
			rx = r.split(',')
			if (rx[0]==dn and rx[1]==dt):
				starred = rx[5]
			else:
				new.append(r)

		if len(new) > 50: # cut to 15
			new = new[:49]
		sql("update tabProfile set recent_documents=%s where name=%s", ('\n'.join(new).replace('__#STARRED#__', starred), user))

def set_starred(form, session):
	rec = sql('select recent_documents from tabProfile where name="%s"' % (form.getvalue('user') or session['user']))[0][0]

	if rec:
		rec = rec.split('\n') or []	
		new = []
		for r in rec:
			rx = r.split(',')
			if rx[0]==form.getvalue('dn') and rx[1]==form.getvalue('dt'): 
				if len(rx)>5:
					if form.getvalue('starred') and len(rx)>5:
						rx[5] = '1'
					else:	
						rx[5] = '0'
					r = ','.join(rx)
				
			new.append(r)

		sql("update tabProfile set recent_documents = '%s' where name='%s'" % ('\n'.join(new), form.getvalue('user') or session['user']))

# TO DO
# -----

def todo_clear_checked(form, session):
	cl = form.getvalue('cl').split('\1');
	cl = ['name="' + c  + '"' for c in cl]
	sql('delete from `tabToDo Item` where (%s)' % (' OR '.join(cl)))

# DocType Load
# ------------

def getdoctype(form, session):
	# load parent doctype too
	dt = form.getvalue('doctype')
	
	if form.getvalue('with_parent'):
		parent_dt = sql('select parent from tabDocField where fieldtype="Table" and options="%s" and (parent not like "old_parent:%%") limit 1' % dt)
		parent_dt = parent_dt and parent_dt[0][0] or ''
		if parent_dt:
			doclist = server.getdoctype(parent_dt)
			out['parent_dt'] = parent_dt
		else:
			doclist = server.getdoctype(dt)

	else:
		doclist = server.getdoctype(dt)

	if doclist[0].issingle:
		doclist += server.getdoc(dt)

	# load search criteria for reports (all)
	doclist += get_search_criteria(dt)

	out['docs'] = server.compress_doclist(doclist)

# Document Save
# -------------

def load_report_list(form, session):
	out['rep_list'] = server.get_search_criteria_list(form.getvalue('dt'))

def get_doclist(clientlist):
	midx = 0
	for i in range(len(clientlist)):
		if clientlist[i]['name'] == form.getvalue('docname'):
			main_doc = server.Document(fielddata = clientlist[i])
			midx = i
		else:
			clientlist[i]=server.Document(fielddata = clientlist[i])

	del clientlist[midx]
	return main_doc, clientlist

def send_docs(doc, doclist):
	# cleanup
	#server.log("Doc Save", doc.name)
		
	out['docname'] = doc.name
	doclist = [doc] + doclist
	out['docs'] = server.compress_doclist(doclist)

def do_action(doc, doclist, so, method_name, docstatus):
	if so and hasattr(so, method_name):
		errmethod = method_name
		server.run_server_obj(so, method_name)
		if hasattr(so, 'custom_'+method_name):
			server.run_server_obj(so, 'custom_'+method_name)
		errmethod = ''

		for d in [doc] + doclist:
			server.set(d, 'docstatus', docstatus)
			
	else:
		for d in [doc] + doclist:
			server.set(d, 'docstatus', docstatus)

def savedocs(form, session):
	global errdoc, errdoctype, errmethod
	# action
	action = form.getvalue('action')
	
	# get docs	
	doc, doclist = get_doclist(server.expand_doclist(form.getvalue('docs')))
	errdoc = doc.name
	errdoctype = doc.doctype
		
	# get server object
	server_obj = server.get_server_obj(doc, doclist)
	
	# check for integrity / transaction safety
	res = sql('SELECT issingle FROM tabDocType WHERE name="%s"' % doc.doctype)
	if res:
		is_single = res[0][0]
	else:
		errprint('DocType not found "%s"' % doc.doctype)
		return
		
	if (not is_single) and (not doc.fields.get('__islocal')):
		tmp = sql('SELECT modified FROM `tab%s` WHERE name="%s"' % (doc.doctype, doc.name))
		if tmp and str(tmp[0][0]) != str(doc.modified):
			msgprint('Document has been modified after you have opened it. To maintain the integrity of the data, you will not be able to save your changes. Please refresh this document. [%s/%s]' % (tmp[0][0], doc.modified))
			return
	
	# validate links
	ret = server.validate_links_doclist([doc] + doclist)
	if ret:
		msgprint("[Link Validation] Could not find the following values: %s. Please correct and resave. Document Not Saved." % ret)
		return

	# saving & post-saving
	try:

		# validate befor saving and submitting
		if action in ('Save', 'Submit') and server_obj:
			if hasattr(server_obj, 'validate'):	
				t = server.run_server_obj(server_obj, 'validate')
			if hasattr(server_obj, 'custom_validate'):
				t = server.run_server_obj(server_obj, 'custom_validate')
				
		# save main doc
		is_new = server.cint(doc.fields.get('__islocal'))
		if is_new and not doc.owner:
			doc.owner = form.getvalue('user')
		
		doc.modified, doc.modified_by = server.now(), session['user']
		
		try:
			t = doc.save(is_new)
		except NameError, e:
			msgprint('Name Exists')
			raise e
		
		# save child docs
		for d in doclist:
			deleted, local = d.fields.get('__deleted',0), d.fields.get('__islocal',0)
	
			if server.cint(local) and server.cint(deleted):
				pass
			elif d.fields.has_key('parent'):
				if d.parent and (not d.parent.startswith('old_parent:')):
					d.parent = doc.name # rename if reqd
					d.parenttype = doc.doctype
				d.modified, d.modified_by = server.now(), session['user']
				d.save(new = server.cint(local))
	
		# on_update
		if action in ('Save','Submit') and server_obj:
			if hasattr(server_obj, 'on_update'):
				t = server.run_server_obj(server_obj, 'on_update')
				if t: msgprint(t)
			if hasattr(server_obj, 'custom_on_update'):
				t = server.run_server_obj(server_obj, 'custom_on_update')
				if t: msgprint(t)
				
		# on_submit
		if action == 'Submit':
			if sql("select docstatus from `tab%s` where name='%s'" % (doc.doctype, doc.name))[0][0] > 0:
				msgprint("Cannot submit a record that has already been submitted. Please Refresh")
				raise Exception
			do_action(doc, doclist, server_obj, 'on_submit', 1)
	
		# on_cancel
		if action == 'Cancel':
			if sql("select docstatus from `tab%s` where name='%s'" % (doc.doctype, doc.name))[0][0] > 1:
				msgprint("Cannot cancel a record that has already been cancelled. Please Refresh")
				raise Exception
			do_action(doc, doclist, server_obj, 'on_cancel', 2)
	
		update_recent(doc.doctype, doc.name, doc.owner, doc.creation, doc.modified, (form.getvalue('user') or session['user']))

		out['saved'] = '1'
		out['main_doc_name'] = doc.name
		send_docs(doc, doclist)
		
	except Exception, e:
		msgprint('Did not save')
		errprint(server.getTraceback())
		raise e

# DocType Mapper
# --------------

def dt_map(form, session):
	dt_list = server.expand_doclist(form.getvalue('docs'))
	from_doctype = form.getvalue('from_doctype')
	to_doctype = form.getvalue('to_doctype')
	from_docname = form.getvalue('from_docname')
	from_to_list = form.getvalue('from_to_list')
	
	dm = server.get_obj('DocType Mapper', from_doctype +'-' + to_doctype)
	doclist = dm.dt_map(from_doctype, to_doctype, from_docname, server.Document(fielddata = dt_list[0]), [], from_to_list)
	
	out['docs'] = server.compress_doclist(doclist)

# Get Fields
# ----------

def get_fields(form, session):
	r = {}
	args = {
		'select':form.getvalue('select')
		,'from':form.getvalue('from')
		,'where':form.getvalue('where')
	}
	ret = sql("select %(select)s from `%(from)s` where %(where)s limit 1" % args)
	if ret:
		fl, i = form.getvalue('fields').split(','), 0
		for f in fl:
			r[f], i = ret[0][i], i+1
	out['message']=r

# File Upload
# -----------

def uploadfile(form, session):
	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
	at_id = form.getvalue('at_id')
		
	if 'filedata' in form:
		i = form['filedata']
      
		# create File Data record
		f = server.Document('File Data')
		f.blob_content = i.file.read()
		f.file_name = i.filename
		if '\\' in f.file_name:
			f.file_name = f.file_name.split('\\')[-1]
		if '/' in f.file_name:
			f.file_name = f.file_name.split('/')[-1]
		f.save(1)

		out['result'] = """
		<script type='text/javascript'>
			window.parent.file_upload_done('%s', '%s', '%s', '%s', '%s');
			window.parent.frms['%s'].show_doc('%s');
		</script>""" % (dt, dn, f.name, f.file_name.replace("'", "\\'"), at_id, dt, dn)
	else:
		out['result'] = """
		<script type='text/javascript'>window.parent.msgprint("No file")</script>"""
	
	out['type'] = 'iframe'

# to be called by custom upload scripts
def upload_many(form, session):
	cp = server.get_obj('Control Panel')
	cp.upload_many(form)
	out['result'] = """
<script type='text/javascript'>
%s
</script>
%s
%s""" % (cp.upload_callback(form), '\n----\n'.join(server.message_log).replace("'", "\'"), '\n----\n'.join(server.debug_log).replace("'", "\'").replace("\n","<br>"))
	out['type'] = 'iframe'

def remove_attach(form, session):
	fid = form.getvalue('fid')
	sql('delete from `tabFile Data` where name="%s"' % fid)
	
def downloadfile(form, session):
	fid = form.getvalue('file_id')
	res = sql("select file_name, `blob_content` from `tabFile Data` where name = '%s'" % fid)
	if res:
		out['type'] = 'download'
		out['filename'] = res[0][0]
		if hasattr(res[0][1], 'tostring'):
			out['filecontent'] = res[0][1].tostring()
		else: 
			out['filecontent'] = res[0][1]
	else:
		msgprint('Unknown file id')

def get_file(form, session):

	res = server.get_file(form.getvalue('fname'))
	if res:
		out['type'] = 'download'
		out['filename'] = res[0][0]
		out['filecontent'] = res[0][1].tostring()
	else:
		msgprint('[get_file] Unknown file name')
		
# Get Graph
# ------------------


def get_graph(form, session):
	import StringIO
	f = StringIO.StringIO()

	# call the object
	obj = server.get_obj(form.getvalue('dt'))
	plt = server.run_server_obj(obj, form.getvalue('method'), form.getvalue('arg'))
	plt.savefig(f)

	# stream out
	out['type'] = 'download'
	out['filename'] = server.random_password() + '.png'
	out['filecontent'] = f.getvalue()
		
# Run Query
# ---------

def get_sql_tables(q):
	if q.find('WHERE') != -1:
		tl = q.split('FROM')[1].split('WHERE')[0].split(',')
	else:
		tl = q.split('FROM')[1].split('ORDER BY')[0].split(',')
	return [t.strip().strip('`')[3:] for t in tl]

def get_sql_fields(q):
	fl = q.split('SELECT')[1].split('FROM')[0].split(',')

	for i in range(len(fl)):
		tmp = fl[i].strip()
		if tmp.lower().startswith('distinct'):
			fl[i] = tmp[9:]
		if ' AS ' in tmp:
			fl[i] = '.' + tmp.split(' AS ')[1][1:-1] # no doctype only aliased

	fl = [f.split('.') for f in fl]
	return [(f[0].strip().strip('`')[3:], f[1].strip().strip('`')) for f in fl]

def get_parent_dt(dt):
	pdt = ''
	if sql('select name from `tabDocType` where istable=1 and name="%s"' % dt):
		res = sql('select parent from `tabDocField` where fieldtype="Table" and options="%s"' % dt)
		if res: pdt = res[0][0]
	return pdt

def get_sql_meta(tl):
	meta = {}
	for dt in tl:
		meta[dt] = {'owner':('Owner', '', '', '100'), 'creation':('Created On', 'Date', '', '100'), 'modified':('Modified On', 'Date', '', '100'), 'modified_by':('Modified By', '', '', '100')}

		# for table doctype, the ID is the parent id
		pdt = get_parent_dt(dt)
		if pdt: meta[dt]['parent'] = ('ID', 'Link', pdt, '200')
			
		res = sql("select fieldname, label, fieldtype, options, width from tabDocField where parent='%s'" % dt)
		for r in res:
			if r[0]:
				meta[dt][r[0]] = (r[1], r[2], r[3], r[4]);
		meta[dt]['name'] = ('ID', 'Link', dt, '200')
			
	return meta

def add_match_conditions(q, tl, ur, ud):
	sl = []
	for dt in tl:
		s = server.getmatchcondition(dt, ud, ur)
		if s: 
			sl.append(s)

	# insert the conditions
	if sl:
		condition_st  = q.find('WHERE')!=-1 and ' AND ' or ' WHERE '
		
		if q.find('ORDER BY')!=-1 or q.find('LIMIT')!=-1: # if query continues beyond conditions
			condition_end = q.find('ORDER BY')==-1 and 'LIMIT' or 'ORDER BY'
			q = q.split(condition_end)
			q = q[0] + condition_st + '(' + ' OR '.join(sl) + ') ' + condition_end + q[1]
		else:
			q = q + condition_st + '(' + ' OR '.join(sl) + ')'
			
	return q

#####
def runquery(form, session, q='', ret=0, from_export=0):
	colnames, coltypes, coloptions, colwidths = [], [], [], []

	if form.getvalue('simple_query') or form.getvalue('is_simple'):
		q = form.getvalue('simple_query') or form.getvalue('query')
		if q.split()[0].lower() != 'select':
			raise Exception, 'Query must be a SELECT'
		res = server.convert_to_lists(sql(q))
	else:
		if not q: q = form.getvalue('query')

		tl, fl= get_sql_tables(q), get_sql_fields(q)
		meta = get_sql_meta(tl)
		
		for f in fl:
			if meta.has_key(f[0]) and meta[f[0]].has_key(f[1]):
				colnames.append(meta[f[0]][f[1]][0] or f[1])
				coltypes.append(meta[f[0]][f[1]][1] or '')
				coloptions.append(meta[f[0]][f[1]][2] or '')
				colwidths.append(meta[f[0]][f[1]][3] or '100')
			else:
				colnames.append(f[1])
				coltypes.append('')
				coloptions.append('')
				colwidths.append('100')
	
		q = add_match_conditions(q, tl, eval(form.getvalue('roles')), eval(form.getvalue('defaults')))
	
		if session['data'].get('__testing'):
			for dt in tl:
				st = sql('select setup_test from `tabDocType` where name="%s"' % dt)
				if st and st[0][0]:
					q = q.replace('tab%s' % dt, 'test%s' % dt)
		
		# replace special variables
		q = q.replace('__user', session['user'])
		q = q.replace('__today', server.nowdate())
		
		res = server.convert_to_lists(sql(q))
		
	# run server script
	style, header_html, footer_html, page_template = '', '', '', ''
	if form.has_key('sc_id') and form.getvalue('sc_id'):
		code = server.Document("Search Criteria", form.getvalue('sc_id')).server_script
		if code:
			filter_values = form.has_key('filter_values') and eval(form.getvalue('filter_values','')) or {}
			res, style, header_html, footer_html, page_template = server.exec_report(code, res, colnames, colwidths, coltypes, coloptions, filter_values, q, from_export)
		
	out['colnames'] = colnames
	out['coltypes'] = coltypes
	out['coloptions'] = coloptions
	out['colwidths'] = colwidths
	out['header_html'] = header_html
	out['footer_html'] = footer_html
	out['page_template'] = page_template
	
	if style:
		out['style'] = style
	
	# just the data - return
	if ret==1:
		return res	

	out['values'] = res

	# return num of entries 
	qm = form.has_key('query_max') and form.getvalue('query_max')
	if qm:
		if qm.split()[0].lower() != 'select':
			raise Exception, 'Query (Max) must be a SELECT'
		if not form.has_key('simple_query'):
			qm = add_match_conditions(qm, tl, eval(form.getvalue('roles')), eval(form.getvalue('defaults')))

		out['n_values'] = server.cint(sql(qm)[0][0])

def runquery_csv(form, session):

	# run query
	res = runquery(form, session, from_export = 1)
	
	q = form.getvalue('query')
	
	rep_name = form.getvalue('report_name')
	if not form.has_key('simple_query'):
		tl, fl= get_sql_tables(q), get_sql_fields(q)
		meta = get_sql_meta(tl)

		# Report Name
		if not rep_name:
			rep_name = get_sql_tables(q)[0]
	
	if not rep_name: rep_name = 'DataExport'
	
	# Headings
	heads = []
	for h in out['colnames']:
		heads.append(getCSVelement(h))
	if form.has_key('colnames'):
		for h in form.getvalue('colnames').split(','):
			heads.append(getCSVelement(h))

	# Output dataset
	dset = [rep_name, '']
	if heads:
		dset.append(','.join(heads))
	
	# Data
	for r in out['values']:
		dset.append(','.join([getCSVelement(i) for i in r]))
		
	txt = '\n'.join(dset)
	out['result'] = txt
	out['type'] = 'csv'
	out['doctype'] = rep_name

def getCSVelement(v):
	v = server.cstr(v)
	if not v: return ''
	if (',' in v) or ('\n' in v) or ('"' in v):
		if '"' in v: v = v.replace('"', '""')
		return '"'+v+'"'
	else: return v or ''

# Data import
# -----------

def import_csv(form, session):
	d = server.Document('Control Panel', 'Control Panel')
	d.messages = form.getvalue('csv_file')
	if form.has_key('overwrite'):
		d.over_write = 1
	else:
		d.over_write = 0
	d.import_date_format = form.getvalue('dateformat')

	cp = server.get_obj(doc=d)
	cp.import_csv()
		
	out['type']='iframe'
	rhead = '''<style>body, html {font-family: Arial; font-size: 12px;}</style>'''
	out['result']= rhead + d.response

def get_template(form, session):
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
		if not r[1] in server.no_value_fields:
			fl.append(getCSVelement(r[0]))
	
	dset.append(line1)
	dset.append(','.join(fl))
	
	txt = '\n'.join(dset)
	out['result'] = txt
	out['type'] = 'csv'
	out['doctype'] = dt
	
# Search

def search_link(form, session):
	txt = form.getvalue('txt')
	dt = form.getvalue('dt')
	query = form.getvalue('query')
	sflist = ['`tab%s`.name' % dt]
	if query:
		if '%(key)s' in query:
			query = query.replace('%(key)s', 'name')
		if '%s' in query:
			query = query % (txt + '%')

		res = sql(query)
	else:
		sf = sql('select search_fields from tabDocType where name = "%s"' % dt)
		sf = sf and sf[0][0] or ''
		if sf:
			sf = sf.split(',')
			for s in sf:
				sflist.append('`tab%s`.`%s`' % (dt, s.strip()))

		q = """
			SELECT %(fields)s 
			FROM `tab%(dt)s` 
			WHERE `tab%(dt)s`.`%(key)s` LIKE '%(txt)s' AND `tab%(dt)s`.docstatus != 2
			ORDER BY `tab%(dt)s`.`%(key)s` 
			DESC LIMIT %(start)s, %(len)s """ % {
				'fields': ', '.join(sflist),
				'dt': dt,
				'key': 'name',
				'txt': txt + '%',
				'start': '0', 
				'len': '10'
			}

		res = runquery(form, session, q, ret=1)

	# make output
	results = []
	for r in res:
		info = ''
		if len(r) > 1:
			info = ','.join([server.cstr(t) for t in r[1:]])
			if len(info) > 30:
				info = info[:30] + '...'
				
		results.append({'id':r[0], 'value':r[0], 'info':info})
	out['results'] = results
	
def search2(form, session):
	dt = form.getvalue('doctype')
	txt = form.getvalue('txt') or ''
	key = form.getvalue('searchfield') or 'name' # key field
	start = form.getvalue('start') or 0
	page_len = form.getvalue('page_len') or 50
	user_query = form.getvalue('query') or ''

	# get additional search fields
	sflist = sql("select search_fields from tabDocType where name = '%s'" % dt)
	sflist = sflist and sflist[0][0] and sflist[0][0].split(',') or []

	sflist = ['name'] + sflist
	if not key in sflist:
		sflist = sflist + [key]

	sflist = ['`tab%s`.`%s`' % (dt, f.strip()) for f in sflist]

	if not user_query:
		query = """
			SELECT %(fields)s 
			FROM `tab%(dt)s` 
			WHERE `tab%(dt)s`.`%(key)s` LIKE '%(txt)s' 
				AND `tab%(dt)s`.docstatus != 2
			ORDER BY `tab%(dt)s`.`%(key)s` 
			DESC LIMIT %(start)s, %(len)s """ % {
				'fields': ', '.join(sflist),
				'dt': dt,
				'key': key,
				'txt': txt + '%',
				'start': start, 
				'len': page_len
			}
	else:
		if '%(key)s' in user_query:
			user_query = user_query.replace('%(key)s', key)
		if '%s' in user_query:
			user_query = user_query % (txt + '%')
		
		query = user_query

	runquery(form, session, query)

# Run Script
# -------------

def runscript(form, session):
	scriptname = form.getvalue('script')
	clientlist = server.expand_doclist(form.getvalue('docs'))
	doclist = []
		
	# find main doc
	for d in clientlist:
		if not d.get('parent', ''):
			main_doc = server.Document(fielddata = d)

	# find client docs
	for d in clientlist:
		doc = server.Document(fielddata = d)
		if doc.fields.has_key('parent'):
			doclist.append(doc)	


	_runscript(scriptname, main_doc, doclist)
	doclist.append(main_doc)

	out['docs'] = server.compress_doclist(doclist)

def runserverobj(form, session):
	global errdoc, errdoctype, errmethod

	method = form.getvalue('method')
	errmethod = method
	doclist, clientlist = [], []
	arg = form.getvalue('arg')
	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
		
	if dt: # not called from a doctype (from a page)
		if not dn: dn = dt # single
		errdoc = dn
		errdoctype = dt
		so = server.get_obj(dt, dn)
	else:
		clientlist = server.expand_doclist(form.getvalue('docs'))

		# find main doc
		for d in clientlist:
			if server.cint(d.get('docstatus')) != 2 and not d.get('parent'):
				main_doc = server.Document(fielddata = d)
	
		# find client docs
		for d in clientlist:
			doc = server.Document(fielddata = d)
			if doc.fields.get('parent'):
				doclist.append(doc)	
	
		errdoc = main_doc.name
		errdoctype = main_doc.doctype
	
		so = server.get_server_obj(main_doc, doclist)
				
	if so:
		try:
			r = server.run_server_obj(so, method, arg)
			doclist = so.doclist # reference back [in case of null]
			if r:
				try:
					if r['doclist']:
						clientlist += r['doclist']
				except:
					pass
				out['message'] = r
			if clientlist:
				doclist.append(main_doc)
				out['docs'] = server.compress_doclist(doclist)
		except Exception, e:
			errprint(server.getTraceback())
			raise e
				
# Load Month Events
# -----------------

def load_month_events(form, session):
	mm = form.getvalue('month')
	yy = form.getvalue('year')
	m_st = str(yy) + '-' + str(mm) + '-01'
	m_end = str(yy) + '-' + str(mm) + '-31'

	out['docs'] = server.compress_doclist(server.get_cal_events(m_st, m_end))

# Send Email
# ----------
def sendmail(form, session):
	recipients = form.getvalue('sendto')
	subject = form.getvalue('subject')
	sendfrom = form.getvalue('sendfrom')
	
	# get attachments
	al = []
	if server.cint(form.getvalue('with_attachments')):
		al = sql('select file_list from `tab%s` where name="%s"' % (form.getvalue('dt'), form.getvalue('dn')))
		if al:
			al = al[0][0].split('\n')
	if recipients:
		recipients = recipients.replace(';', ',')
		recipients = recipients.split(',')

		if not sendfrom:
			sendfrom = get_value('Control Panel',None,'auto_email_id')
		email = server.EMail(sendfrom, recipients, subject)
		email.cc = [form.getvalue('cc'),]

		email.set_message(form.getvalue('message') or 'No text')
		email.set_message(form.getvalue('body'))
		
		for a in al:
			email.attach(a.split(',')[0])

		email.send()
	msgprint('Sent')

def get_contact_list(form, session):
	cond = ['`%s` like "%s%%"' % (f, form.getvalue('txt')) for f in form.getvalue('where').split(',')]
	cl = sql("select `%s` from `tab%s` where %s" % (
  			 form.getvalue('select')
			,form.getvalue('from')
			,' OR '.join(cond)
		)
	)
	out['cl'] = filter(None, [c[0] for c in cl])

# Reset Password
# --------------

def reset_password(form, session):
	act = form.getvalue('account', '')
	user = form.getvalue('user', '')
	if act:
		set_db_name(act)
	
	try:
		server.reset_password(user)
		msgprint("Password has been reset and sent to your email id.")
	except Exception, e:
		msgprint(str(e))

# Check Password
# --------------

def update_password(form, session):
	if sql("SELECT name FROM tabProfile WHERE password='%s' AND name='%s'" % (form.getvalue('newpwd'), form.getvalue('user'))):
		sql("UPDATE tabProfile SET password='%s' WHERE name='%s'" % (form.getvalue('oldpwd'), form.getvalue('user')))
		msgprint('Password Reset')
	else:
		msgprint('Old Password is not correct. Did not reset!')

# Search Fields
# -------------

def getsearchfields(form, session):
	sf = sql("select search_fields from tabDocType where name=%s", form.getvalue("doctype"))
	sf = sf and sf[0][0] or ''
	sf = [s.strip() for s in sf.split(',')]
	if sf and sf[0]:
		res = sql("select fieldname, label, fieldtype, options from tabDocField where parent='%s' and fieldname in (%s)" % (form.getvalue("doctype","_NA"), '"'+'","'.join(sf)+'"'))
	else:
		res = []

	res = [[c or '' for c in r] for r in res]
	for r in res:
		if r[2]=='Select' and r[3] and r[3].startswith('link:'):
			dt = r[3][5:]
			ol = sql("select name from `tab%s` where docstatus!=2 order by name asc" % dt)
			r[3] = '\n'.join([''] + [o[0] for o in ol])
			

	out['searchfields'] = [['name', 'ID', 'Data', '']] + res

# Testing
# -------

def start_test(form,session):
	session['data']['__testing'] = 1

def end_test(form,session):
	session['data']['__testing'] = 0

def setup_test(form, session):
	names = server.get_testing_tables()
	for n in names:
		ntest = 'test'+n[3:]
		if n.startswith('tab'):
			sql("DROP TABLE IF EXISTS `%s`" % ntest)
			sql("CREATE TABLE `%s` LIKE `%s`" % (ntest, n), allow_testing = 0)
			sql("INSERT INTO `%s` SELECT * FROM `%s`" % (ntest, n), allow_testing = 0)

# Export
# ------

def export_data(form, session):
	c = server.getcursor()
	c.execute("select * from `tab%s`" % form.getvalue('dt'))
	dataset = c.fetchall()
	
	l = []
	for r in dataset:			
		l.append(','.join([getCSVelement(i) for i in r]))
	
	txt = '\n'.join(l)
	out['export_data'] = (','.join([i[0] for i in c.description])) + '\n' + ('\n'.join(l))

# Module Exchange
# ---------------

def init_acc_mgmt(form,session):

	res = sql('SELECT name from tabDocType')	
	res = [r[0] for r in res]
	out['dt_list'] = res	
	out['acc_list'] = []

	db_name = incookies.get('dbx', server.db_name)
	if not db_name:
		db_name = server.db_name
		
	tab_list = server.sql_accounts("show tables")
	tab_list = [r[0] for r in tab_list]
		
	if 'tabAccount' in tab_list:
		try:
			res = server.sql_accounts('select ac_name from tabAccount')
			out['acc_list'] = [i[0] for i in res]
	
			ac_name = server.sql_accounts('select ac_name from tabAccount where db_name="%s"' % db_name)
			ac_name = ac_name and ac_name[0][0] or db_name
		except:
			ac_name = 'accounts'
	else:
		ac_name = 'accounts'

	out['account_id'] = db_name
	out['acc'] = ac_name
	out['user'] = session['user']

def get_modules(form, session):
	if form.has_key('ac_name') and form.getvalue('ac_name'):
		server.use_account(ac_name = form.getvalue('ac_name'))

	res = sql("select name from `tabModule Def`")
	out['mod_list'] = [i[0] for i in res]

def get_dt_version(form, session):
	if form.has_key('dn'):
		try:
			out['message'] = sql("select version from tabDocType where name=%s", form.getvalue('dn'))[0][0]
		except:
			out['message'] = 0

def get_module_doctypes(src, mod):
	if src:
		server.use_account(ac_name = src)

	exp_list = server.get_module_items(mod)

	doc_list = []
	
	no_export_fields = ('creation','modified_by','owner','server_code_compiled','recent_documents','oldfieldtype','oldfieldname','superclass','ss_colourkey','has_monitors','onupdate','permtype','no_copy', 'print_hide','transaction_safe','setup_test')

	for e in exp_list:
		doc_list += server.getdoc(e[0], e[1])

		for d in doc_list:
			for f in no_export_fields:
				if d.fields.has_key(f): del d.fields[f]

	return doc_list

def export_module(form,session):
	dt_list = get_module_doctypes(form.getvalue('src'), form.getvalue('mod'))
	
	l = '['
	for d in dt_list:
		l += str(d.fields) + ",\n"
	
	out['export_data'] = l + ']'

def import_docs(form, session):
	if form.getvalue('tar'):
		server.use_account(ac_name = form.getvalue('tar'))
	msgprint(server.import_docs(eval(form.getvalue('data'))))


# ----------------------------------------
# Account Transfer using HTTP Web Services
# ----------------------------------------

def acctr_get_sid(form, session):
	rem_serv = server.FrameworkServer(
		form.getvalue('server')
		,form.getvalue('path')
		,form.getvalue('user')
		,form.getvalue('pwd')
		,form.getvalue('account', '')
	)
	
	out['sid'] = rem_serv.cookies['sid150']
	out['dbx'] = rem_serv.cookies.get('dbx','')
	out['__account'] = rem_serv.account_id
	
	# get 500 doctypes
	res = rem_serv.http_get_response('acctr_remote_dtlist', args = {
		'dt':'DocType', 'txt':'', 'limit':'500'
	})
	
	# return 500 doctypes
	data = eval(res.read())
	if data.get('dt_list', []): out['dt_list'] = data['dt_list']	

	# get modules defs
	res = rem_serv.http_get_response('acctr_remote_dtlist', args = {
		'dt':'Module Def' ,'txt':'' ,'limit':'500'
	})
	
	data = eval(res.read())
	if data.get('dt_list', []): out['moduledef_list'] = data['dt_list']

def acctr_get_dtlist(form, session):
	# get doctype list
	rem_serv = server.FrameworkServer(
		form.getvalue('server')
		,form.getvalue('path')
		,cookies = { 'sid150': form.getvalue('sid'), 'dbx': form.getvalue('dbx', '') }
	)
	
	# get records
	res = rem_serv.http_get_response('acctr_remote_dtlist', args = {
		'dt':form.getvalue('dt')
		,'txt':form.getvalue('txt', '')
		,'limit':form.getvalue('limit', '100')
	})
	
	# return 500 doctypes
	data = eval(res.read())
	if data.get('dt_list', []):
		out['dt_list'] = data['dt_list']	

def acctr_do_transfer(form, session):
	# get doclist from source
	# -----------------------
		
	# connect
	src_serv = server.FrameworkServer(
		form.getvalue('src_server')
		,form.getvalue('src_path')
		,cookies = { 'sid150': form.getvalue('src_sid'), 'dbx': form.getvalue('src_dbx') }
	)
	
	# get
	myargs = {'__account':form.getvalue('src__account')}
	if form.has_key('dt'): myargs['dt'] = form.getvalue('dt')
	if form.has_key('dn'): myargs['dn'] = form.getvalue('dn')
	if form.has_key('query'): myargs['query'] = form.getvalue('query')
	if form.has_key('moduledef'): myargs['moduledef'] = form.getvalue('moduledef')
	
	res = src_serv.http_get_response(
		method = 'acctr_remote_getdoclist', 
		args = myargs,
	)
	data = res.read()

	# if no, then return error

	# put it in target
	# ----------------

	# connect
	tar_serv = server.FrameworkServer(
		form.getvalue('tar_server')
		,form.getvalue('tar_path')
		,cookies = { 'sid150': form.getvalue('tar_sid'), 'dbx': form.getvalue('tar_dbx') }
	)

	# set
	myargs = {
		'ovr': form.getvalue('ovr'),
		'ignore': form.getvalue('ignore'),
		'onupdate': form.getvalue('onupdate'),
		'super_doclist': data,
		'__account':form.getvalue('tar__account')
	}
	
	res = tar_serv.http_get_response(
		method = 'acctr_remote_setdoclist',
		args = myargs 
	)
	data = res.read()
	data = eval(data)

	out['message'] = data['message']
	if data.has_key('exc'):
		out['exc']=data['exc']

def acctr_remote_dtlist(form, session):
	dt = form.getvalue('dt')
	limit = form.getvalue('limit', '100')
	dl = sql("SELECT name FROM `tab%s` WHERE name LIKE '%s%%' LIMIT %s" % (dt, form.getvalue('txt', ''), limit))
	out['dt_list'] = '\n'.join([t[0] for t in dl])

# create doclist to send for transfer
def acctr_remote_getdoclist(form, session):
	super_doclist = []

	# one at a time
	if form.has_key('dt'):
		t = server.getdoc(form.getvalue('dt'), form.getvalue('dn'))
		if t[0].server_code_compiled:
			t[0].server_code_compiled = None
		super_doclist.append([d.fields for d in t])

	# from a query
	if form.has_key('query'):
		dl = sql(form.getvalue('query'))
		for d in dl:
			t = server.getdoc(d[0], d[1])
			if t[0].server_code_compiled:
				t[0].server_code_compiled = None			
			super_doclist.append([d.fields for d in t])
			
	# from moduledef
	if form.has_key('moduledef'):
		dl = get_module_items(form.getvalue('moduledef'))
		for d in dl:
			t = server.getdoc(d[0], d[1])
			if t[0].server_code_compiled:
				t[0].server_code_compiled = None			
			super_doclist.append([d.fields for d in t])

	# return
	out['super_doclist'] = super_doclist

def acctr_remote_setdoclist(form, session):
	cint = server.cint
		
	msg, i = [], 0
	super_doclist = eval(form.getvalue('super_doclist'))['super_doclist']

	for dl in super_doclist:
		msg.append(server.set_doc(dl, cint(form.getvalue('ovr')), cint(form.getvalue('ignore')), cint(form.getvalue('onupdate'))))
	msg = '<br>'.join(msg)

	if not server.in_transaction:
		sql("START TRANSACTION")
	server.clear_recycle_bin()
	sql("COMMIT")

	out['message'] = msg

# --------
# FTP Sync
# --------

def do_sync(form, session):
	global fw_folder
	import ftpsync
	remote_system = 'ftp://%s:%s@%s' % (form.getvalue('user_id'), form.getvalue('user_pwd'), form.getvalue('remote_system'))
	local_system = fw_folder+form.getvalue('local_system')

	if local_system[:-1]!= '/': local_system += '/'
	if remote_system[:-1]!= '/': local_system += '/'

	ftpsync.do_sync(remote_system, local_system)
	ftpsync.stdout_str.seek(0)
	out['message'] = ftpsync.stdout_str.read()
	ftpsync.stdout_str.close()
	
def get_sync_update(form, session):
	f = open('.output.tmp','r')
	f.seek(0)
	out['message'] = f.read()
	f.close()

# -------------
# Create Backup
# -------------

def backupdb(form, session):
	db_name = server.decrypt(form.getvalue('db_name'))

	server.backup_db(db_name)

	out['type'] = 'download'
	out['filename'] = db_name+'.tar.gz'
	out['filecontent'] = open('../backups/' + db_name+'.tar.gz','rb').read()

# Error log
# ---------

def client_err_log(form, session):
	save_log(form.getvalue('error', 'Client'))

def save_log(t, errtype = ''):
	l = server.Document('Error Log')
	l.errtype = errtype or 'Server'
	l.user = session['user']
	l.time = server.nowdate()
	l.date = server.now()
	l.error = t
	try:
		l.save(1)
	except: #bc
		pass

# Logout
# ------

def logout(form, session):
	server.delete_session()
	cookies['sid150'] = ''
	cookies['remember_me'] = ''

# ----------------
# Loading
# ----------------

incookies = server.get_cookies()

# login: app
def login_app(form,session):
	app = server.Document('Application',form.getvalue('app_name'))
	
	user = session["user"]
	if form.has_key("sub_id"):
		sub = server.Document('App Subscription',form.getvalue("sub_id"))
		# will be blank for global login
		if sub.remote_login_id and sub.remote_login_id != '__system@webnotestech.com': 
			user = sub.remote_login_id
		if sub.membership_type=='Administrator':
			user = 'Administrator'
	
	if app.server and app.pwd:
		fw = server.FrameworkServer(app.server, app.path, user, app.pwd, app.account_name)
		out['url'] = app.server + app.path
		out['sid'] = fw.sid
		out['__account'] = fw.account_id
		if fw.cookies.has_key('dbx'): out['dbx'] = fw.cookies['dbx']
	else:
		msgprint("Application not defined correctly")

# login: authenticate user and start a session
# --------------------------------------------

def login_user(usr, pwd, form, guest_login = 0):
	global out, session, cookes, defaults
	
	remote_ip = os.environ.get('REMOTE_ADDR')	
	userid = server.authenticate(usr, pwd, remote_ip)
	if userid:
		sql("start transaction")
		try:
			server.log("Login", '')
	
			try: # update last login
				sql("UPDATE tabProfile SET last_login = '%s' where name='%s'" % (server.now(), userid[0][0]))
				sql("UPDATE tabProfile SET last_ip = '%s' where name='%s'" % (os.environ.get('REMOTE_ADDR'), userid[0][0]))
			except: pass

			# create session
			session = {}
			session['user'] = userid[0][0]
			session['sid'] = server.generate_hash()
			cookies['sid150'] = session['sid']
			cookies[server.encrypt(server.db_name)] = session['sid'] # dual keys
			session['data'] = {}
			if remote_ip == server.gateway_ip:
				session['data']['from_gateway'] = 1
			
			defaults = {}
			
			server.start_session(session)
			server.session = session
			return 1
			sql("commit")
		except Exception, e:
			sql("rollback")
			raise e
	else:
		return 0

def set_db_name(acc_id):
	global cookies
	import os
	
	domain, res = os.environ.get('HTTP_HOST'), None
	
	try:
		res = server.sql_accounts("select tabAccount.db_name, tabAccount.db_login from tabAccount, `tabAccount Domain` where tabAccount.name = `tabAccount Domain`.parent and `tabAccount Domain`.domain = '%s'" % domain)
	except:
		pass
		
	if not res:
		try:
			res = server.sql_accounts("select db_name, db_login from tabAccount where ac_name = '%s'" % acc_id)
		except:
			pass
		
	if res:
		server.db_name = res[0][0]
		if res[0][1]:
			server.db_login = res[0][1]
		else:
			server.db_login = res[0][0]
		cookies['dbx'] = res[0][0]

# load session
# ------------

def load_session(form, sid):
	global session
	session = server.load_session(sid)
	server.session = session

	# set is_testing
	# --------------

	if session:
		server.is_testing = session.get('data', {}).get('__testing',0)

# Execution Starts Here
# ---------------------------------------------------------------------

if form.has_key('cmd') and (form.getvalue('cmd')=='reset_password'):
	sql("start transaction")
	reset_password(form, session)
	sql("commit")

elif form.has_key('cmd') and (form.getvalue('cmd')=='login'):
	# check if account given, login from the account else from defs.py
	
	account_id = form.has_key('acx') and form.getvalue('acx') or ''
	set_db_name(account_id) # get db_name
	
	cookies['single_account'] = account_id and 'No' or 'Yes'
	
	out['__account'] = str(server.encrypt(server.db_name))

	# check login, pwd
	if login_user(form.getvalue('usr'), form.getvalue('pwd'), form): 
		out['message'] = 'Logged In'
		out['sid150'] = str(session['sid'])
		
		# remember me - add max-age to cookies
		if server.cint(form.getvalue('remember_me')):
			import datetime
			cookies['remember_me'] = 1
			expires = datetime.datetime.now() + datetime.timedelta(days=3)
			for k in cookies.keys():
				cookies[k]['expires'] = expires.strftime('%a, %d %b %Y %H:%M:%S')
		
	# try logging in as guest
	elif login_user('Guest', form.getvalue('pwd'), form, 1): 
		out['message'] = 'Logged In'
		out['sid150'] = str(session['sid'])
	else: 
		out['message'] = 'Wrong Login / Password or Not Enabled'

elif form.has_key('cmd') and (form.getvalue('cmd')=='prelogin'):
	# register
	# ----------------------------------
	
	if form.has_key('ac'):
		set_db_name(form.getvalue('ac'))
	
	sql("START TRANSACTION")
	try:
		out['message'] = server.get_obj('Profile Control').prelogin(form) or ''
		sql("COMMIT")
	except:
		errprint(server.getTraceback())
		sql("ROLLBACK")
else:
	sid = None

	# from cookies
	# ------------
	
	if incookies.has_key('sid150') and incookies['sid150']:
		sid = incookies['sid150']

		if incookies.has_key('dbx') and incookies['dbx']:
			server.db_name = incookies['dbx']
			server.db_login = incookies['dbx']

	# sid & app id is given
	# ---------------------

	if form.getvalue('sid150') and form.getvalue('__account'):
		sid = form.getvalue('sid150')
		if incookies.get('single_account') != 'Yes':
			dbx = str(server.decrypt(form.getvalue('__account')))
			server.db_name = dbx
			server.db_login = dbx

	# load session
	if sid:
		load_session(form, sid)

	# check for guest login, if no session
	# ------------------------------------

	if not session:
		set_db_name(None)
		if sql("select name from tabProfile where name='Guest' and (enabled=1 and enabled IS NOT NULL)"):
			# if from a domain, set the db		
			if login_user('Guest', 'password', form):
				sid = session['sid']
			else:
				errprint('[Authentication Error] Guest Account does not have correct login')
		else:
			if not sid:
				errprint('[Authentication Error] Login is Required')
			else:
				errprint('[Authentication Error] Session Expired')
			cookies['remember_me'] = ''
			out['__redirect_login'] = 1
	
	# all clear - run the show
	# ------------------------
	
	if sid and session:
		session['sid'] = sid
		
		# get command cmd
		cmd = form.has_key('cmd') and form.getvalue('cmd') or None
		read_only = form.has_key('_read_only') and form.getvalue('_read_only') or None

		# do something
		if cmd:
			f = locals()[cmd]
			if (not read_only) and (not server.in_transaction): sql("START TRANSACTION")
			try:
				f(form, session) # execute the command

				# update session
				if not read_only: server.update_session(session)
				if not read_only: sql("COMMIT")
			except:
				errprint(server.getTraceback())
				if not read_only: sql("ROLLBACK")

#### cleanup
#-----------

if server.in_transaction:
	sql("COMMIT")

if server.conn:
	server.conn.close()

#### go

import string
import os

acceptsGzip, out_buf, str_out = 0, None, None
try:
	if string.find(os.environ["HTTP_ACCEPT_ENCODING"], "gzip") != -1:
		acceptsGzip = 1 # problem in win ?
except:
	pass

def compressBuf(buf):
	import gzip, cStringIO
	zbuf = cStringIO.StringIO()
	zfile = gzip.GzipFile(mode = 'wb',  fileobj = zbuf, compresslevel = 5)
	zfile.write(buf)
	zfile.close()
	return zbuf.getvalue()

if out.get('type')=='csv':
	print "Content-Type: text/csv"
	print "Content-Disposition: filename="+out['doctype'].replace(' ', '_')+".csv"
	print
	print out['result']
elif out.get('type')=='iframe':
	print "Content-Type: text/html"
	print
	print out['result']
elif out.get('type')=='download':
	import mimetypes
	print "Content-Type: %s" % (mimetypes.guess_type(out['filename'])[0] or 'application/unknown')
	print "Content-Disposition: filename="+out['filename'].replace(' ', '_')
	print
	print out['filecontent']
else:
	if server.debug_log:
		save_log = 1
		if server.debug_log[0].startswith('[Validation Error]'):
			save_log = 0

		t = '\n----------------\n'.join(server.debug_log)
		if errdoctype: 
			t = t + '\nDocType: ' + errdoctype
		if errdoc: 
			t = t + '\nName: ' + errdoc
		if errmethod: 
			t = t + '\nMethod: ' + errmethod
		out['exc'] = t

		if save_log: # don't save validation errors
			try:  save_log(t, 'Server')
			except: pass

	if server.message_log:
		out['server_messages'] = '\n----------------\n'.join(server.message_log)

	str_out = str(out)

	if acceptsGzip and len(str_out)>512:
		out_buf = compressBuf(str_out)
		print "Content-Encoding: gzip"
		print "Content-Length: %d" % (len(out_buf))
	print "Content-Type: text/html"
	if cookies:
		if server.cookies: cookes.update(server.cookies)
		print cookies
	print # Headers end
	
if out_buf:
	sys.stdout.write(out_buf)
elif str_out:
	print str_out
