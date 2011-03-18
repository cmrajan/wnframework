"""
Courtesy: python-graph project.
http://code.google.com/p/python-graph/
"""

import sys
sys.path.append('..')
import unittest
import testlib
import logging
import os
log = logging.getLogger(__name__)

sys.path.append('../cgi-bin')


def test_modules():
	modlist = []
    	for each in os.listdir('.'):
		if (each[0:9] == "unittests" and each[-3:] == ".py"):
			modlist.append(each[0:-3])
    	for each in os.listdir('./selenium_cases'):
		if (each[0:9] == "unittests" and each[-3:] == ".py"):
			modlist.append(each[0:-3])
	return modlist

def run_tests():
	#for each_size in testlib.sizes:
	#	print ("Testing with %s graphs" % each_size)
        
	#	suite = unittest.TestSuite()
	#	testlib.use_size = each_size
#	print ("Testing with %s "%testlib.use_size)
        
	suite = unittest.TestSuite()

	for each_module in test_modules():
		try:
			suite.addTests(unittest.TestLoader().loadTestsFromName(each_module))
		except ImportError as ie:
			log.exception(ie)
		continue
        
	tr = unittest.TextTestRunner(verbosity=2)
	result = tr.run(suite)
	del suite

def main():
	try:
		rseed = sys.argv[1]
		testlib.random_seed = int(rseed)
	except:
		pass
	print ("")
	print ("--------------------------------------------------")
	print ("webnotes unit-tests")
	print ("Random seed: %s" % testlib.random_seed)
	print ("--------------------------------------------------")
	print ("")
	run_tests()
   
if __name__ == "__main__":
	main()
