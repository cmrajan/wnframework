
import sys
sys.path.append('..')
import webnotes
import unittest
import testlib
import logging
from os import listdir

log = logging.getLogger(__name__)

def test_modules():
    modlist = []
    for each in listdir('.'):
        if (each[0:9] == "unittests" and each[-3:] == ".py"):
            modlist.append(each[0:-3])
    return modlist

def run_tests():
    for each_size in testlib.sizes:
        print ("Testing with %s graphs" % each_size)
        
        suite = unittest.TestSuite()
        testlib.use_size = each_size
        
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
    print ("python-graph unit-tests")
    print ("Random seed: %s" % testlib.random_seed)
    print ("--------------------------------------------------")
    print ("")
    run_tests()
   
if __name__ == "__main__":
    main()
    
