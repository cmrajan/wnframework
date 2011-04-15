wn.widgets.form.sidebar.Attachments = function(parent, sidebar, doctype, docname) {
	var me = this;
	this.frm = sidebar.form;
	
	this.make = function() {
		if(this.wrapper) this.wrapper.innerHTML = '';
		else this.wrapper = $a(parent, 'div', 'sidebar-comment-wrapper');
		
		// attachment
		this.attach_wrapper = $a(this.wrapper, 'div');
		
		// no of attachments
		var n = this.frm.doc.file_list ? this.frm.doc.file_list.split('\n').length : 0;
		
		// button if the number of attachments is less than max
		if(n < this.frm.meta.max_attachments || !this.frm.meta.max_attachments) {
			this.btn = $btn($a(this.wrapper, 'div', 'sidebar-comment-message'), 'Add', 
				function() { me.add_attachment() });			
		}
		
		// render
		this.render();

	}

	// create Attachment objects from
	// the file_list
	this.render = function() {
		// clear exisitng
		this.attach_wrapper.innerHTML = ''

		var doc = locals[me.frm.doctype][me.frm.docname];
		var fl = doc.file_list ? doc.file_list.split('\n') : [];
		
		// add attachment objects
		for(var i=0; i<fl.length; i++) {
			new wn.widgets.form.sidebar.Attachment(this.attach_wrapper, fl[i], me.frm)
		}
	}

	// call the Uploader object to save an attachment
	// using the file mamanger
	this.add_attachment = function() {
		if(!this.dialog) {
			this.dialog = new wn.widgets.Dialog({
				title:'Add Attachment',
				width: 400
			})
			$y(this.dialog.body, {margin:'13px'})
			this.dialog.make();
		}
		this.dialog.show();
		
		this.uploader = new Uploader(this.dialog.body, {
			from_form: 1,
			doctype: doctype,
			docname: docname,
			at_id: this.at_id
		}, wn.widgets.form.file_upload_done);		
	}
	
	this.make();
}

wn.widgets.form.sidebar.Attachment = function(parent, filedet, frm) {
	filedet = filedet.split(',')
	this.filename = filedet[0];
	this.fileid = filedet[1];
	this.frm = frm;
	var me = this;
	
	this.wrapper = $a(parent, 'div', 'sidebar-comment-message');

	// remove from the file_list property of the doc
	this.remove_fileid = function() {
		var doc = locals[me.frm.doctype][me.frm.docname];
		var fl = doc.file_list.split('\n'); new_fl = [];
		for(var i=0; i<fl.length; i++) {
			if(fl[i].split(',')[1]!=me.fileid) new_fl.push(fl[i]);
		}
		doc.file_list = new_fl.join('\n');
	}
		
	// download
	this.ln = $a(this.wrapper, 'a', 'link_type', {fontSize:'11px'}, this.filename);
	this.ln.href = outUrl + '?cmd=get_file&fname='+this.fileid;
	this.ln.target = '_blank';
	
	// remove
	this.del = $a(this.wrapper, 'span', 'link_type', {marginLeft:'3px'}, '[x]');
	this.del.onclick = function() {
		var yn = confirm("The document will be saved after the attachment is deleted for the changes to be permanent. Proceed?")
		if(yn) {
			var callback = function(r, rt) {
				$dh(me.wrapper);
				me.remove_fileid();
				var ret=me.frm.save('Save');
				if(ret=='Error')
					msgprint("error:The document was not saved. To make the removal permanent, you must save the document before closing.");
			}
				
			$c('webnotes.widgets.form.remove_attach', args = {'fid': me.fileid }, callback );
	
		}		
	}
}

// this function will be called after the upload is done
// from webnotes.utils.file_manager
wn.widgets.form.file_upload_done = function(doctype, docname, fileid, filename, at_id) {
	
	var at_id = cint(at_id);
	
	// add to file_list
	var doc = locals[doctype][docname];
	if(doc.file_list) {
		var fl = doc.file_list.split('\n')
		fl.push(filename + ',' + fileid)
		doc.file_list = fl.join('\n');
	}
	else
		doc.file_list = filename + ',' + fileid;
	
	// update file_list
	var frm = frms[doctype];
	frm.attachments.dialog.hide();
	frm.attachments.render();

	var do_save = confirm('File Uploaded Sucessfully. You must save this document for the uploaded file to be registred. Save this document now?');
	if(do_save) {
		var ret = frm.save('Save');
		if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");
	} else {
		msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");
	}
}
