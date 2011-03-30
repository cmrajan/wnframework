from random import seed
from time import time
import sys


sys.path.append('../v170/cgi-bin')
random_seed = int(time())

import webnotes.db


sizes = ['small','medium','large']

test_db  = 'erpnextdb'
test_conn = webnotes.db.Database(user = 'root',password = 'route')
#Change these settings before running the test suite.
test_conn.use(test_db)
use_size = 'small'

test_doctype = 'TestDoTyp'
test_doctype_autoname = 'AC.#####'
test_docperm = 'TestRole'
test_webnotes_session = {'user':'Administrator'}



## Selenium variables
base_url = "http://127.0.0.1"
