out = '''<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head id="head">
<!-- Web Notes Framework : www.webnotesframework.org -->

  <META http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
  <title>Main Page</title>
  <link type="text/css" rel="stylesheet" href="css/default.css?v=1.6.0">
  <link type="text/css" rel="stylesheet" href="css/user.css?v=1.6.0">
  <link rel="Shortcut Icon" href="/favicon.ico">
  
 <script language="JavaScript" src="js/wnf.compressed.js"></script>

<script type="text/javascript">
 window.dhtmlHistory.create({ debugMode: false });
</script>

</head>
<body>
<div id="startup_div">

</div>

<!-- Main Starts -->

<div id="loading_div">
	<table><tr>
		<td style='width:20px'><img src='images/ui/loading.gif'></td>
		<td style='width:60px'>Loading...</td>
	</tr></table>
</div>

<div id="body_div"> 

	<!--static (no script) content-->
	<div class="no_script">
		%(content)s
	</div>

</div>
	
<div id="dialogs">
	<div id="dialog_message"></div>
</div>
<div id="dialog_back"></div>

<div id="floating_message">
	<table><tr>
	<td id="fm_content"></div>
	<td id="fm_cancel" class="link_type">Cancel</td>
	</tr></table>
</div>

</body>
</html>
'''
def get_page_content(page_name):
	pass

def get_doc_content(dt, dn):
	pass

def get_static_content():
	import webnotes
	import webnotes.widgets.page

	form = webnotes.form
		
	page = form.getvalue('page', '')
	if not page: # load from control panel
		page =  webnotes.user.get_home_page()
		
	# Create Search Engine Friendly Pages
	# -----------------------------------
		
	links_html = content = ''
	
	if page:
		# load the content
		# ----------------
		try:
			content = webnotes.conn.sql("select content, static_content from tabPage where name=%s", page)
			if content:
				content = content[0][1] or content[0][0]
		except:
			content = webnotes.conn.sql("select content from tabPage where name=%s", page)
			if content:
				content = content[0][0]
					
		if content and content.startswith('#python'):
			content = webnotes.widgets.page.exec_page(content, form)
		content = '' # temp fix for id issues
		
	# load the links
	# --------------
		
	# load root links
	try:
		mc = webnotes.model.code.get_obj('Menu Control')
		ml = mc.get_children('', 'Page', ['Guest'])
		
		if page:
			# load child links to the current page	
			parent_node = webnotes.conn.sql("select name from `tabMenu Item` where link_id=%s and menu_item_type='Page'", page)
			ml += mc.get_children('', 'Page', ['Guest'])
			
		links_html = '<br>'.join(['<a href="index.cgi?page=%s&page_content=%s">%s</a>' % (m['link_id'], m['link_content'], m['link_id']) for m in ml])
		
	except:
		pass
		
	if content:
		content_html = content
	else:
		content_html = '<h2>Page "%s" not found</h2>' % page

	return content_html