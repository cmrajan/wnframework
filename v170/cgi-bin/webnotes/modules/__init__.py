transfer_types = ['Role', 'Print Format','DocType','Page','DocType Mapper','GL Mapper','Search Criteria', 'Patch']

def scrub(txt):
	return txt.replace(' ','_').replace('-', '_').replace('/', '_').lower()
	
def get_file_timestamp(fn):
	import os
	try:
		return str(os.stat(fn))
	except OSError, e:
		if e.args[0]!=2:
			raise e
		else:
			return None
			
def get_module_path(module):
	import webnotes.defs, os, os.path
	
	# get module path by importing the module
	modules_path = os.path.join(webnotes.defs.modules_path, scrub(module))
	
	try:
		exec ('import ' + scrub(module)) in locals()
		modules_path = eval(scrub(module) + '.__file__')
		
		modules_path = os.path.sep.join(modules_path.split(os.path.sep)[:-1])
	except ImportError, e:
		pass

	return modules_path