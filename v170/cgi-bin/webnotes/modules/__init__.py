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