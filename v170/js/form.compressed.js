
_f.FrmContainer=function(){this.wrapper=page_body.add_page("Forms",function(){},function(){});$dh(this.wrapper);$y(this.wrapper,{margin:'4px'});this.make_head();this.make_toolbar();}
_f.FrmContainer.prototype.make_head=function(){var me=this;this.bg_color='#FFF';this.head=$a(this.wrapper,'div','',{margin:'0px 0px 4px 0px'});this.body=$a(this.wrapper,'div');this.page_head=new PageHeader(this.head);}
_f.FrmContainer.prototype.show_head=function(){$ds(this.head);}
_f.FrmContainer.prototype.hide_head=function(){$dh(this.head);}
_f.FrmContainer.prototype.make_toolbar=function(){}
_f.FrmContainer.prototype.refresh_btns=function(){var me=this;var frm=cur_frm;var p=frm.get_doc_perms();this.page_head.clear_toolbar();if(cur_frm.meta.read_only_onload){if(!cur_frm.editable)
this.page_head.add_button('Edit',function(){cur_frm.edit_doc()},0,'ui-icon-document');else
this.page_head.add_button('Done Editing',function(){cur_frm.is_editable[cur_frm.docname]=0;cur_frm.refresh();},0,'ui-icon-document');}
if(cur_frm.editable&&cint(frm.doc.docstatus)==0&&p[WRITE])
this.page_head.add_button('Save',function(){cur_frm.save('Save');},1,'ui-icon-disk');if(cur_frm.editable&&cint(frm.doc.docstatus)==0&&p[SUBMIT]&&(!frm.doc.__islocal))
this.page_head.add_button('Submit',function(){cur_frm.savesubmit();},0,'ui-icon-locked');if(cur_frm.editable&&cint(frm.doc.docstatus)==1&&p[CANCEL])
this.page_head.add_button('Cancel',function(){cur_frm.savecancel()},0,'ui-icon-closethick');if(cint(frm.doc.docstatus)==2&&p[AMEND])
this.page_head.add_button('Amend',function(){cur_frm.amend_doc()},0,'ui-icon-scissors');this.page_head.add_button('New',function(){new_doc()},0,'ui-icon-document');this.page_head.add_button('Refresh',function(){cur_frm.reload_doc();},0,'ui-icon-refresh');if(!frm.meta.allow_print)
this.page_head.add_button('Print',function(){cur_frm.print_doc();},0,'ui-icon-print');if(!frm.meta.allow_email)
this.page_head.add_button('Email',function(){cur_frm.email_doc();},0,'ui-icon-mail-closed');if(!frm.meta.allow_copy)
this.page_head.add_button('Copy',function(){cur_frm.copy_doc();},0,'ui-icon-copy');}
_f.FrmContainer.prototype.show_toolbar=function(){this.refresh_btns();}
_f.FrmContainer.prototype.hide_toolbar=function(){}
_f.FrmContainer.prototype.refresh_toolbar=function(){var m=cur_frm.meta;if(m.hide_heading){this.hide_head();}else{this.show_head();if(m.hide_toolbar){this.hide_toolbar();}else{this.show_toolbar();}}}
_f.add_frm=function(doctype,onload,opt_name,parent){if(parent)parent=_f.frm_con.body;if(frms['DocType']&&frms['DocType'].opendocs[doctype]){msgprint("error:Cannot create an instance of \""+doctype+"\" when the DocType is open.");return;}
if(frms[doctype]){return frms[doctype];}
var callback=function(r,rt){if(!locals['DocType'][doctype]){return;}
new _f.Frm(doctype,parent);if(onload)onload(r,rt);}
if(opt_name&&(!LocalDB.is_doc_loaded(doctype,opt_name))){$c('webnotes.widgets.form.getdoc',{'name':opt_name,'doctype':doctype,'getdoctype':1,'user':user},callback);}else{$c('webnotes.widgets.form.getdoctype',args={'doctype':doctype},callback);}}
_f.frm_dialog=null;_f.dialog_stack=[];_f.calling_doc_stack=[];_f.FrmDialog=function(){var me=this;var d=new Dialog(640,400,'Edit Row');d.body_wrapper=$a(d.body,'div','dialog_frm');d.done_btn=$a($a(d.body,'div','',{margin:'8px'}),'button');d.done_btn.innerHTML='Done';d.done_btn.onclick=function(){if(!me.from_grid){var callback=function(r,rt){if(me.on_save_callback)
me.on_save_callback(me.cur_frm.docname);me.dialog.hide();}
me.cur_frm.save('Save',callback);}else{me.dialog.hide();}}
d.onhide=function(){if(_f.cur_grid)
_f.cur_grid.refresh_row(_f.cur_grid_ridx,me.dn);if(me.cdt&&me.cur_frm.doctype==me.cdt){me.cur_frm.show(me.cdn,null,_f.dialog_stack.pop(),me.cnic);}}
this.dialog=d;}
_f.edit_record=function(dt,dn,from_grid,on_save_callback,cdt,cdn,cnic){var d=new _f.FrmDialog();var show_dialog=function(){var f=frms[dt];if(from_grid){f.parent_doctype=cur_frm.doctype;f.parent_docname=cur_frm.docname;}
f.meta.section_style='Simple';if(d.cur_frm){d.cur_frm.hide();}
if(dt==cdt){_f.dialog_stack.push(f.parent);}
f.show(dn,null,d.dialog.body_wrapper,1);d.cur_frm=f;d.dn=dn;d.from_grid=from_grid;d.on_save_callback=on_save_callback;d.cdt=cdt;d.cdn=cdn;d.cnic=cnic
if(from_grid)
d.dialog.set_title("Editing Row #"+(_f.cur_grid_ridx+1));else
d.dialog.set_title(dt+': '+dn);d.dialog.show();_f.frm_dialog=d;}
if(!frms[dt]){_f.add_frm(dt,show_dialog,null,d.dialog.body_wrapper);}else{show_dialog();}}
_f.Frm=function(doctype,parent){this.docname='';this.doctype=doctype;this.dispnot_in_containerlay=0;this.not_in_container=false;var me=this;this.is_editable={};this.opendocs={};this.cur_section={};this.sections=[];this.sections_by_label={};this.grids=[];this.cscript={};this.parent=parent;this.attachments={};this.tinymce_id_list=[];this.last_comments={};this.n_comments={};frms[doctype]=this;this.setup_meta(doctype);rename_observers.push(this);}
_f.Frm.prototype.rename_notify=function(dt,old,name){if(this.doctype!=dt)return;this.cur_section[name]=this.cur_section[old];delete this.cur_section[old];this.is_editable[name]=this.is_editable[old];delete this.is_editable[old];if(this.attachments[old]){this.attachments[name]=this.attachments[old];this.attachments[old]=null;for(var i in this.attachments[name]){this.attachments[name][i].docname=name;}}
if(this.docname==old)
this.docname=name;if(this&&this.opendocs[old]){local_dt[dt][name]=local_dt[dt][old];local_dt[dt][old]=null;}
this.opendocs[old]=false;this.opendocs[name]=true;}
_f.Frm.prototype.onhide=function(){if(_f.cur_grid_cell)_f.cur_grid_cell.grid.cell_deselect();}
_f.Frm.prototype.setup_print=function(){var fl=getchildren('DocFormat',this.meta.name,'formats','DocType');var l=[];this.default_format='Standard';if(fl.length){this.default_format=fl[0].format;for(var i=0;i<fl.length;i++)
l.push(fl[i].format);}
l.push('Standard');this.print_sel=new SelectWidget('160px',l);this.print_sel.inp.value=this.default_format;}
_f.Frm.prototype.print_doc=function(){if(this.doc.docstatus==2){msgprint("Cannot Print Cancelled Documents.");return;}
if(this.print_sel.options.length>1){_p.show_dialog();}else{_p.build('Standard',_p.go);}}
_f.Frm.prototype.email_doc=function(){if(!_e.dialog)_e.make();sel=this.print_sel;var c=$td(_e.dialog.rows['Format'].tab,0,1);if(c.cur_sel){c.removeChild(c.cur_sel.wrapper);c.cur_sel=null;}
c.appendChild(this.print_sel.wrapper);_e.dialog.widgets['Subject'].value=this.meta.name+': '+this.docname;_e.dialog.show();}
_f.Frm.prototype.set_heading=function(){_f.frm_con.page_head.main_head.innerHTML=this.doctype;_f.frm_con.page_head.sub_head.innerHTML='';if(!this.meta.issingle)
_f.frm_con.page_head.sub_head.innerHTML=this.docname;var doc=locals[this.doctype][this.docname];var tn=$i('rec_'+this.doctype+'-'+this.docname);var set_st=function(col){if(tn)$bg(tn,col);}
var make_span=function(label,col){var s=$a(null,'span','',{padding:'2px',backgroundColor:col,color:'#FFF',fontWeight:'bold',marginLeft:'8px',fontSize:'11px'});s.innerHTML=label;return s;}
var sp1=null;if(doc.__islocal){sp1=make_span('Unsaved Draft','#F81');set_st('#f81');}else if(doc.__unsaved){sp1=make_span('Not Saved','#F81');set_st('#f81');}else if(cint(doc.docstatus)==0){sp1=make_span('Saved','#0A1');set_st('#0A1');}else if(cint(doc.docstatus)==1){sp1=make_span('Submitted','#44F');set_st('#44F');}else if(cint(doc.docstatus)==2){sp1=make_span('Cancelled','#F44');set_st('#F44');}
var sp2=null;if(is_testing&&this.meta.setup_test){sp2=$a(null,'span','',{marginLeft:'4px',padding:'4px',color:'#FFF',backgroundColor:'#F88'})
sp2.innerHTML='Test Record';}
var scrub_date=function(d){if(d)t=d.split(' ');else return'';return dateutil.str_to_user(t[0])+' '+t[1];}
var created_str=repl("Created: %(c_by)s %(c_on)s %(m_by)s %(m_on)s</span>",{c_by:doc.owner,c_on:scrub_date(doc.creation?doc.creation:''),m_by:doc.modified_by?('/ Modified: '+doc.modified_by):'',m_on:doc.modified?('on '+scrub_date(doc.modified)):''});var sp3=$a(null,'span','',{marginLeft:'8px',fontSize:'11px'});sp3.innerHTML=created_str;var t=_f.frm_con.page_head.tag_area;t.innerHTML='';_f.frm_con.page_head.sub_head.appendChild(sp1);if(sp2)t.appendChild(sp2);t.appendChild(sp3);if(this.heading){if(this.meta.hide_heading||this.not_in_container)
$dh(_f.frm_con.head_div);else
$ds(_f.frm_con.head_div);}}
_f.Frm.prototype.set_section=function(sec_id){if(!this.sections[sec_id].show)return;if(this.sections[this.cur_section[this.docname]])
this.sections[this.cur_section[this.docname]].hide();this.sections[sec_id].show();this.cur_section[this.docname]=sec_id;}
_f.Frm.prototype.setup_tabs=function(){var me=this;$ds(this.tab_wrapper);$y(this.tab_wrapper,{marginTop:'8px'});this.tabs=new TabbedPage(this.tab_wrapper,1);}
_f.Frm.prototype.setup_tips=function(){var me=this;this.tip_box=$a(this.tip_wrapper,'div','frm_tip_box');var tab=$a(this.tip_box,'table');var r=tab.insertRow(0);var c0=r.insertCell(0);this.c1=r.insertCell(1);this.img=$a(c0,'img');this.img.setAttribute('src','images/icons/lightbulb.gif');c0.style.width='24px';this.set_tip=function(t,icon){me.c1.innerHTML=t;$ds(me.tip_box);if(icon)this.img.setAttribute('src','images/icons/'+icon);}
this.append_tip=function(t){if(me.c1.innerHTML)me.c1.innerHTML+='<br><br>';me.c1.innerHTML+=t;$ds(me.tip_box);}
this.clear_tip=function(){me.c1.innerHTML='';$dh(me.tip_box);}
$dh(this.tip_box);}
_f.Frm.prototype.setup_meta=function(){this.meta=get_local('DocType',this.doctype);this.perm=get_perm(this.doctype);this.setup_print();}
_f.Frm.prototype.setup_std_layout=function(){if(this.not_in_container)$w(this.form_wrapper,'500px');this.header=$a(this.form_wrapper,'div','frm_header');this.heading=$a(this.header,'div','frm_heading');this.tip_wrapper=$a(this.header,'div');this.tab_wrapper=$a(this.header,'div');$dh(this.tab_wrapper);if(this.meta.section_style=='Tray'){var t=$a(this.form_wrapper,'table','',{tableLayout:'fixed',width:'100%',borderCollapse:'collapse'});var r=t.insertRow(0);var c=r.insertCell(0);c.className='frm_tray_area';this.tray_area=c;this.body=$a(r.insertCell(1),'div','frm_body');}else{this.body=$a(this.form_wrapper,'div','frm_body');}
this.layout=new Layout(this.body,'100%');this.setup_tips();if(this.meta.section_style=='Tabbed')
this.setup_tabs();if(this.meta.colour)
this.layout.wrapper.style.backgroundColor='#'+this.meta.colour.split(':')[1];this.setup_fields_std();}
_f.Frm.prototype.setup_fields_std=function(){var fl=fields_list[this.doctype];if(fl[0]&&fl[0].fieldtype!="Section Break"){this.layout.addrow();if(fl[0].fieldtype!="Column Break"){var c=this.layout.addcell();$y(c.wrapper,{padding:'8px'});}}
var sec;for(var i=0;i<fl.length;i++){var f=fl[i];var fn=f.fieldname?f.fieldname:f.label;var fld=make_field(f,this.doctype,this.layout.cur_cell,this);this.fields[this.fields.length]=fld;this.fields_dict[fn]=fld;if(this.meta.section_style!='Simple')
fld.parent_section=sec;if(f.fieldtype=='Section Break'&&f.options!='Simple')
sec=fld;if((f.fieldtype=='Section Break')&&(fl[i+1])&&(fl[i+1].fieldtype!='Column Break')){var c=this.layout.addcell();$y(c.wrapper,{padding:'8px'});}}}
_f.Frm.prototype.setup_template_layout=function(){this.body=$a(this.form_wrapper,'div');this.layout=null;this.body.innerHTML=this.meta.dt_template;var dt=this.doctype.replace(/ /g,'');this.meta.hide_heading=1;var fl=fields_list[this.doctype];for(var i=0;i<fl.length;i++){var f=fl[i];var fn=f.fieldname?f.fieldname:f.label;var field_area=$i('frm_'+dt+'_'+fn);if(field_area){var fld=make_field(f,this.doctype,field_area,this,0,1);this.fields[this.fields.length]=fld;this.fields_dict[fn]=fld;}}}
_f.Frm.prototype.setup_client_script=function(){if(this.meta.client_script_core||this.meta.client_script||this.meta._client_script){this.runclientscript('setup',this.doctype,this.docname);}
this.script_setup=1;}
_f.Frm.prototype.set_parent=function(parent){if(parent){this.parent=parent;if(this.wrapper&&this.wrapper.parentNode!=parent)
parent.appendChild(this.wrapper);}}
_f.Frm.prototype.setup_print_layout=function(){if(this.meta.read_only_onload){this.print_wrapper=$a(this.wrapper,'div','',{backgroundColor:'#46A',padding:'32px'});this.print_body=$a(this.print_wrapper,'div','',{backgroundColor:'#FFF',border:'1px solid #444',padding:'32px'});}}
_f.Frm.prototype.refresh_print_layout=function(){$ds(this.print_wrapper);$dh(this.form_wrapper);var me=this;var print_callback=function(print_html){me.print_body.innerHTML=print_html;}
_p.build(this.default_format,print_callback);}
_f.Frm.prototype.setup=function(){var me=this;this.fields=[];this.fields_dict={};this.wrapper=$a(this.parent,'div','frm_wrapper');this.setup_print_layout();this.form_wrapper=$a(this.wrapper,'div');if(this.meta.use_template){this.setup_template_layout();}else{this.setup_std_layout();}
if(this.meta.allow_attach)
this.setup_attach();this.setup_done=true;}
_f.Frm.prototype.hide=function(){$dh(this.wrapper);this.display=0;hide_autosuggest();}
_f.Frm.prototype.show=function(docname,from_refresh,parent,not_in_container){this.not_in_container=not_in_container;if(!from_refresh&&!this.not_in_container&&cur_frm&&cur_frm!=this){this.defocus_rest();cur_frm.hide();}
if(docname)
this.docname=docname;if(!from_refresh&&parent){this.set_parent(parent);}
if(this.wrapper&&this.wrapper.style.display.toLowerCase()=='none'){$ds(this.wrapper);this.display=1;}
if(!this.not_in_container)
cur_frm=this;if(!from_refresh)
this.refresh();}
_f.Frm.prototype.defocus_rest=function(){mclose();if(_f.cur_grid_cell)_f.cur_grid_cell.grid.cell_deselect();cur_page=null;}
_f.Frm.prototype.get_doc_perms=function(){var p=[0,0,0,0,0,0];for(var i=0;i<this.perm.length;i++){if(this.perm[i]){if(this.perm[i][READ])p[READ]=1;if(this.perm[i][WRITE])p[WRITE]=1;if(this.perm[i][SUBMIT])p[SUBMIT]=1;if(this.perm[i][CANCEL])p[CANCEL]=1;if(this.perm[i][AMEND])p[AMEND]=1;}}
return p;}
_f.Frm.prototype.refresh_container=function(){set_title(this.meta.issingle?this.doctype:this.docname);_f.frm_con.refresh_toolbar();if(page_body.wntoolbar)page_body.wntoolbar.rdocs.add(this.doctype,this.docname,1);this.set_heading();}
_f.Frm.prototype.refresh=function(no_script){if(this.docname){var dt=this.parent_doctype?this.parent_doctype:this.doctype;var dn=this.parent_docname?this.parent_docname:this.docname;this.perm=get_perm(dt,dn);if(!this.perm[0][READ]){if(user=='Guest'){msgprint('You must log in to view this page');}else{msgprint('No Read Permission');}
nav_obj.show_last_open();return;}
if(!this.setup_done)this.setup();if(!this.script_setup)
this.setup_client_script();this.runclientscript('set_perm',dt,dn);this.doc=get_local(this.doctype,this.docname);if(!this.opendocs[this.docname]){this.setnewdoc(this.docname);}
if(this.doc.__islocal)
this.is_editable[this.docname]=1;this.editable=this.is_editable[this.docname];if(this.editable||(!this.editable&&this.not_in_container)){if(this.print_wrapper){$dh(this.print_wrapper);$ds(this.form_wrapper);}
if(!no_script)this.runclientscript('refresh');if(!this.not_in_container){this.refresh_container();}
this.refresh_tabs();this.refresh_fields();this.refresh_dependency();if(this.meta.allow_attach)this.refresh_attachments();if(this.layout)this.layout.show();}else{this.refresh_container();if(this.print_wrapper){this.refresh_print_layout();}}
if(!this.display)this.show(this.docname,1,null,this.not_in_container);page_body.change_to('Forms');}}
_f.Frm.prototype.refresh_tabs=function(){var me=this;if(me.meta.section_style=='Tray'||me.meta.section_style=='Tabbed'){for(var i in me.sections){me.sections[i].hide();}
me.set_section(me.cur_section[me.docname]);}}
_f.Frm.prototype.refresh_fields=function(){var me=this;for(fkey in me.fields){var f=me.fields[fkey];f.perm=me.perm;f.docname=me.docname;if(f.refresh)f.refresh();}
me.cleanup_refresh(me);}
_f.Frm.prototype.cleanup_refresh=function(){var me=this;if(me.fields_dict['amended_from']){if(me.doc.amended_from){unhide_field('amended_from');unhide_field('amendment_date');}else{hide_field('amended_from');hide_field('amendment_date');}}
if(me.meta.autoname&&me.meta.autoname.substr(0,6)=='field:'&&!me.doc.__islocal){var fn=me.meta.autoname.substr(6);set_field_permlevel(fn,1);}}
_f.Frm.prototype.refresh_dependency=function(){var me=this;var dep_dict={};var has_dep=false;for(fkey in me.fields){var f=me.fields[fkey];f.dependencies_clear=true;var guardian=f.df.depends_on;if(guardian){if(!dep_dict[guardian])
dep_dict[guardian]=[];dep_dict[guardian][dep_dict[guardian].length]=f;has_dep=true;}}
if(!has_dep)return;var d=locals[me.doctype][me.docname];function all_dependants_clear(f){if(d[f.df.fieldname])return false;var l=dep_dict[f.df.fieldname];if(l){for(var i=0;i<l.length;i++){if(!l[i].dependencies_clear){return false;}
var v=d[l[i].df.fieldname];if(v||(v==0&&!v.substr)){return false;}}}
return true;}
for(var i=me.fields.length-1;i>=0;i--){var f=me.fields[i];f.guardian_has_value=true;if(f.df.depends_on){var v=d[f.df.depends_on];if(f.df.depends_on.substr(0,3)=='fn:'){f.guardian_has_value=cur_frm.runclientscript(f.df.depends_on.substr(3),cur_frm.doctype,cur_frm.docname);}else{if(v||(v==0&&!v.substr)){}else{f.guardian_has_value=false;}}}
if(f.df.depends_on){f.dependencies_clear=all_dependants_clear(f);if(f.guardian_has_value){if(f.grid)f.grid.show();else $ds(f.wrapper);}else{if(f.grid)f.grid.hide();else $dh(f.wrapper);}}}}
_f.Frm.prototype.setnewdoc=function(docname){if(this.opendocs[docname]){this.docname=docname;return;}
Meta.make_local_dt(this.doctype,docname);this.docname=docname;var me=this;var viewname=docname;if(this.meta.issingle)
viewname=this.doctype;var iconsrc='page.gif';if(this.meta.smallicon)
iconsrc=this.meta.smallicon;this.runclientscript('onload',this.doctype,this.docname);this.is_editable[docname]=1;if(this.meta.read_only_onload)
this.is_editable[docname]=0;if(this.meta.section_style=='Tray'||this.meta.section_style=='Tabbed'){this.cur_section[docname]=0;}
if(this.meta.allow_attach)
this.set_attachments();this.opendocs[docname]=true;}
_f.Frm.prototype.edit_doc=function(){this.is_editable[cur_frm.docname]=true;this.refresh();}
_f.Frm.prototype.show_doc=function(dn){this.show(dn);}
_f.Frm.prototype.save=function(save_action,call_back){if(!save_action)save_action='Save';var me=this;if(this.savingflag){msgprint("Document is currently saving....");return;}
if(save_action=='Submit'){locals[this.doctype][this.docname].submitted_on=dateutil.full_str();locals[this.doctype][this.docname].submitted_by=user;}
if(save_action=='Cancel'){var reason=prompt('Reason for cancellation (mandatory)','');if(!strip(reason)){msgprint('Reason is mandatory, not cancelled');return;}
locals[this.doctype][this.docname].cancel_reason=reason;locals[this.doctype][this.docname].cancelled_on=dateutil.full_str();locals[this.doctype][this.docname].cancelled_by=user;}else{validated=true;validation_message='';this.runclientscript('validate',cur_frm.doctype,cur_frm.docname);if(!validated){if(validation_message)
msgprint('Validation Error: '+validation_message);this.savingflag=false;return'Error';}}
var ret_fn=function(r){if(!cur_frm.not_in_container)
cur_frm.refresh();if(call_back){if(call_back=='home'){loadpage('_home');return;}
call_back();}}
var me=this;var ret_fn_err=function(){var doc=locals[me.doctype][me.docname];me.savingflag=false;ret_fn();}
this.savingflag=true;if(this.docname&&validated){return this.savedoc(save_action,ret_fn,ret_fn_err);}}
_f.Frm.prototype.runscript=function(scriptname,callingfield,onrefresh){var me=this;if(this.docname){var doclist=compress_doclist(make_doclist(this.doctype,this.docname));if(callingfield)callingfield.input.disabled=true;$c('runserverobj',{'docs':doclist,'method':scriptname},function(r,rtxt){if(onrefresh)onrefresh(r,rtxt);me.show();if(callingfield)callingfield.input.disabled=false;});}}
_f.Frm.prototype.runclientscript=function(caller,cdt,cdn){var _dt=this.parent_doctype?this.parent_doctype:this.doctype;var _dn=this.parent_docname?this.parent_docname:this.docname;var doc=get_local(_dt,_dn);if(!cdt)cdt=this.doctype;if(!cdn)cdn=this.docname;var ret=null;try{if(this.cscript[caller])
ret=this.cscript[caller](doc,cdt,cdn);if(this.cscript['custom_'+caller])
ret+=this.cscript['custom_'+caller](doc,cdt,cdn);}catch(e){submit_error(e);}
if(caller&&caller.toLowerCase()=='setup'){var doctype=get_local('DocType',this.doctype);var cs=doctype._client_script?doctype._client_script:(doctype.client_script_core+doctype.client_script);if(cs){try{var tmp=eval(cs);}catch(e){submit_error(e);}}
if(doctype.client_string){cur_frm.cstring={};var elist=doctype.client_string.split('---');for(var i=1;i<elist.length;i=i+2){cur_frm.cstring[strip(elist[i])]=elist[i+1];}}}
return ret;}
_f.Frm.prototype.copy_doc=function(onload,from_amend){if(!this.perm[0][CREATE]){msgprint('You are not allowed to create '+this.meta.name);return;}
var dn=this.docname;var newdoc=LocalDB.copy(this.doctype,dn,from_amend);if(this.meta.allow_attach&&newdoc.file_list)
newdoc.file_list=null;var dl=make_doclist(this.doctype,dn);var tf_dict={};for(var d in dl){d1=dl[d];if(!tf_dict[d1.parentfield]){tf_dict[d1.parentfield]=get_field(d1.parenttype,d1.parentfield);}
if(d1.parent==dn&&cint(tf_dict[d1.parentfield].no_copy)!=1){var ch=LocalDB.copy(d1.doctype,d1.name,from_amend);ch.parent=newdoc.name;ch.docstatus=0;ch.owner=user;ch.creation='';ch.modified_by=user;ch.modified='';}}
newdoc.__islocal=1;newdoc.docstatus=0;newdoc.owner=user;newdoc.creation='';newdoc.modified_by=user;newdoc.modified='';if(onload)onload(newdoc);loaddoc(newdoc.doctype,newdoc.name);}
_f.Frm.prototype.reload_doc=function(){var me=this;if(frms['DocType']&&frms['DocType'].opendocs[me.doctype]){msgprint("error:Cannot refresh an instance of \""+me.doctype+"\" when the DocType is open.");return;}
var ret_fn=function(r,rtxt){if(r.n_comments)this.n_comments[me]=r.n_comments;if(r.last_comment)this.last_comments[me]=r.last_comment;me.runclientscript('setup',me.doctype,me.docname);me.refresh();}
if(me.doc.__islocal){$c('webnotes.widgets.form.getdoctype',{'doctype':me.doctype},ret_fn,null,null,'Refreshing '+me.doctype+'...');}else{var gl=me.grids;for(var i=0;i<gl.length;i++){var dt=gl[i].df.options;for(var dn in locals[dt]){if(locals[dt][dn].__islocal&&locals[dt][dn].parent==me.docname){var d=locals[dt][dn];d.parent='';d.docstatus=2;d.__deleted=1;}}}
$c('webnotes.widgets.form.getdoc',{'name':me.docname,'doctype':me.doctype,'getdoctype':1,'user':user},ret_fn,null,null,'Refreshing '+me.docname+'...');}}
_f.Frm.prototype.savedoc=function(save_action,onsave,onerr){this.error_in_section=0;save_doclist(this.doctype,this.docname,save_action,onsave,onerr);}
_f.Frm.prototype.savesubmit=function(){var answer=confirm("Permanently Submit "+cur_frm.docname+"?");if(answer)this.save('Submit');}
_f.Frm.prototype.savecancel=function(){var answer=confirm("Permanently Cancel "+cur_frm.docname+"?");if(answer)this.save('Cancel');}
_f.Frm.prototype.amend_doc=function(){if(!this.fields_dict['amended_from']){alert('"amended_from" field must be present to do an amendment.');return;}
var me=this;var fn=function(newdoc){newdoc.amended_from=me.docname;if(me.fields_dict&&me.fields_dict['amendment_date'])
newdoc.amendment_date=dateutil.obj_to_str(new Date());}
this.copy_doc(fn,1);}
_f.get_value=function(dt,dn,fn){if(locals[dt]&&locals[dt][dn])
return locals[dt][dn][fn];}
_f.set_value=function(dt,dn,fn,v){var d=locals[dt][dn];if(!d)
msgprint('error:Trying to set a value for "'+dt+','+dn+'" which is not found');if(d[fn]!=v){d[fn]=v;d.__unsaved=1;var frm=frms[d.doctype];try{if(d.parent&&d.parenttype){locals[d.parenttype][d.parent].__unsaved=1;frm=frms[d.parenttype];}}catch(e){if(d.parent&&d.parenttype)
errprint('Setting __unsaved error:'+d.name+','+d.parent+','+d.parenttype);}
if(frm&&frm==cur_frm){frm.set_heading();}}}
_f.ColumnBreak=function(){this.set_input=function(){};}
_f.ColumnBreak.prototype.make_body=function(){if((!this.perm[this.df.permlevel])||(!this.perm[this.df.permlevel][READ])||this.df.hidden){return;}
this.cell=this.frm.layout.addcell(this.df.width);$y(this.cell.wrapper,{padding:'8px'});_f.cur_col_break_width=this.df.width;var fn=this.df.fieldname?this.df.fieldname:this.df.label;if(this.df&&this.df.label){this.label=$a(this.cell.wrapper,'div','columnHeading');this.label.innerHTML=this.df.label;}}
_f.ColumnBreak.prototype.refresh=function(layout){if(!this.cell)return;var fn=this.df.fieldname?this.df.fieldname:this.df.label;if(fn){this.df=get_field(this.doctype,fn,this.docname);if(this.set_hidden!=this.df.hidden){if(this.df.hidden)
this.cell.hide();else
this.cell.show();this.set_hidden=this.df.hidden;}}}
_f.SectionBreak=function(){this.set_input=function(){};}
_f.SectionBreak.prototype.make_row=function(){this.row=this.frm.layout.addrow();}
_f.SectionBreak.prototype.make_collapsible=function(head){var me=this;var t=make_table($a(head,'div'),1,2,'100%',[null,'60px'],{verticalAlign:'middle'});$y(t,{borderCollapse:'collapse'});this.label=$a($td(t,0,0),'div','sectionHeading');this.label.innerHTML=this.df.label?this.df.label:'';$y(this.row.body,{margin:'24px'});$y($td(t,0,1),{textAlign:'right'});this.exp_icon=$a($td(t,0,1),'span','link_type',{fontSize:'11px'});this.exp_icon.innerHTML='hide';this.exp_icon.onclick=function(){if(me.row.body.style.display.toLowerCase()=='none')me.exp_icon.expand();else me.exp_icon.collapse();}
this.exp_icon.expand=function(){$ds(me.row.body)
me.exp_icon.innerHTML='hide';}
this.exp_icon.collapse=function(){$dh(me.row.body)
me.exp_icon.innerHTML='show';}
$y(head,{padding:'2px',borderBottom:'1px solid #ccc',margin:'8px'});this.collapse=this.exp_icon.collapse;this.expand=this.exp_icon.expand;}
_f.SectionBreak.prototype.make_simple_section=function(static){var head=$a(this.row.header,'div','',{margin:'8px',marginBottom:'16px'});var me=this;var has_col=false;if(this.df.colour){has_col=true;var col=this.df.colour.split(':')[1];if(col!='FFF'){$y(this.row.sub_wrapper,{margin:'8px',padding:'0px',backgroundColor:('#'+col)});}}
if(static){this.label=$a(head,'div','sectionHeading',{margin:'0px',padding:'8px',backgroundColor:'#EEE'});this.label.innerHTML=this.df.label?this.df.label:'';}
if(!static){if(this.df.label){this.make_collapsible(head);}else if(!has_col){$y(head,{margin:'8px',borderBottom:'1px solid #AAA'});}}
if(this.df.description){var d=$a(head,'div','',{margin:'0px',padding:'8px',backgroundColor:'#EEE'});if(this.df.description.length>240){$($a(d,'div','comment')).html(replace_newlines(this.df.description.substr(0,240))+'...');$($a(d,'div','link_type',{fontSize:'11px'})).html('more').click(function(){msgprint(me.df.description)});}else{$($a(d,'div')).html(replace_newlines(this.df.description));}}}
_f.cur_sec_header=null;_f.SectionBreak.prototype.make_body=function(){if((!this.perm[this.df.permlevel])||(!this.perm[this.df.permlevel][READ])||this.df.hidden){return;}
var me=this;if(this.frm.meta.section_style=='Tabbed'){if(this.df.options!='Simple'){this.make_row();this.sec_id=this.frm.sections.length;this.frm.sections[this.sec_id]=this;this.frm.sections_by_label[me.df.label]=this;this.mytab=this.frm.tabs.add_tab(me.df.label,function(){me.frm.set_section(me.sec_id);});this.show=function(){this.row.show();me.mytab.set_selected();if(me.df.label&&me.df.trigger=='Client'&&(!me.in_filter))
cur_frm.runclientscript(me.df.label,me.doctype,me.docname);}
this.hide=function(){this.row.hide();me.mytab.hide();}
this.make_row();this.make_simple_section(1);if(!isIE)this.hide();}else{this.row=this.frm.layout.addsubrow();this.make_simple_section();}}else if(this.frm.meta.section_style=='Tray'){if(this.df.options!='Simple'){this.sec_id=this.frm.sections.length;this.frm.sections[this.sec_id]=this;this.frm.sections_by_label[me.df.label]=this;var w=$a(this.frm.tray_area,'div');this.header=$a(w,'div','',{padding:'4px 8px',cursor:'pointer'});this.header.innerHTML=me.df.label;this.header.onclick=function(){me.frm.set_section(me.sec_id);}
this.header.onmouseover=function(){if(_f.cur_sec_header!=this){$y(this,{backgroundColor:'#DDD'});}}
this.header.onmouseout=function(){if(_f.cur_sec_header!=this){$y(this,{backgroundColor:'#FFF'});}}
this.hide=function(){this.row.hide();$y(this.header,{backgroundColor:'#FFF',fontWeight:'normal',color:'#000'});}
this.show=function(){this.row.show();$y(this.header,{backgroundColor:'#AAA',fontWeight:'bold',color:'#FFF'});_f.cur_sec_header=this.header;if(me.df.label&&me.df.trigger=='Client'&&(!me.in_filter))
cur_frm.runclientscript(me.df.label,me.doctype,me.docname);}
this.make_row();this.make_simple_section(1);if(!isIE)this.hide();}else{this.row=this.frm.layout.addsubrow();this.make_simple_section();}}else if(this.df){this.row=this.frm.layout.addrow();this.make_simple_section();}}
_f.SectionBreak.prototype.refresh=function(layout){var fn=this.df.fieldname?this.df.fieldname:this.df.label;if(fn)
this.df=get_field(this.doctype,fn,this.docname);if((this.frm.meta.section_style!='Tray')&&(this.frm.meta.section_style!='Tabbed')&&this.set_hidden!=this.df.hidden){if(this.df.hidden){if(this.header)this.header.hide();if(this.row)this.row.hide();}else{if(this.header)this.header.show();if(this.expanded)
this.row.show();}
this.set_hidden=this.df.hidden;}}
_f.ImageField=function(){this.images={};}
_f.ImageField.prototype=new Field();_f.ImageField.prototype.onmake=function(){this.no_img=$a(this.wrapper,'div','no_img');this.no_img.innerHTML="No Image";$dh(this.no_img);}
_f.ImageField.prototype.get_image_src=function(doc){if(doc.file_list){file=doc.file_list.split(',');extn=file[0].split('.');extn=extn[extn.length-1].toLowerCase();var img_extn_list=['gif','jpg','bmp','jpeg','jp2','cgm','ief','jpm','jpx','png','tiff','jpe','tif'];if(in_list(img_extn_list,extn)){var src=outUrl+"?cmd=downloadfile&file_id="+file[1];}}else{var src="";}
return src;}
_f.ImageField.prototype.onrefresh=function(){var me=this;if(!this.images[this.docname])this.images[this.docname]=$a(this.wrapper,'img');else $di(this.images[this.docname]);var img=this.images[this.docname]
for(var dn in this.images)if(dn!=this.docname)$dh(this.images[dn]);var doc=locals[this.frm.doctype][this.frm.docname];if(!this.df.options)var src=this.get_image_src(doc);else var src=outUrl+'?cmd=get_file&fname='+this.df.options+"&__account="+account_id+(__sid150?("&sid150="+__sid150):'');if(src){$dh(this.no_img);if(img.getAttribute('src')!=src)img.setAttribute('src',src);canvas=this.wrapper;canvas.img=this.images[this.docname];canvas.style.overflow="auto";$w(canvas,"100%");if(!this.col_break_width)this.col_break_width='100%';var allow_width=cint(1000*(cint(this.col_break_width)-10)/100);if((!img.naturalWidth)||cint(img.naturalWidth)>allow_width)
$w(img,allow_width+'px');}else{$ds(this.no_img);}}
_f.ImageField.prototype.set_disp=function(val){}
_f.ImageField.prototype.set=function(val){}
_f.ButtonField=function(){};_f.ButtonField.prototype=new Field();_f.ButtonField.prototype.make_input=function(){var me=this;$y(this.input_area,{height:'30px',marginTop:'4px',marginBottom:'4px'});this.input=$a(this.input_area,'button');this.input.innerHTML=me.df.label;this.input.onclick=function(){this.disabled=true;if(me.df.trigger=='Client'&&(!me.in_filter)){cur_frm.runclientscript(me.df.label,me.doctype,me.docname);this.disabled=false;}else
cur_frm.runscript(me.df.options,me);}
$(this.input).button({icons:{primary:'ui-icon-circle-triangle-e'}});}
_f.ButtonField.prototype.set=function(v){};_f.ButtonField.prototype.set_disp=function(val){}
_f.TableField=function(){};_f.TableField.prototype=new Field();_f.TableField.prototype.make_body=function(){if(this.perm[this.df.permlevel]&&this.perm[this.df.permlevel][READ]){if(this.df.description){this.comment_area=$a(this.parent,'div','comment',{padding:'8px'});this.set_comment();}
this.grid=new _f.FormGrid(this);if(this.frm)this.frm.grids[this.frm.grids.length]=this;this.grid.make_buttons();}}
_f.TableField.prototype.refresh=function(){if(!this.grid)return;var st=this.get_status();if(!this.df['default'])
this.df['default']='';this.grid.can_add_rows=false;this.grid.can_edit=false
if(st=='Write'){if(cur_frm.editable&&this.perm[this.df.permlevel]&&this.perm[this.df.permlevel][WRITE]){this.grid.can_edit=true;if(this.df['default'].toLowerCase()!='no toolbar')
this.grid.can_add_rows=true;}
if(cur_frm.editable&&this.df.allow_on_submit&&cur_frm.doc.docstatus==1&&this.df['default'].toLowerCase()!='no toolbar'){this.grid.can_add_rows=true;this.grid.can_edit=true;}}
if(this.old_status!=st){if(st=='Write'){this.grid.show();}else if(st=='Read'){this.grid.show();}else{this.grid.hide();}
this.old_status=st;}
this.grid.refresh();}
_f.TableField.prototype.set=function(v){};_f.TableField.prototype.set_input=function(v){};_f.CodeField=function(){};_f.CodeField.prototype=new Field();_f.CodeField.prototype.make_input=function(){var me=this;$ds(this.label_area);this.label_area.innerHTML=this.df.label;this.input=$a(this.input_area,'textarea','code_text');this.myid='code-'+codeid;this.input.setAttribute('id',this.myid);codeid++;this.input.setAttribute('wrap','off');this.input.set_input=function(v){if(me.editor){me.editor.setContent(v);}else{me.input.value=v;me.input.innerHTML=v;}}
this.input.onchange=function(){if(me.editor){me.set(me.editor.getContent());}else{me.set(me.input.value);}
me.run_trigger();}
this.get_value=function(){if(me.editor){return me.editor.getContent();}else{return this.input.value;}}
if(this.df.fieldtype=='Text Editor'){code_editors[me.df.fieldname]=me;if(!tinymce_loaded){tinymce_loaded=1;tinyMCE_GZ.init({strict_loading_mode:true,themes:"advanced",plugins:"style,table,indicime",languages:"en",disk_cache:true},function(){me.setup_editor()});}else{this.setup_editor();}}else{$y(me.input,{fontFamily:'Courier, Fixed'});}}
_f.CodeField.prototype.set_disp=function(val){$y(this.disp_area,{width:'90%'})
this.disp_area.innerHTML='<textarea class="code_text" readonly=1>'+val+'</textarea>';}
_f.CodeField.prototype.setup_editor=function(){var me=this;tinyMCE.init({theme:"advanced",mode:"none",strict_loading_mode:true,plugins:"table,style,indicime",theme_advanced_toolbar_location:"top",theme_advanced_toolbar_align:"left",theme_advanced_statusbar_location:"bottom",extended_valid_elements:"div[id|dir|class|align|style]",width:'100%',height:'360px',theme_advanced_buttons1:"save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect",theme_advanced_buttons2:"cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,cleanup,help,code,|,forecolor,backcolor,|,indicime,indicimehelp",theme_advanced_buttons3:"tablecontrols,styleprops,|,hr,removeformat,visualaid,|,sub,sup",init_instance_callback:"code_editors."+this.df.fieldname+".editor_init_callback",onchange_callback:"code_editors."+this.df.fieldname+".input.onchange"});this.editor_init_callback=function(){if(cur_frm)
cur_frm.fields_dict[me.df.fieldname].editor=tinyMCE.get(me.myid);}
tinyMCE.execCommand("mceAddControl",false,me.myid);cur_frm.tinymce_id_list.push(me.myid);}
_f.cur_grid_cell=null;_f.Grid=function(parent){}
_f.Grid.prototype.init=function(parent,row_height){this.alt_row_bg='#F2F2FF';this.row_height=row_height;if(this.is_scrolltype){if(!row_height)this.row_height='26px';this.make_ui(parent);}else{this.make_ui_simple(parent);}
this.insert_column('','','Int','Sr','50px','',[1,0,0]);this.total_width=50;if(this.oninit)this.oninit();keypress_observers.push(this)}
_f.Grid.prototype.make_ui=function(parent){var ht=make_table($a(parent,'div'),1,2,'100%',['60%','40%']);this.main_title=$td(ht,0,0);this.main_title.className='columnHeading';$td(ht,0,1).style.textAlign='right';this.tbar_div=$a($td(ht,0,1),'div','grid_tbarlinks');if(isIE)$y(this.tbar_div,{width:'200px'});this.tbar_tab=make_table(this.tbar_div,1,4,'100%',['25%','25%','25%','25%']);this.wrapper=$a(parent,'div','grid_wrapper');$h(this.wrapper,cint(screen.width*0.5)+'px');this.head_wrapper=$a(this.wrapper,'div','grid_head_wrapper');this.head_tab=$a(this.head_wrapper,'table','grid_head_table');this.head_row=this.head_tab.insertRow(0);this.tab_wrapper=$a(this.wrapper,'div','grid_tab_wrapper');this.tab=$a(this.tab_wrapper,'table','grid_table');var me=this;this.wrapper.onscroll=function(){me.head_wrapper.style.top=me.wrapper.scrollTop+'px';}}
_f.Grid.prototype.make_ui_simple=function(parent){var ht=make_table($a(parent,'div'),1,2,'100px',['60%','40%']);this.main_title=$td(ht,0,0);this.main_title.className='columnHeading';$td(ht,0,1).style.textAlign='right';this.btn_area=$a(parent,'button','',{marginBottom:'8px',fontWeight:'bold'});this.btn_area.innerHTML='+ Add Row';this.wrapper=$a(parent,'div','grid_wrapper_simple');this.head_wrapper=$a(this.wrapper,'div','grid_head_wrapper_simple');this.head_tab=$a(this.head_wrapper,'table','grid_head_table');this.head_row=this.head_tab.insertRow(0);this.tab_wrapper=$a(this.wrapper,'div','grid_tab_wrapper_simple');this.tab=$a(this.tab_wrapper,'table','grid_table');var me=this;}
_f.Grid.prototype.show=function(){if(this.can_add_rows){if(this.is_scrolltype)$ds(this.tbar_div);else $ds(this.btn_area);}else{if(this.is_scrolltype)$dh(this.tbar_div);else $dh(this.btn_area);}
$ds(this.wrapper);}
_f.Grid.prototype.hide=function(){$dh(this.wrapper);$dh(this.tbar_div);}
_f.Grid.prototype.insert_column=function(doctype,fieldname,fieldtype,label,width,options,perm,reqd){var idx=this.head_row.cells.length;if(!width)width='100px';var col=this.head_row.insertCell(idx);if(!this.is_scrolltype){col.style.padding='2px';col.style.borderRight='1px solid #AA9';}
col.doctype=doctype;col.fieldname=fieldname;col.fieldtype=fieldtype;col.innerHTML='<div>'+label+'</div>';col.label=label;if(reqd)
col.childNodes[0].style.color="#D22";this.total_width+=cint(width);$w(col,width);col.orig_width=col.style.width;col.options=options;col.perm=perm;}
_f.Grid.prototype.set_column_disp=function(label,show){for(var i=0;i<this.head_row.cells.length;i++){var c=this.head_row.cells[i];if(label&&(c.label==label||c.cur_label==label)){if(show){var w=c.orig_width;this.head_tab.style.width=(this.total_width+cint(w))+'px';this.tab.style.width=(this.total_width+cint(w))+'px';}else{var w='0px';this.head_tab.style.width=(this.total_width-cint(c.orig_width))+'px';this.tab.style.width=(this.total_width-cint(c.orig_width))+'px';}
$w(c,w);if(this.tab){for(var j=0;j<this.tab.rows.length;j++){var cell=this.tab.rows[j].cells[i];$w(cell,w);if(show){$ds(cell.div);cell.div.style.padding='2px';}
else{$dh(cell.div);cell.div.style.padding='0px';}}}
break;}}}
_f.Grid.prototype.append_row=function(idx,docname){if(!idx)idx=this.tab.rows.length;var row=this.tab.insertRow(idx);row.docname=docname;if(idx%2)var odd=true;else var odd=false;var me=this;for(var i=0;i<this.head_row.cells.length;i++){var cell=row.insertCell(i);var hc=this.head_row.cells[i];$w(cell,hc.style.width);cell.row=row;cell.grid=this;if(this.is_scrolltype)cell.className='grid_cell';else cell.className='grid_cell_simple';cell.div=$a(cell,'div','grid_cell_div');if(this.row_height){cell.div.style.height=this.row_height;}
cell.div.cell=cell;cell.div.onclick=function(e){me.cell_click(this.cell,e);}
if(odd){$bg(cell,this.alt_row_bg);cell.is_odd=1;cell.div.style.border='2px solid '+this.alt_row_bg;}else $bg(cell,'#FFF');if(!hc.fieldname)cell.div.style.cursor='default';}
if(this.is_scrolltype)this.set_ht();return row;}
_f.Grid.prototype.refresh_cell=function(docname,fieldname){for(var r=0;r<this.tab.rows.length;r++){if(this.tab.rows[r].docname==docname){for(var c=0;c<this.head_row.cells.length;c++){var hc=this.head_row.cells[c];if(hc.fieldname==fieldname){this.set_cell_value(this.tab.rows[r].cells[c]);}}}}}
_f.cur_grid;_f.cur_grid_ridx;_f.Grid.prototype.set_cell_value=function(cell){if(cell.row.is_newrow)return;var hc=this.head_row.cells[cell.cellIndex];if(hc.fieldname){var v=locals[hc.doctype][cell.row.docname][hc.fieldname];}else{var v=(cell.row.rowIndex+1);}
if(v==null){v='';}
var me=this;if(cell.cellIndex){var ft=hc.fieldtype;if(ft=='Link'&&cur_frm.doc.docstatus<1)ft='Data';$s(cell.div,v,ft,hc.options);}else{cell.div.style.padding='2px';cell.div.style.textAlign='left';cell.innerHTML='';var t=make_table(cell,1,3,'60px',['20px','20px','20px'],{verticalAlign:'middle',padding:'2px'});$y($td(t,0,0),{paddingLeft:'4px'});$td(t,0,0).innerHTML=cell.row.rowIndex+1;if(cur_frm.editable&&this.can_edit){var ed=$a($td(t,0,1),'img','',{cursor:'pointer'});ed.cell=cell;ed.title='Edit Row';ed.src='images/icons/page.gif';ed.onclick=function(){_f.cur_grid=me;_f.cur_grid_ridx=this.cell.row.rowIndex;_f.edit_record(me.doctype,this.cell.row.docname,1);}
if(!me.is_scrolltype){var ca=$a($td(t,0,2),'img','',{cursor:'pointer'});ca.cell=cell;ca.title='Delete Row';ca.src='images/icons/cancel.gif';ca.onclick=function(){me.delete_row(me.doctype,this.cell.row.docname);}}}else{cell.div.innerHTML=(cell.row.rowIndex+1);cell.div.style.cursor='default';cell.div.onclick=function(){}}}}
_f.Grid.prototype.cell_click=function(cell,e){if(_f.cur_grid_cell==cell)
return;this.cell_select(cell);if(cur_frm.editable){if(isIE){window.event.cancelBubble=true;window.event.returnValue=false;}else{e.preventDefault();}}}
_f.Grid.prototype.notify_click=function(e,target){if(_f.cur_grid_cell&&!target.isactive){if(!(text_dialog&&text_dialog.display)&&!datepicker_active&&!(selector&&selector.display)){_f.cur_grid_cell.grid.cell_deselect();}}}
_f.Grid.prototype.cell_deselect=function(){if(_f.cur_grid_cell){var c=_f.cur_grid_cell;c.grid.remove_template(c);c.div.className='grid_cell_div';if(c.is_odd)c.div.style.border='2px solid '+c.grid.alt_row_bg;else c.div.style.border='2px solid #FFF';_f.cur_grid_cell=null;_f.cur_grid=null;this.isactive=false;delete click_observers[this.observer_id];}}
_f.Grid.prototype.cell_select=function(cell,ri,ci){if(ri!=null&&ci!=null)
cell=this.tab.rows[ri].cells[ci];var hc=this.head_row.cells[cell.cellIndex];if(!hc.template){this.make_template(hc);}
hc.template.perm=this.field?this.field.perm:hc.perm;if(hc.fieldname&&hc.template.get_status()=='Write'){this.cell_deselect();cell.div.style.border='2px solid #88F';_f.cur_grid_cell=cell;this.add_template(cell);this.isactive=true;click_observers.push(this);this.observer_id=click_observers.length-1;}}
_f.Grid.prototype.add_template=function(cell){if(!cell.row.docname&&this.add_newrow){this.add_newrow();this.cell_select(cell);}else{var hc=this.head_row.cells[cell.cellIndex];cell.div.innerHTML='';cell.div.appendChild(hc.template.wrapper);hc.template.activate(cell.row.docname);hc.template.activated=1;if(hc.template.input&&hc.template.input.set_width){hc.template.input.set_width(isIE?cell.offsetWidth:cell.clientWidth);}}}
_f.Grid.prototype.get_field=function(fieldname){for(var i=0;i<this.head_row.cells.length;i++){var hc=this.head_row.cells[i];if(hc.fieldname==fieldname){if(!hc.template){this.make_template(hc);}
return hc.template;}}
return{}}
_f.grid_date_cell='';_f.grid_refresh_date=function(){_f.grid_date_cell.grid.set_cell_value(_f.grid_date_cell);}
_f.grid_refresh_field=function(temp,input){if(input.value!=_f.get_value(temp.doctype,temp.docname,temp.df.fieldname))
if(input.onchange)input.onchange();}
_f.Grid.prototype.remove_template=function(cell){var hc=this.head_row.cells[cell.cellIndex];if(!hc.template)return;if(!hc.template.activated)return;if(hc.template.txt){if(hc.template.df.fieldtype=='Date'){_f.grid_date_cell=cell;setTimeout('_f.grid_refresh_date()',100);}
if(hc.template.txt.value)
_f.grid_refresh_field(hc.template,hc.template.txt);}else if(hc.template.input){_f.grid_refresh_field(hc.template,hc.template.input);}
if(hc.template&&hc.template.wrapper.parentNode)
cell.div.removeChild(hc.template.wrapper);this.set_cell_value(cell);hc.template.activated=0;if(isIE6){$dh(this.wrapper);$ds(this.wrapper);}}
_f.Grid.prototype.notify_keypress=function(e,keycode){if(keycode>=37&&keycode<=40&&e.shiftKey){if(text_dialog&&text_dialog.display){return;}}else
return;if(!_f.cur_grid_cell)return;if(_f.cur_grid_cell.grid!=this)return;var ri=_f.cur_grid_cell.row.rowIndex;var ci=_f.cur_grid_cell.cellIndex;switch(keycode){case 38:if(ri>0){this.cell_select('',ri-1,ci);}break;case 40:if(ri<(this.tab.rows.length-1)){this.cell_select('',ri+1,ci);}break;case 39:if(ci<(this.head_row.cells.length-1)){this.cell_select('',ri,ci+1);}break;case 37:if(ci>1){this.cell_select('',ri,ci-1);}break;}}
_f.Grid.prototype.make_template=function(hc){hc.template=make_field(get_field(hc.doctype,hc.fieldname),hc.doctype,'','',true);hc.template.grid=this;}
_f.Grid.prototype.append_rows=function(n){for(var i=0;i<n;i++)this.append_row();}
_f.Grid.prototype.truncate_rows=function(n){for(var i=0;i<n;i++)this.tab.deleteRow(this.tab.rows.length-1);}
_f.Grid.prototype.set_data=function(data){this.cell_deselect();if(this.is_scrolltype){this.tab.style.width=this.total_width+'px';this.head_tab.style.width=this.total_width+'px';}else{this.tab.style.width='100%';this.head_tab.style.width='100%';}
if(data.length>this.tab.rows.length)
this.append_rows(data.length-this.tab.rows.length);if(data.length<this.tab.rows.length)
this.truncate_rows(this.tab.rows.length-data.length);for(var ridx=0;ridx<data.length;ridx++){this.refresh_row(ridx,data[ridx]);}
if(this.can_add_rows&&this.make_newrow){this.make_newrow();}
if(this.is_scrolltype)this.set_ht();if(this.wrapper.onscroll)this.wrapper.onscroll();}
_f.Grid.prototype.set_ht=function(ridx,docname){var ht=((cint(this.row_height)+10)*(((this.tab&&this.tab.rows)?this.tab.rows.length:0)+1));if(ht<100)ht=100;if(ht>cint(0.3*screen.width))ht=cint(0.3*screen.width);ht+=4;$y(this.wrapper,{height:ht+'px'});}
_f.Grid.prototype.refresh_row=function(ridx,docname){var row=this.tab.rows[ridx];row.docname=docname;row.is_newrow=false;for(var cidx=0;cidx<row.cells.length;cidx++){this.set_cell_value(row.cells[cidx]);}}
_f.FormGrid=function(field){this.field=field;this.doctype=field.df.options;if(!this.doctype){show_alert('No Options for table '+field.df.label);}
this.col_break_width=cint(this.field.col_break_width);if(!this.col_break_width)this.col_break_width=100;this.is_scrolltype=true;if(field.df['default']&&field.df['default'].toLowerCase()=='simple')this.is_scrolltype=false;this.init(field.parent,field.df.width);this.setup();}
_f.FormGrid.prototype=new _f.Grid();_f.FormGrid.prototype.setup=function(){this.make_columns();}
_f.FormGrid.prototype.make_tbar_link=function(parent,label,fn,icon,isactive){var div=$a(parent,'div','',{cursor:'pointer'});var t=make_table(div,1,2,'90%',['20px',null]);var img=$a($td(t,0,0),'img');img.src='images/icons/'+icon;var l=$a($td(t,0,1),'span','link_type');l.style.fontSize='11px';l.innerHTML=label;div.onclick=fn;div.show=function(){$ds(this);}
div.hide=function(){$dh(this);}
$td(t,0,0).isactive=isactive;$td(t,0,1).isactive=isactive;l.isactive=isactive;div.isactive=isactive;return div;}
_f.FormGrid.prototype.make_buttons=function(){var me=this;if(this.is_scrolltype){this.tbar_btns={};this.tbar_btns['Del']=this.make_tbar_link($td(this.tbar_tab,0,0),'Del',function(){me.delete_row();},'table_row_delete.gif',1);this.tbar_btns['Ins']=this.make_tbar_link($td(this.tbar_tab,0,1),'Ins',function(){me.insert_row();},'table_row_insert.gif',1);this.tbar_btns['Up']=this.make_tbar_link($td(this.tbar_tab,0,2),'Up',function(){me.move_row(true);},'arrow_up.gif',1);this.tbar_btns['Dn']=this.make_tbar_link($td(this.tbar_tab,0,3),'Dn',function(){me.move_row(false);},'arrow_down.gif',1);for(var i in this.btns)
this.btns[i].isactive=true;}else{this.btn_area.onclick=function(){me.make_newrow(1);var dn=me.add_newrow();cur_grid=me;cur_grid_ridx=me.tab.rows.length-1;_f.edit_record(me.doctype,dn,1);}}}
_f.FormGrid.prototype.make_columns=function(){var gl=fields_list[this.field.df.options];if(!gl){alert('Table details not found "'+this.field.df.options+'"');}
var p=this.field.perm;for(var i=0;i<gl.length;i++){if(p[this.field.df.permlevel]&&p[this.field.df.permlevel][READ]&&(!gl[i].hidden)){this.insert_column(this.field.df.options,gl[i].fieldname,gl[i].fieldtype,gl[i].label,gl[i].width,gl[i].options,this.field.perm,gl[i].reqd);}}
if(!this.is_scrolltype){for(var i=0;i<this.head_row.cells.length;i++){var c=this.head_row.cells[i];$w(c,cint(cint(c.style.width)/this.total_width*100)+'%')}}}
_f.FormGrid.prototype.set_column_label=function(fieldname,label){for(var i=0;i<this.head_row.cells.length;i++){var c=this.head_row.cells[i];if(c.fieldname==fieldname){c.innerHTML='<div class="grid_head_div">'+label+'</div>';c.cur_label=label;break;}}}
_f.FormGrid.prototype.refresh=function(){var docset=getchildren(this.doctype,this.field.frm.docname,this.field.df.fieldname,this.field.frm.doctype);var data=[];for(var i=0;i<docset.length;i++){locals[this.doctype][docset[i].name].idx=i+1;data[data.length]=docset[i].name;}
this.set_data(data);}
_f.FormGrid.prototype.set_unsaved=function(){locals[cur_frm.doctype][cur_frm.docname].__unsaved=1;cur_frm.set_heading();}
_f.FormGrid.prototype.insert_row=function(){var d=this.new_row_doc();var ci=_f.cur_grid_cell.cellIndex;var row_idx=_f.cur_grid_cell.row.rowIndex;d.idx=row_idx+1;for(var ri=row_idx;ri<this.tab.rows.length;ri++){var r=this.tab.rows[ri];if(r.docname)
locals[this.doctype][r.docname].idx++;}
this.refresh();this.cell_select('',row_idx,ci);this.set_unsaved();}
_f.FormGrid.prototype.new_row_doc=function(){var n=LocalDB.create(this.doctype);var d=locals[this.doctype][n];d.parent=this.field.frm.docname;d.parentfield=this.field.df.fieldname;d.parenttype=this.field.frm.doctype;return d;}
_f.FormGrid.prototype.add_newrow=function(){var r=this.tab.rows[this.tab.rows.length-1];if(!r.is_newrow)
show_alert('fn: add_newrow: Adding a row which is not flagged as new');var d=this.new_row_doc();d.idx=r.rowIndex+1;r.docname=d.name;r.is_newrow=false;this.set_cell_value(r.cells[0]);this.make_newrow();this.refresh_row(r.rowIndex,d.name);if(this.onrowadd)this.onrowadd(cur_frm.doc,d.doctype,d.name);return d.name;}
_f.FormGrid.prototype.make_newrow=function(from_add_btn){if(!this.can_add_rows)
return;if((!from_add_btn)&&(this.field.df['default'].toLowerCase()=='simple'))return;if(this.tab.rows.length){var r=this.tab.rows[this.tab.rows.length-1];if(r.is_newrow)
return;}
var r=this.append_row();r.cells[0].div.innerHTML='<b style="font-size: 18px;">*</b>';r.is_newrow=true;}
_f.FormGrid.prototype.check_selected=function(){if(!_f.cur_grid_cell){show_alert('Select a cell first');return false;}
if(_f.cur_grid_cell.grid!=this){show_alert('Select a cell first');return false;}
return true;}
_f.FormGrid.prototype.delete_row=function(dt,dn){if(dt&&dn){LocalDB.delete_record(dt,dn);this.refresh();}else{if(!this.check_selected())return;var r=_f.cur_grid_cell.row;if(r.is_newrow)return;var ci=_f.cur_grid_cell.cellIndex;var ri=_f.cur_grid_cell.row.rowIndex;LocalDB.delete_record(this.doctype,r.docname);this.refresh();if(ri<(this.tab.rows.length-2))
this.cell_select(null,ri,ci);else _f.cur_grid_cell=null;}
this.set_unsaved();}
_f.FormGrid.prototype.move_row=function(up){if(!this.check_selected())return;var r=_f.cur_grid_cell.row;if(r.is_newrow)return;if(up&&r.rowIndex>0){var swap_row=this.tab.rows[r.rowIndex-1];}else if(!up){var len=this.tab.rows.length;if(this.tab.rows[len-1].is_newrow)
len=len-1;if(r.rowIndex<(len-1))
var swap_row=this.tab.rows[r.rowIndex+1];}
if(swap_row){var cidx=_f.cur_grid_cell.cellIndex;this.cell_deselect();var aidx=locals[this.doctype][r.docname].idx;locals[this.doctype][r.docname].idx=locals[this.doctype][swap_row.docname].idx;locals[this.doctype][swap_row.docname].idx=aidx;var adocname=swap_row.docname;this.refresh_row(swap_row.rowIndex,r.docname);this.refresh_row(r.rowIndex,adocname);this.cell_select(this.tab.rows[swap_row.rowIndex].cells[cidx]);this.set_unsaved();}}
_p.show_dialog=function(){if(!_p.dialog){_p.make_dialog();}
_p.dialog.show();}
_p.make_dialog=function(){var d=new Dialog(360,140,"Print Formats");d.make_body([['HTML','Select'],['Button','Go',function(){_p.build(sel_val(cur_frm.print_sel),_p.go);}]]);_p.dialog=d;d.onshow=function(){var c=d.widgets['Select'];c.appendChild(cur_frm.print_sel.wrapper);c.cur_sel=cur_frm.print_sel.wrapper;}}
_p.field_tab=function(layout_cell){var t=$a(layout_cell,'table','',{width:'100%'});var r=t.insertRow(0);this.r=r;r.insertCell(0);r.insertCell(1);r.cells[0].className='datalabelcell';r.cells[1].className='datainputcell';return r}
_p.print_std=function(){var dn=cur_frm.docname;var dt=cur_frm.doctype;var pf_list=[];function add_layout(){var l=new Layout();if(locals['DocType'][dt].print_outline=='Yes')l.with_border=1;pf_list[pf_list.length]=l;return l;}
var layout=add_layout();var cp=locals['Control Panel']['Control Panel'];pf_list[pf_list.length-1].addrow();if(cp.letter_head){pf_list[pf_list.length-1].cur_row.header.innerHTML=cp.letter_head;}
var h1=$a(layout.cur_row.header,'h1','',{marginBottom:'8px'});h1.innerHTML=dn;var h2=$a(layout.cur_row.header,'div','',{marginBottom:'8px',paddingBottom:'8px',borderBottom:(layout.with_border?'0px':'1px solid #000')});h2.innerHTML=dt;var fl=getchildren('DocField',dt,'fields','DocType');if(fl[0]&&fl[0].fieldtype!="Section Break"){layout.addrow();if(fl[0].fieldtype!="Column Break")
layout.addcell();}
for(var i=0;i<fl.length;i++){var fn=fl[i].fieldname?fl[i].fieldname:fl[i].label;if(fn)
var f=get_field(dt,fn,dn);else
var f=fl[i];if(!f.print_hide){switch(f.fieldtype){case'Section Break':layout.addrow();if(fl[i+1]&&(fl[i+1].fieldtype!='Column Break')){layout.addcell();}
if(f.label)
layout.cur_row.header.innerHTML='<div class="sectionHeading">'+f.label+'</div>';if(!layout.with_border){$y(layout.cur_row.wrapper,{borderBottom:'1px solid #000'});}
break;case'Column Break':layout.addcell(f.width,f.label);if(f.label)
layout.cur_cell.header.innerHTML='<div class="columnHeading">'+f.label+'</div>';break;case'Table':var t=print_table(dt,dn,f.fieldname,f.options,null,null,null,null);if(t.appendChild){layout.cur_cell.appendChild(t);}else{for(var ti=0;ti<t.length-1;ti++){layout.cur_cell.appendChild(t[ti]);layout.close_borders();pf_list[pf_list.length]='<div style="page-break-after: always;"></div>';layout=add_layout();layout.addrow();layout.addcell();var div=$a(layout.cur_cell,'div');div.innerHTML='Continued from previous page...';div.style.padding='4px';}
layout.cur_cell.appendChild(t[t.length-1]);}
break;case'HTML':var tmp=$a(layout.cur_cell,'div');tmp.innerHTML=f.options;break;case'Code':var tmp=$a(layout.cur_cell,'div');var v=_f.get_value(dt,dn,f.fieldname);tmp.innerHTML='<div>'+f.label+': </div>'
+'<pre style="font-family: Courier, Fixed;">'+(v?v:'')+'</pre>';break;default:if(f.fieldtype!="Button"){r=_p.field_tab(layout.cur_cell)
r.cells[0].innerHTML=f.label?f.label:f.fieldname;$s(r.cells[1],_f.get_value(dt,dn,f.fieldname),f.fieldtype);if(f.fieldtype=='Currency')
$y(r.cells[1],{textAlign:'left'});}}}}
layout.close_borders();var html='';for(var i=0;i<pf_list.length;i++){if(pf_list[i].wrapper){html+=pf_list[i].wrapper.innerHTML;}else if(pf_list[i].innerHTML){html+=pf_list[i].innerHTML;}else{html+=pf_list[i];}}
pf_list=[];html=html.replace(/<td>/g,'\n<td>');return html;}
_p.print_style=".datalabelcell {padding: 2px 0px; width: 38%;vertical-align:top; }"
+".datainputcell { padding: 2px 0px; width: 62%; text-align:left; }"
+".sectionHeading { font-size: 16px; font-weight: bold; margin: 8px 0px }"
+".columnHeading { font-size: 14px; font-weight: bold; margin: 8px 0px; }"
_p.formats={}
_p.build=function(fmtname,onload){if(!cur_frm){alert('No Document Selected');return;}
var doc=locals[cur_frm.doctype][cur_frm.docname];if(fmtname=='Standard'){onload(_p.render(_p.print_std(),_p.print_style,doc,doc.name));}else{if(!_p.formats[fmtname])
$c('webnotes.widgets.form.get_print_format',{'name':fmtname},function(r,t){_p.formats[fmtname]=r.message;onload(_p.render(_p.formats[fmtname],'',doc,doc.name));});else
onload(_p.render(_p.formats[fmtname],'',doc,doc.name));}}
_p.render=function(body,style,doc,title){var block=document.createElement('div');var tmp_html='';block.innerHTML=body;if(doc&&cint(doc.docstatus)==0&&cur_frm.perm[0][SUBMIT]){var tmp_html='<div style="text-align: center; padding: 8px; background-color: #CCC; "><div style="font-size: 20px; font-weight: bold; ">DRAFT</div>This box will go away after the document is submitted.</div>';}
style=_p.def_print_style+style;var jslist=block.getElementsByTagName('script');while(jslist.length>0){for(var i=0;i<jslist.length;i++){var code=jslist[i].innerHTML;var p=jslist[i].parentNode;var sp=$a(p,'span');p.replaceChild(sp,jslist[i]);var h=eval(code);if(!h)h='';sp.innerHTML=h;}
jslist=block.getElementsByTagName('script');}
return'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n'
+'<html><head>'
+'<title>'+title+'</title>'
+'<style>'+style+'</style>'
+'</head><body>'
+tmp_html
+block.innerHTML
+'</body></html>';}
print_table=function(dt,dn,fieldname,tabletype,cols,head_labels,widths,condition,cssClass){var fl=fields_list[tabletype];var ds=getchildren(tabletype,dn,fieldname,dt);var tl=[];var cell_style={border:'1px solid #000',padding:'2px',verticalAlign:'top'};var make_table=function(fl){var w=document.createElement('div');var t=$a(w,'table','',{width:'100%',borderCollapse:'collapse',marginBottom:'10px'});t.wrapper=w;t.insertRow(0);var c_start=0;if(fl[0]=='SR'){var cell=t.rows[0].insertCell(0)
cell.innerHTML=head_labels?head_labels[0]:' ';$y(cell,{width:'30px'});$y(cell,cell_style)
c_start=1;}
for(var c=c_start;c<fl.length;c++){var cell=t.rows[0].insertCell(c);$y(cell,cell_style)
if(head_labels)
cell.innerHTML=head_labels[c];else
cell.innerHTML=fl[c].label;if(fl[c].width)
$y(cell,{width:fl[c].width});if(widths)
$y(cell,{width:widths[c]});if(fl[c].fieldtype=='Currency')
$y(cell,{textAlign:'right'});cell.style.fontWeight='bold';}
return t;}
if(!ds.length)return document.createElement('div');var newfl=[];if(cols&&cols.length){if(cols[0]=='SR')newfl[0]='SR';for(var i=0;i<cols.length;i++){for(var j=0;j<fl.length;j++){if(fl[j].fieldname==cols[i]){newfl[newfl.length]=fl[j];break;}}}}else{newfl=['SR']
for(var j=0;j<fl.length;j++){if(!fl[j].print_hide){newfl[newfl.length]=fl[j];}}}
fl=newfl;var t=make_table(fl);tl.push(t.wrapper);var c_start=0;if(fl[0]=='SR'){c_start=1;}
var sr=0;for(var r=0;r<ds.length;r++){if((!condition)||(condition(ds[r]))){if(ds[r].page_break){var t=make_table(fl);tl.push(t.wrapper);}
var rowidx=t.rows.length;sr++
var row=t.insertRow(rowidx);if(c_start){var cell=row.insertCell(0);cell.innerHTML=sr;$y(cell,cell_style);}
for(var c=c_start;c<fl.length;c++){var cell=row.insertCell(c);$y(cell,cell_style);$s(cell,ds[r][fl[c].fieldname],fl[c].fieldtype);if(fl[c].fieldtype=='Currency')
cell.style.textAlign='right';}}}
if(tl.length>1)return tl;else return tl[0];}
_e.email_as_field='email_id';_e.email_as_dt='Contact';_e.email_as_in='email_id,contact_name';sendmail=function(emailto,emailfrom,cc,subject,message,fmt,with_attachments){var fn=function(html){$c('webnotes.utils.email_lib.send_form',{'sendto':emailto,'sendfrom':emailfrom?emailfrom:'','cc':cc?cc:'','subject':subject,'message':message,'body':html,'with_attachments':with_attachments?1:0,'dt':cur_frm.doctype,'dn':cur_frm.docname},function(r,rtxt){});}
_p.build(fmt,fn);}
_e.make=function(){var d=new Dialog(440,440,"Send Email");var email_go=function(){var emailfrom=d.widgets['From'].value;var emailto=d.widgets['To'].value;if(!emailfrom)
emailfrom=user_email;var email_list=emailto.split(/[,|;]/);var valid=1;for(var i=0;i<email_list.length;i++){if(!validate_email(email_list[i])){msgprint('error:'+email_list[i]+' is not a valid email id');valid=0;}}
if(emailfrom&&!validate_email(emailfrom)){msgprint('error:'+emailfrom+' is not a valid email id. To change the default please click on Profile on the top right of the screen and change it.');return;}
if(!valid)return;var cc=emailfrom;if(!emailfrom){emailfrom=locals['Control Panel']['Control Panel'].auto_email_id;cc='';}
sendmail(emailto,emailfrom,emailfrom,d.widgets['Subject'].value,d.widgets['Message'].value,sel_val(cur_frm.print_sel),d.widgets['Send With Attachments'].checked);_e.dialog.hide();}
d.onhide=function(){hide_autosuggest();}
d.make_body([['Data','To','Example: abc@hotmail.com, xyz@yahoo.com'],['Select','Format'],['Data','Subject'],['Data','From','Optional'],['Check','Send With Attachments','Will send all attached documents (if any)'],['Text','Message'],['Button','Send',email_go]]);d.widgets['From'].value=(user_email?user_email:'');$td(d.rows['Format'].tab,0,1).cur_sel=d.widgets['Format'];var opts={script:'',json:true,maxresults:10};var as=new AutoSuggest(d.widgets['To'],opts);as.custom_select=function(txt,sel){var r='';var tl=txt.split(',');for(var i=0;i<tl.length-1;i++)r=r+tl[i]+',';r=r+(r?' ':'')+sel;if(r[r.length-1]==NEWLINE)r=substr(0,r.length-1);return r;}
as.doAjaxRequest=function(txt){var pointer=as;var q='';var last_txt=txt.split(',');last_txt=last_txt[last_txt.length-1];var call_back=function(r,rt){as.aSug=[];if(!r.cl)return;for(var i=0;i<r.cl.length;i++){as.aSug.push({'id':r.cl[i],'value':r.cl[i],'info':''});}
as.createList(as.aSug);}
$c('webnotes.utils.email_lib.get_contact_list',{'select':_e.email_as_field,'from':_e.email_as_dt,'where':_e.email_as_in,'txt':(last_txt?strip(last_txt):'%')},call_back);return;}
var sel;_e.dialog=d;}
_f.Frm.prototype.setup_attach=function(){var me=this;this.attach_area=$a(this.layout?this.layout.cur_row.wrapper:this.body,'div','attach_area');if(!this.meta.max_attachments)
this.meta.max_attachments=10;var tab=$a($a(this.attach_area,'div'),'table');tab.insertRow(0);var label_area=tab.rows[0].insertCell(0);var main_area=tab.rows[0].insertCell(1);this.files_area=$a(main_area,'div');this.btn_area=$a(main_area,'div');$w(label_area,"33%");var d=$a(label_area,'div');var img=$a(d,'img','',{marginRight:'8px'});img.src='images/icons/paperclip.gif';$a(d,'span').innerHTML='File Attachments:';me.attach_msg=$a(label_area,'div','comment',{padding:'8px',fontSize:'11px'});me.attach_msg.innerHTML="Changes made to the attachments are not permanent until the document is saved";var btn_add_attach=$a(this.btn_area,'button');btn_add_attach.innerHTML='Add';btn_add_attach.onclick=function(){me.add_attachment();me.sync_attachments(me.docname);me.refresh_attachments();}}
_f.Frm.prototype.refresh_attachments=function(){if(!this.perm[0][WRITE]){$dh(this.btn_area);}
else{$ds(this.btn_area);}
var nattach=0;for(var dn in this.attachments){for(var i in this.attachments[dn]){var a=this.attachments[dn][i];if(a.docname!=this.docname)
a.hide();else{a.show();nattach++;if(this.perm[0][WRITE]&&this.editable){$ds(a.delbtn);}
else{$dh(a.delbtn);}}}}
if(this.editable){if(nattach>=cint(this.meta.max_attachments))
$dh(this.btn_area);else
$ds(this.btn_area);}else{$dh(this.btn_area);}}
_f.Frm.prototype.set_attachments=function(){this.attachments[this.docname]=[];var atl=locals[this.doctype][this.docname].file_list;if(atl){atl=atl.split('\n');for(var i in atl){var a=atl[i].split(',');var ff=this.add_attachment(a[0],a[1]);}}}
_f.Frm.prototype.add_attachment=function(filename,fileid){var at_id=this.attachments[this.docname].length;var ff=new _f.FileField(this.files_area,at_id,this);if(filename)ff.filename=filename;if(fileid)ff.fileid=fileid;ff.docname=this.docname;this.attachments[this.docname][at_id]=ff;ff.refresh();return ff;}
_f.Frm.prototype.sync_attachments=function(docname){var fl=[];for(var i in this.attachments[docname]){var a=this.attachments[docname][i];fl[fl.length]=a.filename+','+a.fileid;}
locals[this.doctype][docname].file_list=fl.join('\n')}
_f.FileField=function(parent,at_id,frm,addlink){var me=this;this.at_id=at_id
this.wrapper=$a(parent,'div');var tab=$a(this.wrapper,'table');tab.insertRow(0);var main_area=tab.rows[0].insertCell(0);var del_area=tab.rows[0].insertCell(1);$w(del_area,'20%');this.delbtn=$a(del_area,'div','link_type');this.delbtn.innerHTML='Remove';this.remove=function(){var yn=confirm("The document will be saved after the attachment is deleted for the changes to be permanent. Proceed?")
if(yn){me.wrapper.style.display='none';var fid=frm.attachments[frm.docname][me.at_id].fileid;if(fid){$c('webnotes.widgets.form.remove_attach',args={'fid':fid},function(r,rt){});}
delete frm.attachments[frm.docname][me.at_id];frm.sync_attachments(frm.docname);var ret=frm.save('Save');if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");}}
this.hide=function(){$dh(me.wrapper);}
this.show=function(){$ds(me.wrapper);}
this.delbtn.onclick=this.remove;this.upload_div=$a(main_area,'div');this.download_div=$a(main_area,'div');var div=$a(this.upload_div,'div');div.innerHTML='<iframe id="RSIFrame" name="RSIFrame" src="blank1.html" style="width:0px; height:0px; border:0px"></iframe>';var div=$a(this.upload_div,'div');div.innerHTML='<form method="POST" enctype="multipart/form-data" action="'+outUrl+'" target="RSIFrame"></form>';var ul_form=div.childNodes[0];var f_list=[];var inp_fdata=$a_input($a(ul_form,'span'),'file',{name:'filedata'});var inp=$a_input($a(ul_form,'span'),'hidden',{name:'cmd'});inp.value='uploadfile';var inp=$a_input($a(ul_form,'span'),'submit');inp.value='Upload';var inp=$a_input($a(ul_form,'span'),'hidden',{name:'doctype'});inp.value=frm.doctype;var inp=$a_input($a(ul_form,'span'),'hidden',{name:'docname'});inp.value=frm.docname;var inp=$a_input($a(ul_form,'span'),'hidden',{name:'at_id'});inp.value=at_id;this.download_link=$a(this.download_div,'a','link_type');this.refresh=function(){if(this.filename){$dh(this.upload_div);this.download_link.innerHTML=this.filename;this.download_link.href=outUrl+'?cmd=get_file&fname='+this.fileid;this.download_link.target="_blank";$ds(this.download_div);}else{$ds(this.upload_div);$dh(this.download_div);}}}
_f.file_upload_done=function(doctype,docname,fileid,filename,at_id){var at_id=cint(at_id);var frm=frms[doctype];var a=frm.attachments[docname][at_id];a.filename=filename;a.fileid=fileid;frm.sync_attachments(docname);a.refresh();var do_save=confirm('File Uploaded Sucessfully. You must save this document for the uploaded file to be registred. Save this document now?');if(do_save){var ret=frm.save('Save');if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");}else{msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");}}
$c_get_values=function(args,doc,dt,dn,user_callback){var call_back=function(r,rt){if(!r.message)return;if(user_callback)user_callback(r.message);var fl=args.fields.split(',');for(var i in fl){locals[dt][dn][fl[i]]=r.message[fl[i]];if(args.table_field)
refresh_field(fl[i],dn,args.table_field);else
refresh_field(fl[i]);}}
$c('webnotes.widgets.form.get_fields',args,call_back);}
get_server_fields=function(method,arg,table_field,doc,dt,dn,allow_edit,call_back){if(!allow_edit)freeze('Fetching Data...');$c('runserverobj',args={'method':method,'docs':compress_doclist([doc]),'arg':arg},function(r,rt){if(r.message){var d=locals[dt][dn];var field_dict=eval('var a='+r.message+';a');for(var key in field_dict){d[key]=field_dict[key];if(table_field)refresh_field(key,d.name,table_field);else refresh_field(key);}}
if(call_back){doc=locals[doc.doctype][doc.name];call_back(doc,dt,dn);}
if(!allow_edit)unfreeze();});}
set_multiple=function(dt,dn,dict,table_field){var d=locals[dt][dn];for(var key in dict){d[key]=dict[key];if(table_field)refresh_field(key,d.name,table_field);else refresh_field(key);}}
refresh_many=function(flist,dn,table_field){for(var i in flist){if(table_field)refresh_field(flist[i],dn,table_field);else refresh_field(flist[i]);}}
set_field_tip=function(n,txt){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.description=txt;if(cur_frm&&cur_frm.fields_dict){if(cur_frm.fields_dict[n])
cur_frm.fields_dict[n].comment_area.innerHTML=replace_newlines(txt);else
errprint('[set_field_tip] Unable to set field tip: '+n);}}
refresh_field=function(n,docname,table_field){if(table_field){if(_f.frm_dialog&&_f.frm_dialog.display){if(_f.frm_dialog.cur_frm.fields_dict[n]&&_f.frm_dialog.cur_frm.fields_dict[n].refresh)
_f.frm_dialog.cur_frm.fields_dict[n].refresh();}else{var g=_f.cur_grid_cell;if(g)var hc=g.grid.head_row.cells[g.cellIndex];if(g&&hc&&hc.fieldname==n&&g.row.docname==docname){hc.template.refresh();}else{cur_frm.fields_dict[table_field].grid.refresh_cell(docname,n);}}}else if(cur_frm&&cur_frm.fields_dict){if(cur_frm.fields_dict[n]&&cur_frm.fields_dict[n].refresh)
cur_frm.fields_dict[n].refresh();}}
set_field_options=function(n,txt){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.options=txt;refresh_field(n);}
set_field_permlevel=function(n,level){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.permlevel=level;refresh_field(n);}
hide_field=function(n){function _hide_field(n,hidden){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.hidden=hidden;refresh_field(n);}
if(cur_frm){if(n.substr)_hide_field(n,1);else{for(var i in n)_hide_field(n[i],1)}}}
unhide_field=function(n){function _hide_field(n,hidden){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.hidden=hidden;refresh_field(n);}
if(cur_frm){if(n.substr)_hide_field(n,0);else{for(var i in n)_hide_field(n[i],0)}}}
get_field_obj=function(fn){return cur_frm.fields_dict[fn];}