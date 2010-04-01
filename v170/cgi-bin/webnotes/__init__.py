# webnotes init (all shared variables come here)

version = 'v170'

auth_obj = None
conn = None
app_conn = None
form = None
session = None
user = None
is_testing = None
incoming_cookies = {}
add_cookies = {}

# json response object
response = {'message':'', 'exc':''}

debug_log, message_log = [], []

def errprint(msg):
	debug_log.append(str(msg or ''))

def msgprint(msg):
	message_log.append(str(msg or ''))