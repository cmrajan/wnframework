#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os

try:
    from setuptools import setup, find_packages
except ImportError as ie:
    import ez_setup
    ez_setup.use_setuptools()
    from setuptools import setup, find_packages

# Startup
appname = "webnotes-core"
appversion = "v170"

setup(
        name = appname,
        version = appversion,
        author = "Rushabh Mehta",
        namespace_packages = ["webnotes"],
        packages = ["webnotes"] + [ os.path.join("webnotes", a) for a in find_packages("webnotes") ],
        author_email = "rmehta@gmail.com",
        description = "A framework for Metadata based applications",
        license = "MIT",
        keywords = "meta-data application framework",
        url = "http://code.google.com/p/wnframework/",
        classifiers = ["License :: OSI Approved :: MIT License","Topic :: Software Development :: Libraries :: Python Modules"],
        long_description = "Webnotes framework is an meta-data based web application framework in python, that helps you build database driven apps",
)
