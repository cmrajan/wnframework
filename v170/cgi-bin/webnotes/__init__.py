# webnotes init (all shared variables come here)

version = 'v170'

conn = None
form = None
session = None
user = None
is_testing = None
add_cookies = {}

# json response object
response = {'message':'', 'exc':''}

debug_log, message_log = [], []

def errprint(msg):
	debug_log.append(str(msg or ''))

def msgprint(msg):
	message_log.append(str(msg or ''))