#!/usr/bin/python
""" A bidirectional tool to synchronize remote and local directory trees using FTP.

For usage information, run ``ftpsync.py --help``.

Homepage: http://ftpsync2d.googlecode.com
"""
# Author: Pearu Peterson
# Created: April 2008
# License: BSD
# Updated by: Rushabh Mehta (Nov 2008)

__version__ = '1.0'

import sys
import time
import os
from urlparse import urlparse
from getpass import getpass
from ftplib import FTP, error_perm
import cPickle as pickle
from cStringIO import StringIO
from optparse import OptionParser
import ftp_list

local_system = '/Users/rushabh/workbench/www/v160/'


skip_dirs = []
remote_system = ftp_list.connections

stdout_str = sys.stdout

def ignore_filename(filename):
    root, ext = os.path.splitext(filename)
    if ext in ['.pyc', '.pyo', '.backup', '.aux', '.tmp'] \
           or ext.endswith('~') or ext.endswith('#'):
        return True
        
    # do not upgrade user files
    root, fn = os.path.split(filename)
    if fn in ['user.js', 'user.py', 'user.css', 'defs.py', 'login_user.js', 'setup.py', 'ftp_list.py']:
        return True
    if fn.startswith('.') and (not fn in ['.htaccess', '.listing']):
        return True
    
    return False

def fix_dirs(dirs):
    if 'CVS' in dirs: dirs.remove('CVS')
    if '.svn' in dirs: dirs.remove('.svn')
    if '.bzr' in dirs: dirs.remove('.bzr')

class FtpSession(object):

    def __init__(self, server_url, skip_dirs1 = []):
        if not server_url.startswith('ftp://'):
            server_url = 'ftp://' + server_url
        o = urlparse(server_url)
        assert o.scheme=='ftp',`o`
        self.server = o.hostname
        self._username = o.username
        self._password = o.password
        remote_path = os.path.normpath(o[2] or '/')
        if remote_path.startswith('//'):
            remote_path = remote_path[1:]
        assert remote_path.startswith('/'),`remote_path`
        self.remote_path = remote_path
        self._ftp = None
        self.clock_offset = 0
        self.skip_dirs = skip_dirs or skip_dirs1
        
    @property
    def server_url(self):
        return 'ftp://%s@%s' % (self.username, self.server, self.remote_path)
    
    @property
    def username(self):
        n = self._username
        if n is None:
            while 1:
                n = raw_input('Enter username for ftp://%s: ' % (self.server))
                if n:
                    break
            self._username = n
        return n

    @property
    def password(self):
        n = self._password
        if n is None:
            n = getpass('Enter password for ftp://%s@%s: ' % (self.username, self.server))
            self._password = n
        return n

    @property
    def ftp(self):
        c = self._ftp
        if c is None:
            stdout_str.write('<connecting to %s..' % (self.server))
            self._ftp = c = FTP(self.server, self.username, self.password)
            self.clock_offset = self.clocksync()
            stdout_str.write('clock offset: %s> ' % (self.clock_offset))

        return c

    def abspath(self, *paths):
        filename = os.path.join(*(paths or ('',)))
        if not os.path.isabs(filename):
            filename = os.path.join(self.remote_path, filename)        
        return filename

    def get_nlst(self, path):
        try:
            res = self.ftp.nlst(path)
        except Exception, msg:
            s = str(msg)
            if s.startswith('226'):
                return []
            #raise
            
        if res and res[0].find('/')!=-1: #path is embedded in the name
            res = [l.split('/')[-1] for l in res] # only get the base name
        return res

    def get_mtime(self, name):
        """ Return modification time of the file in ftp server.

        If the file does not exist, return None.
        If the name refers to a directory, return 0.
        
        To get the local modification time, use
        ``get_mtime()-clock_offset``.
        """
        filename = self.abspath(name)
        try:
            resp = self.ftp.sendcmd('MDTM ' + filename)
        except error_perm, msg:
            s = str(msg)
            if s.startswith('550 I can only retrieve regular files'):
                # filename is directory
                return 0
            if s.startswith('550 Can\'t check for file existence'):
                # file with filename does not exist
                return None
            if s.startswith('550') and s.find("not a plain file")!=-1:
                # maybe also a directory
                return 0           
            if s.startswith('550') and s.find('No such file or directory')!=-1:
                # file does not exist
                return None
            raise
        assert resp[:3]=='213', `resp, filename`
        modtime = int(time.mktime(time.strptime(resp[3:].strip(), '%Y%m%d%H%M%S')))
        return modtime

    def clocksync(self):
        fn = '.ftpsync.clocksync'
        rfn = self.abspath(fn)
        if not os.path.isfile(fn):
            f = open(fn,'w')
            f.write('temporary file created by ftpsync.py')
            f.close()
        self.makedirs(os.path.dirname(rfn))
        f = open(fn, 'rb')
        self.ftp.storbinary('STOR ' + rfn, f, 1024)
        f.close()
        local_time1 = time.time()
        remote_time = self.get_mtime(rfn)
        local_time2 = time.time()
        self.ftp.delete(rfn)
        os.remove(fn)
        if local_time2 < remote_time: # remote is in future
            sync_off = int(remote_time - local_time2)
        elif local_time1 > remote_time: # remote is in past or equal
            sync_off = int(remote_time - local_time1)
        else:
            sync_off = 0
        return sync_off

    def get_listing_map(self, path):
        filename = self.abspath(path, '.listing')
        l = []
        self.ftp.retrbinary('RETR ' + filename, l.append, 8*1024)
        l = ''.join(l)
        func = lambda fn, mtime: (fn, int(mtime))
        return dict([func(*line.split(':')) for line in l.splitlines()])

    def upload_listing_map(self, path, d):
        filename = self.abspath(path, '.listing')
        fp = StringIO('\n'.join(['%s:%s' % item for item in d.iteritems()]))
        try:
            self.ftp.storbinary('STOR ' + filename, fp, 8*1024)
        except error_perm:
            return 0
        return 1
    
    def get_remote_files(self, directory='', verbose=True, listing=True,
                         update_listing=False):
        """ Return a {files:modification times} map of the ftp directory.

        If listing is True then .listing files are used to accelerate
        getting the map information. When .listing file does not exist,
        it will be created.

        When uploading a file or a directory then the uploader is
        responsible for removing .listing file from the parent
        directory of the uploaded file or directory. The .listing file
        should also be removed when removing a file, this is not
        necessary when removing a directory, though.  The above will
        ensure that .listing will be kept up-to-date.

        Note that for directories the modification times is set to 0,
        and for .listing files it is -1, in the returned map. The
        modification time is using the clock in ftp server.

        The paths to files correspond to absolute paths in the ftp
        server.
        """
        r = {}
        dirs = []
        wd = self.abspath(directory)
        if wd in self.skip_dirs:
            return r
        r[wd] = 0 # directories have 0 mtime.
        if verbose:
            stdout_str.write('listing directory %r \n' % (wd))
            stdout_str.flush()

        lst = filter(lambda n: n not in ['.', '..'], self.get_nlst(wd))
        #stdout_str.write(str(lst))
        if verbose:
            stdout_str.write('[%s items]: \n' % (len(lst)))
            stdout_str.flush()

        if listing:
            lstfn = os.path.join(wd, '.listing')
            r[lstfn] = -1 # the mtime of .listing file is not used
            if '.listing' in lst and not update_listing:
                d = self.get_listing_map(wd)
                dirnames = set([os.path.dirname(fn) for fn, mtime in d.items() if mtime>0]\
                               + [dn for dn, mtime in d.items() if mtime==0])
                if verbose:
                    stdout_str.write('<checking integrity [%s directories]> \n' % (len(dirnames)))
                    stdout_str.flush()
                for dn in dirnames:
                    if verbose:
                        stdout_str.write('+')
                        stdout_str.flush()
                    fn = os.path.join(dn, '.listing')
                    if self.get_mtime(fn) is None:
                        stdout_str.write(' <missing %r, forcing regeneration of %r>\n' % (fn, lstfn))
                        stdout_str.flush()
                        d = None
                        break
                if d is not None:
                    if verbose:
                        stdout_str.write(' <using %r>\n' % (lstfn))
                        stdout_str.flush()
                    return d
                
        for n in lst:
            path = os.path.join(wd, n)
            try:
                mtime = self.get_mtime(path)
            except Exception, e:
                if str(e) == '550 Could not get file modification time.':
                    mtime = 0
                else:
                    print(str(e))
                    raise Exception, e
            if mtime==0:
                dirs.append(path)
                if verbose:
                    stdout_str.write('d')
                    stdout_str.flush()
            else:
                r[path] = mtime
                if verbose:
                    stdout_str.write('.')
                    stdout_str.flush()
        if verbose:
            stdout_str.write('\n')
        for path in dirs:
            r.update(**self.get_remote_files(path, verbose=verbose, listing=listing,
                                             update_listing=update_listing))

        if listing:
            if self.upload_listing_map(wd, r):
                if verbose:
                    stdout_str.write('<uploaded %r>\n' % (lstfn))
                    stdout_str.flush()
            else:
                sys.stderr.write('<failed to upload %r>\n' % (lstfn))
                sys.stderr.flush()
        return r

    def fix_local_mtime(self, filename, local, verbose=True):
        fullname = self.abspath(filename)
        rmtime = self.get_mtime(fullname)
        lmtime = int(os.path.getmtime(local))
        mtime = rmtime - self.clock_offset
        if verbose:
            stdout_str.write('<adjusting local mtime: %s secs>\n' % (lmtime - mtime))
        os.utime(local, (mtime, mtime))
        #print local, mtime, rmtime, lmtime, int(os.path.getmtime(local))

    def get_files(self, update_listing=False):
        """ Return a {files:modification times} map of the ftp
        directory where files are relative to remote_path and
        modification times are relative to local clock.
        """
        if self.remote_path=='/':
            n = 0
        else:
            assert not self.remote_path.endswith('/'), `self.remote_path`
            n = len(self.remote_path)
        files = {}
        for rfn, mtime in self.get_remote_files(update_listing=update_listing).items():
            if mtime==0:
                #skip directories
                continue
            if os.path.basename(rfn)=='.listing':
                continue
            assert rfn[n:n+1] in ['/',''],``rfn,n``
            fn = rfn[n+1:]
            files[fn] = mtime - self.clock_offset
            #print rfn, mtime, files[fn]
        return files

    def download(self, filename, target, verbose=True):
        if verbose:
            stdout_str.write('downloading %r..' % (filename))
            stdout_str.flush()
        fullname = self.abspath(filename)
        targetdir = os.path.dirname(target)
        if not os.path.exists(targetdir):
            os.makedirs(targetdir)
        f = open(target, 'wb')
        try:
            self.ftp.retrbinary('RETR '+fullname, f.write, 8*1024)
        except error_perm, msg:
            if verbose:
                stdout_str.write('FAILED: %s\n' % (msg))
            else:
                sys.stderr.write('FAILED to download %r: %s\n' % (filename, msg))
            f.close()
            os.remove(target)
            return 0
        f.close()
        self.fix_local_mtime(filename, target)
        if verbose:
            stdout_str.write(' ok [%s bytes]\n' % (os.path.getsize(target)))
        return 1

    def makedirs(self, path, rm_local_listing = False, verbose=True):
        fullpath = self.abspath(path)
        parent = os.path.dirname(fullpath)
        name = os.path.basename(fullpath)
        if parent!='/':
            self.makedirs(parent, verbose=verbose)
        lst = self.get_nlst(parent)
        if name and name not in lst:
            if verbose:
                stdout_str.write('<creating directory %r>\n' % (fullpath))
                stdout_str.flush()
            self.ftp.mkd(fullpath)
            if '.listing' in lst:
                listing = os.path.join(parent, '.listing')
                if verbose:
                    stdout_str.write('<removing %r>\n' % (listing))
                    stdout_str.flush()
                self.ftp.delete(listing)
        if rm_local_listing:
            lst = self.get_nlst(fullpath)
            if '.listing' in lst:
                listing = os.path.join(fullpath, '.listing')
                if verbose:
                    stdout_str.write('<removing %r>\n' % (listing))
                    stdout_str.flush()
                self.ftp.delete(listing)

    def upload(self, filename, source, mk_backup=True, verbose=True):
        fullname = self.abspath(filename)
        if verbose:
            stdout_str.write('uploading %r [%s]..\n' % (filename, os.path.getsize(source)))
            stdout_str.flush()
        self.makedirs(os.path.dirname(fullname), rm_local_listing=True, verbose=verbose)
        if mk_backup:
            if verbose:
                stdout_str.write('<creating %r>\n' % (filename+'.backup'))
                stdout_str.flush()
            self.ftp.rename(fullname, fullname + '.backup')
        f = open(source, 'rb')
        if verbose:
            stdout_str.write('<storing>\n')
            stdout_str.flush()
        try:
            self.ftp.storbinary('STOR '+fullname, f, 8*1024)
        except error_perm, msg:
            if verbose:
                stdout_str.write('FAILED: %s\n' % (msg))
                stdout_str.flush()
            else:
                sys.stderr.write('FAILED to upload %r: %s\n' % (filename, msg))
            f.close()
            if mk_backup:
                if verbose:
                    stdout_str.write('<restoring from %r>\n' % (filename+'.backup'))
                self.ftp.rename(fullname + '.backup', fullname)
            return 0
        f.close()
        if mk_backup:
            if verbose:
                stdout_str.write('<cleaning up %r>\n' % (filename+'.backup'))
            self.ftp.delete(fullname + '.backup')
        #self.fix_local_mtime(filename, source) why ??
        
        if filename.split('.')[-1]=='cgi':
            try:
                self.ftp.sendcmd('SITE CHMOD 711 %s' % fullname)
                stdout_str.write('Permissions set for %s\n' % filename)
                stdout_str.flush()
            except Exception, e:
                stdout_str.write('Permissions Error for %s:%s\n' % (filename, str(e)))
                stdout_str.flush()
        if verbose:
            stdout_str.write(' ok\n')
        return 1

def get_local_files(local_root, verbose=True):
    r = {}
    wd = os.path.abspath(os.path.normpath(local_root))
    n = len(wd)
    if n==1: n = 0
    for root, dirs, files in os.walk(wd):
        fix_dirs(dirs)
        for f in files:
            if ignore_filename(f):
                continue
            fn = os.path.join(root, f)
            mtime = int(os.path.getmtime(fn))
            assert fn[n:n+1] in ['/',''],`fn, n` 
            r[fn[n+1:]] = mtime
            #print fn, mtime
    return r

def compute_task(local_files, remote_files, mtime_tol=5):
    """ Return (download_list, upload_list, new_upload_list).

    The ``local_files`` and ``remote_files`` are dictionaries of
    ``{<filenames>: <modification times>}``.

    The ``require_download_list`` contains filenames that needs
    to be downloaded (i.e. they are newer than local versions).

    The ``require_upload_list`` contains filenames that needs to
    be uploaded (i.e. they are newer that remote versions).

    The ``mtime_tol`` determines maximal difference of modification times
    for considering the local and remote files to have equal
    modification times. Default is 5 seconds.
    """
    download_list, upload_list, new_upload_list = [], [], []
    for filename, rmtime in remote_files.items():
        if filename in local_files:
            lmtime = local_files[filename]
            #print filename, rmtime, lmtime, rmtime-lmtime
            if abs(rmtime - lmtime) < mtime_tol:
                continue
            if rmtime < lmtime:
                upload_list.append(filename)
            else:
                download_list.append(filename)
        else:
            download_list.append(filename)
    for filename, lmtime in local_files.items():
        if filename in remote_files:
            continue
        new_upload_list.append(filename)
    return sorted(download_list), sorted(upload_list), sorted(new_upload_list)

def upload_file(remote_path, filename):
    remote_path = remote_system[remote_path]
    session = FtpSession(remote_path)
    
    if hasattr(filename,'startswith'):
        source = os.path.join(local_system, filename)
        status = session.upload(filename, source, mk_backup=False)
    else:
        for i in filename:
            source = os.path.join(local_system, i)
            status = session.upload(i, source, mk_backup=False)
        
def do_sync(remote_path, local_path=local_system, update_listing=False, skip_path=[], upload_files=True, download_files=False):

    remote_path = remote_system[remote_path]

    start_time = time.time()
    local_files = get_local_files(local_path)
    
    session = FtpSession(remote_path)
    session.skip_dirs.extend(skip_path)
    remote_files = session.get_files(update_listing)
    
    download_list, upload_list, new_upload_list = compute_task(local_files, remote_files)

    downloaded_files = 0
    if download_files:
        for filename in download_list:
            target = os.path.join(local_path, filename)
            status = session.download(filename, target)
            if status:
                downloaded_files += 1
    else:
        n = len(download_list)
        if n:
            stdout_str.write("Skipping downloading: %s" % str(n))
            stdout_str.flush()

    uploaded_files = 0
    if upload_files:
        for filename in upload_list:
            source = os.path.join(local_path, filename)
            status = session.upload(filename, source, mk_backup=True)
            if status:
                uploaded_files += 1

        for filename in new_upload_list:
            source = os.path.join(local_path, filename)
            status = session.upload(filename, source, mk_backup=False)
            if status:
                uploaded_files += 1
    else:
        n = len(upload_list) + len(new_upload_list)
        if n:
            stdout_str.write("Skipping uploading: "+str(n))
            stdout_str.flush()
            #print upload_list, new_upload_list

    if downloaded_files:
        stdout_str.write('# downloaded files:'+str(downloaded_files))

    if uploaded_files:
        stdout_str.write('# uploaded files:'+str(uploaded_files))

    stdout_str.write('done [%s seconds]' % (int(time.time()-start_time)))
    stdout_str.flush()


def main():
    usage = "usage: %prog [options] <remote path> <local path>"
    parser = OptionParser(usage=usage,
                          version="%prog "+__version__,
                          description='''\

%prog is tool to synchronize remote and local directory trees using
FTP protocol (see http://ftpsync2d.googlecode.com/ for updates). Both
directions are supported. Write access to FTP server is required.

To skip processing remote directories that one does not have read or
write access, use --skip option. When a new file was added to FTP
server by other means than using %prog, use --listing to update
.listing files.

Remote path must be given in the following form:
[ftp://][username[:password]@]hostname[<remote directory>]
'''
                          )
    parser.add_option("-u", "--upload", dest="upload_files",
                      action="store_true", default=False,
                      help="enable uploading files")
    parser.add_option("-d", "--download", dest="download_files",
                      action="store_true", default=False,
                      help="enable downloading files")
    parser.add_option("-s", "--skip", dest="skip_path",
                      default = [], action="append",
                      help="skip listing specified remote (absolute) path")
    parser.add_option("-l", "--listing", dest="update_listing",
                      action="store_true", default=False,
                      help="update remote .listing files")
    
    (options, args) = parser.parse_args()
    if len(args)!=2:
        parser.error("incorrect number of arguments")

    remote_path, local_path = args

    do_sync(remote_path, local_path, options.update_listing, options.skip_path, options.upload_files, options.download_files)

if __name__ == "__main__":
    main()
