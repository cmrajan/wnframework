#!/usr/bin/python
# Copyright 2010 BeeSeek Developers.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE.node).

import os.path
from distutils.core import setup
from distutils.command.install_lib import install_lib

class install_and_configure_lib(install_lib):

    def install(self):
        outfiles = install_lib.install(self)
        settings = os.path.join(self.install_dir, 'bsnode', 'settings.py')
        if settings not in outfiles:
            raise ValueError

        settings = open(settings, 'r+')
        settings.seek(0, os.SEEK_END)
        settings.write(
            '\n\n'
            '# This code has been added by the setup script.\n'
            'DEBUG = False\n'
            'TEMPLATE_DEBUG = False\n'
            'from os.path import join\n')

        if os.name != 'nt':
            database_dir = '"/var/beeseek-node"'
        else:
            database_dir = 'os.path.dirname(__file__)'
        settings.write(
            'DATABASE_NAME = join({0}, DATABASE_NAME)\n'.format(database_dir))

        return outfiles


setup(
    name='webnotes',
    version=format_version(program_version),
    author='Webnotes Developers',
    author_email='@gmail.com',
    url='http://',
    description='Install the webnotes framework',
    long_description=
        'Installs the webnotes framework as a python module.you still have to write the code for database initialization and other setup stuff',
        
    download_url='http://wnframework.googlecode.com/svn/trunk/',
'''    classifiers=[
        'Development Status :: 1 - Planning',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: GNU Affero General Public License v3',
        'Operating System :: OS Independent',
        'Topic :: Internet :: WWW/HTTP :: Indexing/Search'],'''
    packages=[
        path for path, _, files in os.walk('bsnode')
        if '__init__.py' in files],
    scripts=['beeseek-node'],
    cmdclass={'install_lib': install_and_configure_lib})
