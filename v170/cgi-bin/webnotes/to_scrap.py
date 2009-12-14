# Start session
# -------------

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
	
	out['account'] = ''
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