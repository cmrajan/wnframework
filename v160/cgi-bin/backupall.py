import os

# go to current directory
os.chdir(__file__[:-12])

import server

server.backup_all()

# send the daily backup to the pair server
import defs
if hasattr(defs,'ps_host'):
	import ftplib, time

	ftp = ftplib.FTP(defs.ps_host, defs.ps_login, defs.ps_pwd)
	ftp.cwd('pair_backups')
	fname = 'daily-' + time.strftime('%Y-%m-%d') + '.tar.gz'
	f = open('../backups/daily/' + fname, 'rb')
	ftp.storbinary('STOR ' + server.server_prefix + '-' + fname, f)
	ftp.quit()
	
	# delete from local pair directory
	if len(os.listdir(defs.pair_dir)) > 3:
		delete_oldest_file(defs.pair_dir)