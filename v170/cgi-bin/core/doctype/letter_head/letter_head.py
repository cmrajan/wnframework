# Please edit this list and import only required elements
import webnotes
from webnotes import msgprint

sql = webnotes.conn.sql

class DocType:
	def __init__(self, doc, doclist=[]):
		self.doc = doc
		self.doclist = doclist
	
	#
	# on update
	#
	def on_update(self):
		if self.doc.file_list and self.doc.set_from_image:
			self.set_html_from_image()

		# update control panel - so it loads new letter directly
		webnotes.conn.set_value('Control Panel', None, 'letter_head', self.doc.content)
		 
		# clear the cache so that the new letter head is uploaded
		sql("delete from __SessionCache")

		self.set_as_default()

	#
	# set html for image
	#
	def set_html_from_image(self):
		file_name = self.doc.file_list.split(',')[0]
		img_link = '<div><img src="'+ self.my_url +'/cgi-bin/getfile.cgi?name=' + file_name + '"/></div>'
		webnotes.conn.set(self.doc, 'content', img_link)
	
	#
	# get url
	#
	def validate(self):
		url = self.doc.url.split('#')[0].split('?')[0].split('index.cgi')[0]
		if url[-1]=='/': url = url[:-1]
		self.my_url = url
		
	#
	# this is default, un-set everyone else
	#
	def set_as_default(self):
		from webnotes.utils import set_default
		if self.doc.is_default:
			sql("update `tabLetter Head` set is_default=0 where name != %s", self.doc.name)
		set_default('letter_head', self.doc.name)