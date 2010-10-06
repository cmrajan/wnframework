"""
Helper functions for unit-tests.
"""


# Imports
from webnotes import model,db 
from random import seed
from time import time
from sys import argv

# Configuration
random_seed = int(time())
num_users = { 'small': 10,
              'medium': 25,
              'big': 50,
              'sparse': 50
             } 
num_edges = { 'small': 18,
              'medium': 120,
              'big': 490,
              'sparse': 200
             }
sizes = ['small', 'medium', 'big', 'sparse']
use_size = 'medium'

# Init
try:
    if (argv[0] != 'testrunner.py'):
        print
        print ("Random seed: %s" % random_seed)
except:
    pass

### All dummy new record creation test cases for the framework and framework elements. Applications will have to go to a diff file.
def new_Document(wt_range=(1, 1)):
    seed(random_seed)
    return generate(num_nodes[use_size], num_edges[use_size], directed=False, weight_range=wt_range)

def new_DocType(wt_range=(1, 1)):
    seed(random_seed)
    return generate(num_nodes[use_size], num_edges[use_size], directed=True, weight_range=wt_range)

def new_DocPerm():
    seed(random_seed)
    return generate_hypergraph(num_nodes[use_size], num_edges[use_size])

def new_DocField(_r):
     seed(random_seed)
    return generate_hypergraph(num_nodes[use_size], num_edges[use_size], r = _r)

def new_DocFormat():
    pass

def new_Event():
    pass


def new_Event_Role():
    pass


def new_Application():
    pass


def new_Application_Type():
    pass
