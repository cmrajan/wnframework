def generate_hash():
	import sha, time
	return sha.new(str(time.time())).hexdigest()
	
def now():
	import time
	return time.strftime('%Y-%m-%d %H:%M:%S')
	
def nowdate():
	import time
	return time.strftime('%Y-%m-%d')

def has_common(l1, l2):
	for l in l1:
		if l in l2: 
			return 1
	return 0
	
def flt(s):
	if type(s)==str: # if string
		s = s.replace(',','')
	try: tmp = float(s)
	except: tmp = 0
	return tmp

def cint(s):
	try: tmp = int(float(s))
	except: tmp = 0
	return tmp

def cstr(s):
	if s==None: return ''
	else: return str(s)