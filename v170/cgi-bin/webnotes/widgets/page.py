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
			doc.content = get_code(doc.module, 'page', doc.name, 'html')
			doc.style = get_code(doc.module, 'page', doc.name, 'css')
		
		if doc.fields.get('content') and doc.content.startswith('#python'):
			doc.fields['__content'] = webnotes.model.code.execute(doc.content)
		return doclist

def get(name):
	return Page(name).load()

def getpage():
	webnotes.response['docs'] = get(webnotes.form.getvalue('name'))
