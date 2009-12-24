import webnotes
import webnotes.model
import webnotes.model.doc

NULL_CHAR = '^\5*'

def xzip(a,b):
	d = {}
	for i in range(len(a)):
		d[a[i]] = b[i]
	return d
	
def expand(docs):
	import string
	
	N1 = "'" + NULL_CHAR + "'"
	N2 = '"' + NULL_CHAR + '"'
	docs = eval(docs.replace(chr(0),'').replace(N1, 'None').replace(N2, 'None'))
	clist = []
	for d in docs['_vl']:
		doc = xzip(docs['_kl'][d[0]], d);
		clist.append(doc)
	return clist

def compress(doclist):
	if doclist and hasattr(doclist[0],'fields'):
		docs = [d.fields for d in doclist]
	else:
		docs = doclist
		
	kl, vl = {}, []
	for d in docs:
		dt = d['doctype']
		if not (dt in kl.keys()):
			fl = d.keys()
			nl = ['doctype','localname','__oldparent','__unsaved']
			for f in fl:
				if not (f in nl): nl.append(f)
			kl[dt] = nl
		## values
		fl = kl[dt]
		nl = []
		for f in fl:
			v = d.get(f)
			if v==None:
				v=NULL_CHAR
			if type(v)==long:
				v=int(v)
			nl.append(v)
		vl.append(nl)
	#errprint(str({'_vl':vl,'_kl':kl}))
	return {'_vl':vl,'_kl':kl}

# Get Children List (for scripts utility)
# ---------------------------------------

def getlist(doclist, field):
	l = []
	for d in doclist:
		if d.parent and (not d.parent.lower().startswith('old_parent:')) and d.parentfield == field:
			l.append(d)
	return l

# Validate Multiple Links
# -----------------------

def validate_links_doclist(doclist):
	ref, err_list = {}, []
	for d in doclist:
		if not ref.get(d.doctype):
			ref[d.doctype] = d.make_link_list()
			
	err_list += d.validate_links(ref[d.doctype])
	return ', '.join(err_list)
	
# Get list of field values
# ------------------------

def getvaluelist(doclist, fieldname):
	l = []
	for d in doclist:
		l.append(d.fields[fieldname])
	return l

# Get Children
# ------------

def getchildren(name, childtype, field='', parenttype=''):
	
	tmp = ''
	if field: 
		tmp = ' and parentfield="%s" ' % field
	if parenttype: 
		tmp = ' and parenttype="%s" ' % parenttype

	dataset = webnotes.conn.sql("select * from `tab%s` where parent='%s' %s order by idx" % (childtype, name, tmp))

	l = []
	for i in range(len(dataset)):
		d = webnotes.model.doc.Document()
		d.doctype = childtype
		d.loadfields(dataset, i, webnotes.conn.get_description())
		l.append(d)
	return l
