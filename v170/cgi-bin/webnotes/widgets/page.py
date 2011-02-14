import webnotes
import webnotes.model.doc
import webnotes.model.code

conn = webnotes.app_conn or webnotes.conn

class Page:
	def __init__(self, name):
		self.name = name

	def load(self):	
		from webnotes.modules import compress
		from webnotes.model.code import get_code
		
		doclist = webnotes.model.doc.get('Page', self.name)
		doc = doclist[0]

		doc.script = None
		doc.fields['__script'] = compress.get_page_js(self.name)

		if doc.standard!='No':
			template = '%(content)s'
			# load code from template
			if doc.template:
				template = get_code(webnotes.conn.get_value('Page Template', doc.template, 'module'), 'Page Template', doc.template, 'html')

			doc.content = template % {'content':get_code(doc.module, 'page', doc.name, 'html')}
			doc.style = get_code(doc.module, 'page', doc.name, 'css')

		
		# execute content
		if doc.content and doc.content.startswith('#python'):
			doc.fields['__content'] = webnotes.model.code.execute(doc.content)
			
		# add stylesheet
		if doc.stylesheet:
			doclist += self.load_stylesheet(doc.stylesheet)
			
		return doclist

	def load_stylesheet(self, stylesheet):
		import webnotes
		# load stylesheet
		loaded = eval(webnotes.form_dict.get('stylesheets') or '[]')
		if not stylesheet in loaded:
			import webnotes.model.doc
			from webnotes.model.code import get_code
			
			# doclist
			sslist = webnotes.model.doc.get('Stylesheet', stylesheet)
			
			# stylesheet from module
			sslist[0].stylesheet = get_code(sslist[0].module, 'Stylesheet', stylesheet, 'css')
			return sslist
		else:
			return []

def get(name):
	return Page(name).load()

def getpage():
	doclist = get(webnotes.form.getvalue('name'))
		
	# send
	webnotes.response['docs'] = doclist
	
	
