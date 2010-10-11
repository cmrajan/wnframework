make install:
	cd cgi-bin && python setup.py install


docs: cleanpyc
	rm -rf ${DOCS_DIR}


test: 
	cd ${TESTS_DIR} && python testrunner.py

tests: test



# Cleaning......

cleanpyc:
	find . -name *.pyc -exec rm {} \;


clean: cleanpyc
	rm -rf ${DOCS_DIR}
	rm -rf */dist
	rm -rf */build
	rm -rf */*.egg-info
	rm -rf dist


#Phony rule....
.PHONY: clean cleanpyc docs
