def upload():
	import webnotes
	import webnotes.utils
	
	form = webnotes.form

	# get record details
	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
	at_id = form.getvalue('at_id')

	webnotes.response['type'] = 'iframe'

	try:
		# has attachment?
		if 'filedata' in form:
			i = form['filedata']
			
			# scrub file name
			fname = i.filename
			if '\\' in fname:
				fname = fname.split('\\')[-1]
			if '/' in fname:
				fname = fname.split('/')[-1]
	
			# get the file id
			fileid = save_file(fname, i.file.read())
			
			# okay
			webnotes.response['result'] = """
			<script type='text/javascript'>
				window.parent._f.file_upload_done('%s', '%s', '%s', '%s', '%s');
				window.parent.frms['%s'].show_doc('%s');
			</script>""" % (dt, dn, fileid, fname.replace("'", "\\'"), at_id, dt, dn)
		else:
			webnotes.response['result'] = """<script type='text/javascript'>window.parent.msgprint("No file")</script>"""	
			
	except Exception, e:
		webnotes.response['result'] = """<script type='text/javascript'>window.parent.msgprint("%s")</script>""" % webnotes.utils.getTraceback().replace('\n','<br>').replace('"', '\\"')	

# -------------------------------------------------------

def save_file(fname, content):
	from webnotes.model.doc import Document

	# generate the ID (?)
	f = Document('File Data')
	f.file_name = fname
	f.save(1)
	fid = f.name.replace('/','-')
	
	write_file(fid, content)

# -------------------------------------------------------

def write_file(fid, content):
	import webnotes, os

	# save to a folder (not accessible to public)
	folder = webnotes.get_files_path()
		
	# create account folder (if not exists)
	webnotes.create_folder(folder)

	# write the file
	file = open(os.path.join(folder, fid),'w+')
	file.write(content)
	file.close()
	
	return f.name
	
# -------------------------------------------------------

def delete_file(file_id):
	import webnotes, os
	
	# delete fileid
	f = webnotes.conn.sql("select file_name from `tabFile Data` where name=%s", file_id)
	
	if not f:
		webnotes.msgprint("Wrong File ID")
		return
	
	webnotes.conn.sql("delete from `tabFile Data` where name=%s", file_id)
	
	# delete file
	os.remove(os.path.join(webnotes.get_files_path(), file_id))

# Get File
# -------------------------------------------------------

def get_file(fname):
	import webnotes
	in_fname = fname
	
	# from the "File" table
	if webnotes.conn.exists('File',fname):
		fname = webnotes.conn.sql("select file_list from tabFile where name=%s", fname)
		fname = fname and fname[0][0]
		fname = fname.split('\n')[0].split(',')[1]
	
	# from file-data
	file_id = fname
	ret = webnotes.conn.sql("select file_name from `tabFile Data` where name=%s limit 1", fname)
	if not ret:
		ret = webnotes.conn.sql("select file_name, name from `tabFile Data` where file_name=%s limit 1", fname)
		file_id = ret[0][1]
		
	# read the file
	import os
	
	file_id = file_id.replace('/','-')
	file = open(os.path.join(webnotes.get_files_path(), file_id), 'r')
	return [ret[0][0], file.read()]

# Conversion Patch
# -------------------------------------------------------

def convert_to_files(verbose=0):
	import webnotes
	
	# nfiles
	fl = webnotes.conn.sql("select name from `tabFile Data`")
	for f in fl:
		# get the blob
		blob = webnotes.conn.sql("select blob_content from `tabFile Data` where name=%s", f[0])[0][0]
		
		if blob:
			# write the file
			write_file(f[0], blob)
						
			if verbose:
				webnotes.msgprint('%s updated' % f[0])

# -------------------------------------------------------
