import webnotes
from webnotes.utils import module_manager
import os
import webnotes.db

webnotes.conn = webnotes.db.Database(use_default = 1)

webnotes.set_as_admin()

webnotes.conn.use('s3u002')

mod = os.listdir((webnotes.defs.modules_path))
module_manager.import_from_files(['System'])

module_manager.import_from_files(mod)

