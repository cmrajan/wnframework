from performance import TimePerformance
import sys

def main(argv):
    TP = TimePerformance()
    python_command = argv[0]
    tracefile = argv[1]
    TP.acquire_command(python_command)
    TP.get_performance_data(tracefile)

if __name__ == '__main__':
    main(sys.argv)
