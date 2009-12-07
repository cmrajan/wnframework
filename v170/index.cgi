#!/usr/bin/python

out = '''<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head id="head">
<!-- App.Html

/* Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 

    Web Notes Framework is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For a copy of the GNU General Public License see 
    <http://www.gnu.org/licenses/>.
    
    Web Notes Framework is also available under a commercial license with
    patches, upgrades and support. For more information see 
    <http://webnotestech.com>
*/

-->
  <META http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
  <title>Main Page</title>
  <link type="text/css" rel="stylesheet" href="css/default.css?v=1.6.0">
  <link type="text/css" rel="stylesheet" href="css/user.css?v=1.6.0">
  <link rel="Shortcut Icon" href="/favicon.ico">
  
 <script type="text/javascript" src="js/shadedborder.js"></script>
 <script language="JavaScript" src="js/app2.js?v=1.6.0"></script>
 <script language="JavaScript" src="js/widgets/form.js"></script>
 <script language="JavaScript" src="js/widgets/report_table.js"></script>
 <script language="JavaScript" src="js/widgets/calendar.js"></script>
 <script type="text/javascript" src="js/rsh.compressed.js"></script>
 <script language="JavaScript" src="js/user.js"></script>
 <script language="JavaScript" src="js/tiny_mce/tiny_mce_gzip.js"></script>

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
		<div id="destination_page">%(destination_page)s</div>
		<div class="static_links">
		%(links)s
		</div>
		<div class="static_page">
		%(content)s
		</div>
	</div>

	<div id="head_div">
		<div class="top_bar" id="wn_toolbar">
			<div id="topmenu_div"></div>
			<div id="user_div">
				<span id='user_id'></span> | 
				<a href="#" onclick='edit_profile()' class="logout_link">Profile</a> | 
				<a href="#" onclick='logout()' class="logout_link">Logout</a>
			</div>
			<div onclick='about_dialog.show()' class="about_link"></div>
			
			<div id="qsearch_sel"></div>
			<div id="qsearch_btn"></div>
			
			<div id='testing_div'>Testing Mode</div>
		</div>
	
		<div id="head_banner"></div>
	</div>
	<div id="main_div">
	  <div>
		  <table id="main_table">
		  	<tr>
			  <td id="menu_div"></td>
			  <td id="center_div"></td>
			  <td id="right_sidebar_div"></td>
		    </tr>
		    <tr>
		      <td colspan=3><div id="footer_div"></div></td>
		    </tr>
		  </table>
	  </div>
	</div>
	<div id="dialog_back">
	</div>
</div>
	
<div id="dialogs">
	<div id="dialog_message"></div>
</div>

<div id="caldiv"></div>

<div id="floating_message">
	<table><tr>
	<td id="fm_content"></div>
	<td id="fm_cancel" class="link_type">Cancel</td>
	</tr></table>
</div>

</body>
</html>
'''

try:

	import sys, os, cgi, Cookie
	
	sys.path.append(os.getcwd()+'/cgi-bin')

	def getTraceback():
		import sys, traceback, string
		type, value, tb = sys.exc_info()
		body = "Traceback (innermost last):\n"
		list = traceback.format_tb(tb, None) \
			+ traceback.format_exception_only(type, value)
		body = body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])
		return body
		
	import server
	incookies = server.get_cookies()
	form = cgi.FieldStorage()
	
	page = form.getvalue('page', '')
	if not page: # load from control panel
		page = server.get_home_page()
	
	# Create Search Engine Friendly Pages
	# -----------------------------------
	
	links_html = content = ''

	if page:
		# load the content
		# ----------------
		try:
			content = server.sql("select content, static_content from tabPage where name=%s", page)
			if content:
				content = content[0][1] or content[0][0]
		except:
			content = server.sql("select content from tabPage where name=%s", page)
			if content:
				content = content[0][0]
				
		if content and content.startswith('#python'):
			content = server.exec_page(content, form)
		content = '' # temp fix for id issues
	
	# load the links
	# --------------
	
	# load root links
	try:
		mc = server.get_obj('Menu Control')
		ml = mc.get_children('', 'Page', ['Guest'])
		
		if page:
			# load child links to the current page	
			parent_node = server.sql("select name from `tabMenu Item` where link_id=%s and menu_item_type='Page'", page)
			ml += mc.get_children('', 'Page', ['Guest'])
		
		links_html = '<br>'.join(['<a href="index.cgi?page=%s&page_content=%s">%s</a>' % (m['link_id'], m['link_content'], m['link_id']) for m in ml])
	
	except:
		pass
	
	if content:
		content_html = content
	else:
		content_html = '<h2>Page "%s" not found</h2>' % page
		# log

	print "Content-Type: text/html"
	print
#	print out
	print out % {'links':links_html, 'content':content_html, 'destination_page':(page and page or '')}
			
except Exception, e:
	print "Content-Type: text/html"
	print
	print getTraceback().replace('\n','<br>')
	