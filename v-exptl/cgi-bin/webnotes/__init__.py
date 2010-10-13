# webnotes init (all shared variables come here)
import logging
import time
import logging.handlers

webnotes_logger = logging.getLogger('WNLogger')

webnotes_logger.setLevel(logging.DEBUG)

wnlog_handler = logging.handlers.RotatingFileHandler(LOG_FILENAME,maxByetes=30000,backupCount = 5)
wnlog_handler.addHandler(wnlog_handler)

version = 'v170'
LOG_FILENAME = 'log/'+time
auth_obj = None
conn = None
form = None
session = None
user = None
is_testing = None
incoming_cookies = {}
add_cookies = {}

# for applications
app_conn = None
adt_list = ['DocType', 'DocField', 'DocPerm']

# json response object
response = {'message':'', 'exc':''}

debug_log, message_log = [], []

def errprint(msg):
	debug_log.append(str(msg or ''))

def msgprint(msg, small=0):
	message_log.append((small and '__small:' or '')+str(msg or ''))
