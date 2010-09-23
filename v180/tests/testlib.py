sizes = ['small','medium','big','sparse']
use_size = 'medium'
from random import seed
from time import time
from sys import argv

# Configuration
random_seed = int(time())
num_nodes = { 'small': 10,
              'medium': 25,
              'big': 50,
              'sparse': 50
             }
num_edges = { 'small': 18,
              'medium': 120,
              'big': 490,
              'sparse': 200
             }

