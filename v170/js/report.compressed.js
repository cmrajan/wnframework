
GraphViewer=function(parent,w,h){this.show_labels=true;this.font_size=10;if(!parent){this.wrapper=document.createElement('div')
parent=this.wrapper}
this.body=$a(parent,'div','gr_body');if(w&&h){$w(this.body,w+'px');$w(this.body,h+'px');}
this._y_name=$a(parent,'div','gr_y_name');this._x_name=$a(parent,'div','gr_x_name');this._y_labels=$a(parent,'div','gr_y_labels');this._x_labels=$a(parent,'div','gr_x_labels');this.legend_area=$a(parent,'div','gr_legend_area');this.title_area=$a(parent,'div','gr_title_area');this.main_area=$a(parent,'div','gr_main_area');this.set_horizontal();}
GraphViewer.prototype.clear=function(){this.series=[];this.xlabels=[];this.xtitle=null;this.ytitle=null;}
GraphViewer.prototype.set_vertical=function(){this.k_barwidth='width';this.k_barstart='left';this.k_barlength='height';this.k_barbase='bottom';this.k_bartop='top';this.k_gridborder='borderTop';this.y_name=this._y_name;this.x_name=this._x_name;this.y_labels=this._y_labels;this.x_labels=this._x_labels;this.vertical=true;}
GraphViewer.prototype.set_horizontal=function(){this.k_barwidth='height';this.k_barstart='top';this.k_barlength='width';this.k_barbase='left';this.k_bartop='right';this.k_gridborder='borderRight';this.y_name=this._x_name;this.x_name=this._y_name;this.y_labels=this._x_labels;this.x_labels=this._y_labels;this.vertical=false;}
GraphViewer.prototype.set_title=function(t){this.title_area.innerHTML=t;}
GraphViewer.prototype.add_series=function(label,color,values,borderColor){var s=new GraphViewer.GraphSeries(this,label);s.color=color;s.borderColor=borderColor;s.data=values;this.series[this.series.length]=s;}
GraphViewer.prototype.refresh=function(){this.legend_area.innerHTML='';this.main_area.innerHTML='';this.x_labels.innerHTML='';this.y_labels.innerHTML='';this.x_name.innerHTML='';this.y_name.innerHTML='';var maxx=null;var legendheight=12;for(i=0;i<this.series.length;i++){var series_max=this.series[i].get_max();if(!maxx)maxx=series_max;if(series_max>maxx)maxx=series_max;var tmp=$a(this.legend_area,'div','gr_legend');tmp.style.backgroundColor=this.series[i].color;if(this.series[i].borderColor)
tmp.style.border='1px solid '+this.series[i].borderColor;tmp.style.top=(i*(legendheight+2))+'px';tmp.style.height=legendheight+'px';var tmp1=$a(this.legend_area,'div','gr_legend');tmp1.style.top=(i*(legendheight+2))+'px';tmp1.style.left='30px';$w(tmp1,'80px');tmp1.innerHTML=this.series[i].name;}
if(maxx==0)maxx=1;this.maxx=1.1*maxx;var xfn=fmt_money;if(maxx>1){var nchars=(cint(maxx)+'').length;var gstep=Math.pow(10,(nchars-1));while(flt(maxx/gstep)<4){gstep=gstep/2;}}else{var gstep=maxx/6;}
var curstep=gstep;while(curstep<this.maxx){var gr=$a(this.main_area,'div','gr_grid');gr.style[this.k_bartop]=(100-((flt(curstep)/this.maxx)*100))+'%';gr.style[this.k_barwidth]='100%';gr.style[this.k_gridborder]='1px dashed #888';var ylab=$a(this.y_labels,'div','gr_label');ylab.style[this.k_bartop]=(99-((flt(curstep)/this.maxx)*100))+'%';ylab.style[this.k_barstart]='10%';ylab.innerHTML=xfn(curstep);curstep+=gstep;}
if(this.vertical){this.x_name.innerHTML=this.xtitle;middletext(this.y_name,this.ytitle);}else{middletext(this.x_name,this.xtitle);this.y_name.innerHTML=this.ytitle;}
this.xunits=[];this.xunit_width=(100/this.xlabels.length);if(this.series[0]){for(i=0;i<this.xlabels.length;i++){this.xunits[this.xunits.length]=new GraphViewer.GraphXUnit(this,i,this.xlabels[i]);}}}
GraphViewer.GraphSeries=function(graph,name){this.graph=graph;this.name=name;}
GraphViewer.GraphSeries.prototype.get_max=function(){var m;for(t=0;t<this.data.length;t++){if(!m)m=this.data[t];if(this.data[t]>m)m=this.data[t]}
return m;}
GraphViewer.GraphXUnit=function(graph,idx,label){this.body=$a(graph.main_area,'div','gr_xunit');this.body.style[graph.k_barstart]=(idx*graph.xunit_width)+'%';this.body.style[graph.k_barwidth]=graph.xunit_width+'%';this.body.style[graph.k_barlength]='100%';this.show(graph,label,idx);if(graph.show_labels){this.label=$a(graph.x_labels,'div','gr_label');this.label.style[graph.k_barstart]=(idx*graph.xunit_width)+'%';this.label.style[graph.k_barwidth]=graph.xunit_width+'%';if(graph.vertical){$y(this.label,{height:'100%',top:'10%'});this.label.innerHTML=label;}else{middletext(this.label,label);}}}
GraphViewer.GraphXUnit.prototype.show=function(graph,l,idx){var bar_width=(100/(graph.series.length+1));start=(100-(graph.series.length*bar_width))/2
for(var i=0;i<graph.series.length;i++){var v=graph.series[i].data[idx];var b=$a(this.body,'div','gr_bar');b.style[graph.k_barbase]='0%';b.style[graph.k_barstart]=start+'%';b.style[graph.k_barwidth]=bar_width+'%';b.style[graph.k_barlength]=(v/graph.maxx*100)+'%';if(graph.series[i].color)b.style.backgroundColor=graph.series[i].color;if(graph.series[i].borderColor)
b.style.border='1px solid '+graph.series[i].borderColor;start+=bar_width;}}
function middletext(par,t,size){if(!size)size=10;var tb=$a(par,'div','absdiv');tb.style.top=((par.clientHeight-size)/2)+'px';tb.innerHTML=t;}
_r.ReportContainer=function(){this.wrapper=page_body.add_page("Report Builder",function(){});var me=this;this.rb_dict={};var div=$a(this.wrapper,'div');var htab=make_table($a(div,'div','',{padding:'6px 8px 4px 8px',backgroundColor:'#DFD'}),1,2,'100%',['80%','20%']);this.main_title=$a($td(htab,0,0),'div','',{fontFamily:'Helvetica',display:'inline',fontSize:'24px'});$y($td(htab,0,1),{textAlign:'right'});this.close_btn=$a($a($td(htab,0,1),'div','',{padding:'2px',margin:'0px'}),'img','',{cursor:'pointer'});this.close_btn.src="images/icons/close.gif";this.close_btn.onclick=function(){nav_obj.show_last_open();}
this.button_area2=$a($td(htab,0,1),'div',{marginTop:'8px'});var htab=make_table($a(div,'div','',{padding:'4px'}),1,2,'100%',['80%','20%']);this.button_area=$a($td(htab,0,0),'div');this.button_area2=$a($td(htab,0,1),'div',{marginTop:'8px'});$y($td(htab,0,1),{textAlign:'right'});if(has_common(['Administrator','System Manager'],user_roles)){var savebtn=$a(this.button_area2,'span','link_type',{marginRight:'8px'});savebtn.innerHTML='Save';savebtn.onclick=function(){if(me.cur_rb)me.cur_rb.save_criteria();};var advancedbtn=$a(this.button_area2,'span','link_type');advancedbtn.innerHTML='Advanced';advancedbtn.onclick=function(){if(me.cur_rb){if(!me.cur_rb.current_loaded){msgprint("error:You must save the report before you can set Advanced features");return;}
loaddoc('Search Criteria',me.cur_rb.sc_dict[me.cur_rb.current_loaded]);}};}
var runbtn=$a(this.button_area,'button');runbtn.innerHTML='Run'.bold();runbtn.onclick=function(){if(me.cur_rb){me.cur_rb.dt.start_rec=1;me.cur_rb.dt.run();}}
$dh(this.button_area);this.rb_area=$a(this.wrapper,'div');this.set_dt=function(dt,onload){$dh(me.home_area);$ds(me.rb_area);$ds(me.button_area);my_onload=function(f){me.cur_rb=f;me.cur_rb.mytabs.tabs['Result'].show();if(onload)onload(f);}
if(me.cur_rb)
me.cur_rb.hide();if(me.rb_dict[dt]){me.rb_dict[dt].show(my_onload);}else{me.rb_dict[dt]=new _r.ReportBuilder(me.rb_area,dt,my_onload);}}}
_r.FILTER_SEP='\1';_r.ReportBuilder=function(parent,doctype,onload){this.menuitems={};this.has_primary_filters=false;this.doctype=doctype;var me=this;this.fn_list=['beforetableprint','beforerowprint','afterrowprint','aftertableprint','customize_filters'];this.wrapper=$a(parent,'div','finder_wrapper');this.make_tabs();this.current_loaded=null;this.make_filters(onload);this.hide=function(){$dh(me.wrapper);}
this.show=function(my_onload){$ds(me.wrapper);if(my_onload)my_onload(me);}
this.make_save_criteria();}
_r.ReportBuilder.prototype.make_tabs=function(){this.tab_wrapper=$a(this.wrapper,'div','finder_tab_area');this.mytabs=new TabbedPage(this.tab_wrapper);this.mytabs.body_area.className='finder_body_area';this.mytabs.add_tab('Result');this.mytabs.add_tab('More Filters');this.mytabs.add_tab('Select Columns');this.mytabs.add_tab('Graph');$dh(this.mytabs.tabs['Graph']);}
_r.ReportBuilder.prototype.make_body=function(){_r.rb_con.main_title.innerHTML=this.doctype;this.mytabs.tabs['Result'].show();var me=this;this.pri_filter_fields_area=$a(this.mytabs.tabs['Result'].tab_body,'div','finder_filter_area');this.filter_area=$a(this.mytabs.tabs['More Filters'].tab_body,'div','finder_filter_area');this.builder_area=$a(this.mytabs.tabs['Select Columns'].tab_body,'div','finder_builder_area');this.make_graph();this.make_save_criteria();}
_r.ReportBuilder.prototype.make_graph=function(){var me=this;this.graph_area=$a(this.mytabs.tabs['Graph'].tab_body,'div','');this.mytabs.tabs['Graph'].onshow=function(){me.show_graph();}}
_r.ReportBuilder.prototype.clear_graph=function(){if(this.graph_div)$dh(this.graph_div);this.graph_clear=1;}
_r.ReportBuilder.prototype.show_graph=function(){var me=this;if(isIE){$dh(me.mytabs.tabs['Graph'].tab_body);$ds(me.mytabs.tabs['Graph'].tab_body);}
var show_no_graph=function(){if(!me.no_graph){me.no_graph=$a(me.mytabs.tabs['Graph'].tab_body,'div');me.no_graph.style.margin='16px';me.no_graph.innerHTML='No Graph Defined';}
$ds(me.no_graph);return;}
if(!me.current_loaded){show_no_graph();return;}
var sc=get_local('Search Criteria',me.sc_dict[me.current_loaded]);if(!sc||!sc.graph_series){show_no_graph();return;}
var series=me.dt.get_col_data(sc.graph_series);if(series.length>100)return;for(var i=0;i<series.length;i++){if(series[i].length>14)series[i]=series[i].substr(0,14)+'...';}
var ht=(series.length*20);if(!this.graph_clear)return;if(ht<400)ht=400;if(!me.graph_div){me.graph_div=$a(me.graph_area,'div');me.graph_div.style.position='relative';me.graph_div.style.border='2px solid #AAA';me.graph_div.style.marginTop='16px';}
$ds(me.graph_div);$dh(me.no_graph);var values=me.dt.get_col_data(sc.graph_values);for(var i=0;i<values.length;i++){values[i]=flt(values[i]);}
$h(me.graph_div,ht+'px');if(!me.graphobj){me.graphobj=new GraphViewer(me.graph_div);}
var g=me.graphobj;g.clear();g.set_title('');if(series.length<16)g.set_vertical();else g.set_horizontal();g.series1_color='#AAF';g.series1_border_color='#88A';g.series2_color='#AFA';g.series2_border_color='#8A8';g.series3_color='#FAA';g.series3_border_color='#88A';if(me.graph_settings)me.graph_settings(g);$h(g.main_area,(ht-160)+'px');$h(g._y_labels,(ht-160)+'px');g._x_name.style.top=(ht-40)+'px';g._x_labels.style.top=(ht-80)+'px';g.xtitle=sc.graph_series;g.ytitle=sc.graph_values;g.xlabels=series;g.add_series(sc.graph_values,g.series1_color,values,g.series1_border_color);g.refresh();this.graph_clear=0;}
_r.ReportBuilder.prototype.make_save_criteria=function(){var me=this;this.sc_list=[];this.sc_dict={};for(var n in locals['Search Criteria']){var d=locals['Search Criteria'][n];if(d.doc_type==this.doctype){this.sc_list[this.sc_list.length]=d.criteria_name;this.sc_dict[d.criteria_name]=n;}}}
_r.ReportBuilder.prototype.save_criteria=function(save_as){var overwrite=0;if(this.current_loaded&&(!save_as)){var overwrite=confirm('Do you want to overwrite the saved criteria "'+this.current_loaded+'"');if(overwrite){var doc=locals['Search Criteria'][this.sc_dict[this.current_loaded]];var criteria_name=this.current_loaded;}}
if(!overwrite){var criteria_name=prompt('Select a name for the criteria:','');if(!criteria_name)
return;var dn=createLocal('Search Criteria');var doc=locals['Search Criteria'][dn];doc.criteria_name=criteria_name;doc.doc_type=this.doctype;}
var cl=[];var fl={};for(var i=0;i<this.report_fields.length;i++){var chk=this.report_fields[i];if(chk.checked){cl[cl.length]=chk.df.parent+'\1'+chk.df.label;}}
for(var i=0;i<this.filter_fields.length;i++){var t=this.filter_fields[i];var v=t.get_value?t.get_value():'';if(v)fl[t.df.parent+'\1'+t.df.label+(t.bound?('\1'+t.bound):'')]=v;}
doc.columns=cl.join(',');doc.filters=docstring(fl);doc.sort_by=sel_val(this.dt.sort_sel);doc.sort_order=this.dt.sort_order;doc.page_len=this.dt.page_len;if(this.parent_dt)
doc.parent_doc_type=this.parent_dt
var me=this;var fn=function(r){me.sc_dict[criteria_name]=r.main_doc_name;me.set_criteria_sel(criteria_name);}
if(this.current_loaded&&overwrite){msgprint('Filters and Columns Synchronized. You must also "Save" the Search Criteria to update');loaddoc('Search Criteria',this.sc_dict[this.current_loaded]);}else{savedoc(doc.doctype,doc.name,'Save',fn);}}
_r.ReportBuilder.prototype.hide_all_filters=function(){for(var i=0;i<this.filter_fields.length;i++){this.filter_fields[i].df.filter_hide=1;}}
_r.ReportBuilder.prototype.clear_criteria=function(){for(var i=0;i<this.report_fields.length;i++){this.report_fields[i].checked=false;}
for(var i=0;i<this.filter_fields.length;i++){this.filter_fields[i].df.filter_hide=0;this.filter_fields[i].df.ignore=0;if(this.filter_fields[i].df.custom)
this.filter_fields[i].df.filter_hide=1;this.filter_fields[i].set_input(null);}
this.set_sort_options();_r.rb_con.main_title.innerHTML=this.doctype;this.clear_graph();this.current_loaded=null;this.customized_filters=null;this.sc=null;this.has_index=1;this.has_headings=1;for(var i in this.fn_list)this[this.fn_list[i]]=null;this.refresh_filters();}
_r.ReportBuilder.prototype.select_column=function(dt,label,value){if(value==null)value=1;if(this.report_fields_dict[dt+'\1'+label])
this.report_fields_dict[dt+'\1'+label].checked=value;}
_r.ReportBuilder.prototype.set_filter=function(dt,label,value){if(this.filter_fields_dict[dt+'\1'+label])
this.filter_fields_dict[dt+'\1'+label].set_input(value);}
_r.ReportBuilder.prototype.load_criteria=function(criteria_name){this.clear_criteria();if(!this.sc_dict[criteria_name]){alert(criteria_name+' could not be loaded. Please Refresh and try again');}
this.sc=locals['Search Criteria'][this.sc_dict[criteria_name]];var report=this;if(this.sc&&this.sc.report_script)eval(this.sc.report_script);this.large_report=0;if(report.customize_filters){report.customize_filters(this);}
this.refresh_filters();var cl=this.sc.columns.split(',');for(var c=0;c<cl.length;c++){var key=cl[c].split('\1');this.select_column(key[0],key[1],1);}
var fl=eval('var a='+this.sc.filters+';a');for(var n in fl){if(fl[n]){var key=n.split('\1');if(key[1]=='docstatus'){}
this.set_filter(key[0],key[1],fl[n]);}}
this.set_criteria_sel(criteria_name);}
_r.ReportBuilder.prototype.set_criteria_sel=function(criteria_name){_r.rb_con.innerHTML=criteria_name;var sc=locals['Search Criteria'][this.sc_dict[criteria_name]];if(sc&&sc.add_col)
var acl=sc.add_col.split('\n');else
var acl=[];var new_sl=[];for(var i=0;i<acl.length;i++){var tmp=acl[i].split(' AS ');if(tmp[1]){var t=eval(tmp[1]);new_sl[new_sl.length]=[t,"`"+t+"`"];}}
this.set_sort_options(new_sl);if(sc&&sc.sort_by){this.dt.sort_sel.inp.value=sc.sort_by;}
if(sc&&sc.sort_order){sc.sort_order=='ASC'?this.dt.set_asc():this.dt.set_desc();}
if(sc&&sc.page_len){this.dt.page_len_sel.inp.value=sc.page_len;}
this.current_loaded=criteria_name;}
_r.ReportBuilder.prototype.setup_filters=function(){function can_dt_be_submitted(dt){var plist=getchildren('DocPerm',dt,'permissions','DocType');for(var pidx in plist){if(plist[pidx].submit)return 1;}
return 0;}
var me=this;me.make_body();var dt=me.parent_dt?me.parent_dt:me.doctype;me.report_fields=[];me.filter_fields=[];me.report_fields_dict={};me.filter_fields_dict={};var fl=[{'fieldtype':'Data','label':'ID','fieldname':'name','search_index':1,'parent':dt},{'fieldtype':'Data','label':'Created By','fieldname':'owner','search_index':1,'parent':dt},];if(can_dt_be_submitted(dt)){fl[fl.length]={'fieldtype':'Check','label':'Saved','fieldname':'docstatus','search_index':1,'def_filter':1,'parent':dt};fl[fl.length]={'fieldtype':'Check','label':'Submitted','fieldname':'docstatus','search_index':1,'def_filter':1,'parent':dt};fl[fl.length]={'fieldtype':'Check','label':'Cancelled','fieldname':'docstatus','search_index':1,'parent':dt};}
me.make_datatable();me.select_all=$a($a(me.builder_area,'div','',{padding:'8px 0px'}),'button');me.select_all.innerHTML='Select / Unselect All';me.select_all.onclick=function(){var do_select=1;if(me.report_fields[0].checked)do_select=0;for(var i in me.report_fields){me.report_fields[i].checked=do_select};}
me.orig_sort_list=[];if(me.parent_dt){var lab=$a(me.filter_area,'div','filter_dt_head');lab.innerHTML='Filters for '+me.parent_dt;var lab=$a(me.builder_area,'div','builder_dt_head');lab.innerHTML='Select columns for '+me.parent_dt;me.make_filter_fields(fl,me.parent_dt);var fl=[];}
var lab=$a(me.filter_area,'div','filter_dt_head');lab.innerHTML='Filters for '+me.doctype;var lab=$a(me.builder_area,'div','builder_dt_head');lab.innerHTML='Select columns for '+me.doctype;me.make_filter_fields(fl,me.doctype);if(!this.has_primary_filters)$dh(this.pri_filter_fields_area);$ds(me.body);}
_r.ReportBuilder.prototype.refresh_filters=function(){for(var i=0;i<this.filter_fields.length;i++){var f=this.filter_fields[i];if(f.df.filter_hide){$dh(f.wrapper);}
else $ds(f.wrapper);if(f.df.bold){if(f.label_cell)$y(f.label_cell,{fontWeight:'bold'})}
else{if(f.label_cell)$y(f.label_cell,{fontWeight:'normal'})}
if(f.df['report_default'])
f.set_input(f.df['report_default']);if(f.df.in_first_page){f.df.filter_cell.parentNode.removeChild(f.df.filter_cell);this.pri_filter_fields_area.appendChild(f.df.filter_cell);this.has_primary_filters=1;$ds(this.pri_filter_fields_area);}}}
_r.ReportBuilder.prototype.add_filter=function(f){if(this.filter_fields_dict[f.parent+'\1'+f.label]){this.filter_fields_dict[f.parent+'\1'+f.label].df=f;}else{f.custom=1;this.add_field(f,f.parent);}}
_r.ReportBuilder.prototype.add_field=function(f,dt,in_primary){var me=this;var add_field=function(f,dt,parent){var tmp=make_field(f,dt,parent,me,false);tmp.not_in_form=true;tmp.refresh();me.filter_fields[me.filter_fields.length]=tmp;me.filter_fields_dict[f.parent+'\1'+f.label]=tmp;return tmp;}
if(f.in_first_page)in_primary=true;var fparent=this.filter_fields_area;if(in_primary){fparent=this.pri_filter_fields_area;this.has_primary_filters=1;}
if(f.on_top){var cell=document.createElement('div');fparent.insertBefore(cell,fparent.firstChild);$y(cell,{width:'70%'});}else if(f.insert_before){var cell=document.createElement('div');fparent.insertBefore(cell,fparent[f.df.insert_before].filter_cell);$y(cell,{width:'70%'});}
else
var cell=$a(fparent,'div','',{width:'70%'});f.filter_cell=cell;if(f.fieldtype=='Date'){var my_div=$a(cell,'div','',{});var f1=copy_dict(f);f1.label='From '+f1.label;var tmp1=add_field(f1,dt,my_div);tmp1.sql_condition='>=';tmp1.bound='lower';var f2=copy_dict(f);f2.label='To '+f2.label;var tmp2=add_field(f2,dt,my_div);tmp2.sql_condition='<=';tmp2.bound='upper';}else if(in_list(['Currency','Int','Float'],f.fieldtype)){var my_div=$a(cell,'div','',{});var f1=copy_dict(f);f1.label=f1.label+' >=';var tmp1=add_field(f1,dt,my_div);tmp1.sql_condition='>=';tmp1.bound='lower';var f2=copy_dict(f);f2.label=f2.label+' <=';var tmp2=add_field(f2,dt,my_div);tmp2.sql_condition='<=';tmp2.bound='upper';}else{var tmp=add_field(f,dt,cell);}
if(f.fieldname!='docstatus')
me.orig_sort_list[me.orig_sort_list.length]=[f.label,'`tab'+f.parent+'`.`'+f.fieldname+'`'];if(f.def_filter)
tmp.input.checked=true;}
_r.ReportBuilder.prototype.make_filter_fields=function(fl,dt){var me=this;if(page_body.wntoolbar&&page_body.wntoolbar.rb_sel)
page_body.wntoolbar.rb_sel.value=dt;var t1=$a($a(me.builder_area,'div'),'table','builder_tab');this.filter_fields_area=$a(me.filter_area,'div');var dt_fields=fields_list[dt];for(var i=0;i<dt_fields.length;i++){fl[fl.length]=dt_fields[i];}
var sf_list=locals.DocType[dt].search_fields?locals.DocType[dt].search_fields.split(','):[];for(var i in sf_list)sf_list[i]=strip(sf_list[i]);this.ftab_cidx=1;var bidx=2;for(var i=0;i<fl.length;i++){var f=fl[i];if(f&&(cint(f.search_index)||cint(f.in_filter))){me.add_field(f,dt,in_list(sf_list,f.fieldname));}
if(f&&!in_list(no_value_fields,f.fieldtype)&&f.fieldname!='docstatus'&&(!f.report_hide)){if(bidx==2){var br=t1.insertRow(t1.rows.length);br.insertCell(0);br.insertCell(1);br.insertCell(2);bidx=0;}else{bidx++;}
var div=$a(br.cells[bidx],'div','builder_field');var t2=$a(div,'table');var row=t2.insertRow(0);row.insertCell(0);row.insertCell(1);$w(row,'10%');var chk=$a_input(row.cells[0],'checkbox');$y(chk,{marginRight:'2px',border:'0px'});chk.df=f;if(f.search_index||f.in_search){chk.checked=1;chk.selected_by_default=1;}
me.report_fields.push(chk);me.report_fields_dict[f.parent+'\1'+f.label]=chk;row.cells[1].innerHTML=f.label;row.cells[1].style.fontSize='11px';}}
me.set_sort_options();}
_r.ReportBuilder.prototype.set_sort_options=function(l){var sl=this.orig_sort_list;empty_select(this.dt.sort_sel);if(l)sl=add_lists(l,this.orig_sort_list)
for(var i=0;i<sl.length;i++){this.dt.add_sort_option(sl[i][0],sl[i][1]);}}
_r.ReportBuilder.prototype.make_filters=function(onload){var me=this;if(!locals['DocType'][this.doctype]){$c('webnotes.widgets.form.getdoctype',args={'doctype':this.doctype,'with_parent':1},function(r,rt){if(r.parent_dt)me.parent_dt=r.parent_dt;me.setup_filters();if(onload)onload(me);});}else{for(var key in locals.DocField){var f=locals.DocField[key];if(f.fieldtype=='Table'&&f.options==this.doctype)
this.parent_dt=f.parent;}
me.setup_filters();if(onload)onload(me);}}
_r.ReportBuilder.prototype.reset_report=function(){this.clear_criteria();this.set_filter(this.doctype,'Saved',1);this.set_filter(this.doctype,'Submitted',1);this.set_filter(this.doctype,'Cancelled',0);for(var i=0;i<this.report_fields.length;i++){if(this.report_fields[i].selected_by_default)
this.report_fields[i].checked=1;}
this.dt.clear_all();this.dt.sort_sel.inp.value='ID';this.dt.page_len_sel.inp.value='50';this.dt.set_desc();}
_r.ReportBuilder.prototype.make_datatable=function(){var me=this;this.dt_area=$a(this.mytabs.tabs['Result'].tab_body,'div','finder_dt_area');var clear_area=$a(this.mytabs.tabs['Result'].tab_body,'div');clear_area.style.marginTop='8px';clear_area.style.textAlign='right';this.clear_btn=$a(clear_area,'button');this.clear_btn.innerHTML='Clear Settings';this.clear_btn.onclick=function(){me.reset_report();}
var div=$a(this.mytabs.tabs['Result'].tab_body,'div');div.style.marginTop='8px';var d=$a(div,'div');d.innerHTML='<input type="checkbox" style="border: 0px;"> Show Query';this.show_query=d.childNodes[0];this.show_query.checked=false;this.dt=new _r.DataTable(this.dt_area,'');this.dt.finder=this;this.dt.make_query=function(){var report=me;if(me.current_loaded&&me.sc_dict[me.current_loaded])
var sc=get_local('Search Criteria',me.sc_dict[me.current_loaded]);if(sc)me.dt.search_criteria=sc;else me.dt.search_criteria=null;if(sc&&sc.server_script)me.dt.server_script=sc.server_script;else me.dt.server_script=null;for(var i=0;i<me.fn_list.length;i++){if(me[me.fn_list[i]])me.dt[me.fn_list[i]]=me[me.fn_list[i]];else me.dt[me.fn_list[i]]=null;}
var fl=[];var docstatus_cl=[];var cl=[];var table_name=function(t){return'`tab'+t+'`';}
var dis_filters_list=[];if(sc&&sc.dis_filters)
var dis_filters_list=sc.dis_filters.split('\n');for(var i=0;i<me.report_fields.length;i++){var chk=me.report_fields[i];if(chk.checked){fl[fl.length]=table_name(chk.df.parent)+'.`'+chk.df.fieldname+'`';}}
if(sc&&sc.add_col){var adv_fl=sc.add_col.split('\n');for(var i=0;i<adv_fl.length;i++){fl[fl.length]=adv_fl[i];}}
me.dt.filter_vals={}
add_to_filter=function(k,v,is_select){if(v==null)v='';if(!in_list(keys(me.dt.filter_vals),k)){me.dt.filter_vals[k]=v;return}else{if(is_select)
me.dt.filter_vals[k]+='\n'+v;else
me.dt.filter_vals[k+'1']=v;}}
for(var i=0;i<me.filter_fields.length;i++){var t=me.filter_fields[i];var v=t.get_value?t.get_value():'';if(t.df.fieldtype=='Select'){for(var sel_i=0;sel_i<v.length;sel_i++){if(v[sel_i]){add_to_filter(t.df.fieldname,v[sel_i],1);}}
if(!v.length)add_to_filter(t.df.fieldname,"",1);}else add_to_filter(t.df.fieldname,v);if(!in_list(dis_filters_list,t.df.fieldname)&&!t.df.ignore){if(t.df.fieldname=='docstatus'){if(t.df.label=='Saved'){if(t.get_value())docstatus_cl[docstatus_cl.length]=table_name(t.df.parent)+'.docstatus=0';else cl[cl.length]=table_name(t.df.parent)+'.docstatus!=0';}
else if(t.df.label=='Submitted'){if(t.get_value())docstatus_cl[docstatus_cl.length]=table_name(t.df.parent)+'.docstatus=1';else cl[cl.length]=table_name(t.df.parent)+'.docstatus!=1';}
else if(t.df.label=='Cancelled'){if(t.get_value())docstatus_cl[docstatus_cl.length]=table_name(t.df.parent)+'.docstatus=2';else cl[cl.length]=table_name(t.df.parent)+'.docstatus!=2';}}else{var fn='`'+t.df.fieldname+'`';var v=t.get_value?t.get_value():'';if(v){if(in_list(['Data','Link','Small Text','Text'],t.df.fieldtype)){cl[cl.length]=table_name(t.df.parent)+'.'+fn+' LIKE "'+v+'%"';}else if(t.df.fieldtype=='Select'){var tmp_cl=[];for(var sel_i=0;sel_i<v.length;sel_i++){if(v[sel_i]){tmp_cl[tmp_cl.length]=table_name(t.df.parent)+'.'+fn+' = "'+v[sel_i]+'"';}}
if(tmp_cl.length)cl[cl.length]='('+tmp_cl.join(' OR ')+')';}else{var condition='=';if(t.sql_condition)condition=t.sql_condition;cl[cl.length]=table_name(t.df.parent)+'.'+fn+condition+'"'+v+'"';}}}}}
me.dt.filter_vals.user=user;me.dt.filter_vals.user_email=user_email;this.is_simple=0;if(sc&&sc.custom_query){this.query=repl(sc.custom_query,me.dt.filter_vals);this.is_simple=1;return}
if(docstatus_cl.length)
cl[cl.length]='('+docstatus_cl.join(' OR ')+')';if(sc&&sc.add_cond){var adv_cl=sc.add_cond.split('\n');for(var i=0;i<adv_cl.length;i++){cl[cl.length]=adv_cl[i];}}
if(!fl.length){alert('You must select atleast one column to view');this.query='';return;}
var tn=table_name(me.doctype);if(me.parent_dt){tn=tn+','+table_name(me.parent_dt);cl[cl.length]=table_name(me.doctype)+'.`parent` = '+table_name(me.parent_dt)+'.`name`';}
if(sc&&sc.add_tab){var adv_tl=sc.add_tab.split('\n');tn=tn+','+adv_tl.join(',');}
if(!cl.length)
this.query='SELECT '+fl.join(',\n')+' FROM '+tn
else
this.query='SELECT '+fl.join(',')+' FROM '+tn+' WHERE '+cl.join('\n AND ');if(sc&&sc.group_by){this.query+=' GROUP BY '+sc.group_by;}
this.query=repl(this.query,me.dt.filter_vals)
if(me.show_query.checked){this.show_query=1;}
if(me.current_loaded)this.rep_name=me.current_loaded;else this.rep_name=me.doctype;}}
_r.scroll_head=function(ele){var h=ele.childNodes[0];h.style.top=cint(ele.scrollTop)+'px';}
_r.DataTable=function(html_fieldname,dt,repname,hide_toolbar){var me=this;if(html_fieldname.substr){var html_field=cur_frm.fields_dict[html_fieldname];html_field.onrefresh=function(){if(me.docname!=cur_frm.docname){me.clear_all();me.docname=cur_frm.docname;}}
var parent=html_field.wrapper;datatables[html_fieldname]=this;}else{var parent=html_fieldname;}
this.start_rec=1;this.page_len=50;this.repname=repname;this.dt=dt;this.sort_labels={};this.query='';this.history=[];this.has_index=1;this.has_headings=1;this.levels=[];if(this.dt){var tw=$a(parent,'div');var t=$a(tw,'div','link_type');t.style.cssFloat='right';$h(tw,'14px');t.style.margin='2px 0px';t.style.fontSize='11px';t.onclick=function(){new_doc(me.dt);}
t.innerHTML='New '+this.dt;}
if(!hide_toolbar)this.make_toolbar(parent);this.wrapper=$a(parent,'div','report_tab');$h(this.wrapper,cint(screen.height*0.6)+'px');this.wrapper.onscroll=function(){_r.scroll_head(this);}
this.hwrapper=$a(this.wrapper,'div','report_head_wrapper');this.twrapper=$a(this.wrapper,'div','report_tab_wrapper');this.no_data_tag=$a(this.wrapper,'div','report_no_data');this.no_data_tag.innerHTML='No Records Found';this.fetching_tag=$a(this.wrapper,'div','',{height:'100%',background:'url("images/ui/square_loading.gif") center no-repeat',display:'none'});}
_r.DataTable.prototype.add_icon=function(parent,imgsrc){var i=$a(parent,'img');i.style.padding='2px';i.style.cursor='pointer';i.setAttribute('src','images/icons/'+imgsrc+'.gif');return i;}
_r.DataTable.prototype.make_toolbar=function(parent){var me=this;this.hbar=$a(parent,'div','report_hbar');var ht=make_table(this.hbar,1,2,'100%',['80%','20%'],{verticalAlign:'middle'});var t=make_table($td(ht,0,0),1,13,'',['20px','','20px','','20px','','20px','','80px','100px','20px','80px','50px'],{height:'54px',verticalAlign:'middle'});var cnt=0;var make_btn=function(label,src,onclick,bold){$w($td(t,0,cnt+1),(20+((bold?7:6)*label.length))+'px');var img=$a($td(t,0,cnt+0),'img','');img.src="images/icons/"+src+".gif";var span=$a($td(t,0,cnt+1),'span','link_type',{margin:'0px 8px 0px 4px'});if(bold)$y(span,{fontSize:'14px',fontWeight:'bold'});span.innerHTML=label;span.onclick=onclick;}
make_btn('Refresh','page_refresh',function(){me.start_rec=1;me.run();},1);cnt+=2;make_btn('Export','page_excel',function(){me.do_export();});cnt+=2;make_btn('Print','printer',function(){me.do_print();});cnt+=2;make_btn('Calc','calculator',function(){me.do_calc();});cnt+=2;$td(t,0,cnt).innerHTML='Sort By:';$y($td(t,0,cnt),{textAlign:'right',paddingRight:'4px'});this.sort_sel=new SelectWidget($td(t,0,cnt+1),[],100);this.sort_sel.inp.onchange=function(){me.start_rec=1;me.run();}
this.sort_icon=this.add_icon($td(t,0,cnt+2),'arrow_down');this.sort_order='DESC';this.sort_icon.onclick=function(){if(me.sort_order=='ASC')me.set_desc();else me.set_asc();me.start_rec=1;me.run();}
$td(t,0,cnt+3).innerHTML='Per Page:';$y($td(t,0,cnt+3),{textAlign:'right',paddingRight:'4px'});var s=new SelectWidget($td(t,0,cnt+4),['50','100','500','1000'],70);s.inp.value='50';s.inp.onchange=function(){me.page_len=flt(this.value);}
this.page_len_sel=s;var c1=$td(ht,0,1);c1.style.textAlign='right';var ic=this.add_icon(c1,'resultset_first');ic.onclick=function(){me.start_rec=1;me.run();}
var ic=this.add_icon(c1,'resultset_previous');ic.onclick=function(){if(me.start_rec-me.page_len<=0)return;me.start_rec=me.start_rec-me.page_len;me.run();}
this.has_next=false;var ic=this.add_icon(c1,'resultset_next');ic.onclick=function(){if(!me.has_next)return;me.start_rec=me.start_rec+me.page_len;me.run();}}
_r.DataTable.prototype.set_desc=function(){this.sort_icon.src='images/icons/arrow_down.png';this.sort_order='DESC';}
_r.DataTable.prototype.set_asc=function(icon){this.sort_icon.src='images/icons/arrow_up.png';this.sort_order='ASC';}
_r.DataTable.prototype.add_sort_option=function(label,val){if(!this.sort_labels[this.dt])
this.sort_labels[this.dt]={};this.sort_labels[this.dt][label]=val;var s=this.sort_sel;s.append(label);if(!s.inp.value)s.inp.value=label;}
_r.DataTable.prototype.update_query=function(no_limit){if(this.search_criteria&&this.search_criteria.custom_query){}else{this.query+=NEWLINE
+' ORDER BY '+this.sort_labels[this.dt][sel_val(this.sort_sel)]
+' '+this.sort_order;}
if(no_limit)return;this.query+=' LIMIT '+(this.start_rec-1)+','+this.page_len;if(this.show_query)
alert(this.query);}
_r.DataTable.prototype._get_query=function(no_limit){$dh(this.no_data_tag);this.show_query=0;if(this.make_query)this.make_query();this.update_query(no_limit);}
_r.DataTable.prototype.run=function(){if(this.validate&&!this.validate())
return;if(_r.rb_con.cur_rb){if(_r.rb_con.cur_rb.large_report==1){msgprint("This is a very large report and cannot be shown in the browser as it is likely to make your browser very slow.<br><br>Please click on 'Export' to open in a spreadsheet");return;}
_r.rb_con.cur_rb.mytabs.tabs['Result'].show();}
var me=this;this._get_query();if(this.set_data){this.show_result(this.set_data);this.set_data=null;return;}
$ds(this.fetching_tag);if(isFF)this.clear_all();var args={'query':me.query,'report_name':'_r.DataTable','show_deleted':1,'sc_id':me.search_criteria?me.search_criteria.name:'','filter_values':me.filter_vals?docstring(me.filter_vals):'','roles':'["'+user_roles.join('","')+'"]'}
if(this.is_simple)args.is_simple=1;$c('webnotes.widgets.query_builder.runquery',args,function(r,rt){$dh(me.fetching_tag);me.show_result(r,rt);});}
_r.DataTable.prototype.clear_all=function(){if(this.htab&&this.htab.parentNode){this.htab.parentNode.removeChild(this.htab);delete this.htab;}
if(this.tab&&this.tab.parentNode){this.tab.parentNode.removeChild(this.tab);delete this.tab;}
$dh(this.no_data_tag);if(this.finder)this.finder.clear_graph();}
_r.DataTable.prototype.has_data=function(){if(this.htab&&this.htab.rows.length)return 1;else return 0;}
_r.DataTable.prototype.show_result=function(r,rt){var me=this;this.clear_all();if(this.has_headings){this.htab=$a(this.hwrapper,'table');$y(this.twrapper,{top:'25px',borderTop:'0px'});}
this.tab=$a(this.twrapper,'table');this.colwidths=eval(r.colwidths);this.coltypes=eval(r.coltypes);this.coloptions=eval(r.coloptions);this.colnames=eval(r.colnames);this.rset=eval(r.values);$y(this.tab,{tableLayout:'fixed'});if(this.beforetableprint)this.beforetableprint(this);if(this.rset&&this.rset.length){if(this.has_headings)this.make_head_tab(this.colnames);var start=this.start_rec;for(var vi=0;vi<this.rset.length;vi++){var row=this.tab.insertRow(vi);if(this.has_index){var c0=row.insertCell(0);$w(c0,'30px');$a(c0,'div','',{width:'23px'}).innerHTML=start;}
start++;for(var ci=0;ci<this.rset[vi].length;ci++){this.make_data_cell(vi,ci,this.rset[vi][ci]);}
if(this.afterrowprint){row.data_cells={};row.data={};for(var ci=0;ci<this.colnames.length;ci++){row.data[this.colnames[ci]]=this.rset[vi][ci];row.data_cells[this.colnames[ci]]=row.cells[ci+1];}
this.afterrowprint(row);}}}else{$ds(this.no_data_tag);}
if(this.rset.length&&this.rset.length==this.page_len)this.has_next=true;if(r.style){for(var i=0;i<r.style.length;i++){$yt(this.tab,r.style[i][0],r.style[i][1],r.style[i][2]);}}
if(this.aftertableprint)this.aftertableprint(this.tab);}
_r.DataTable.prototype.get_col_width=function(i){if(this.colwidths&&this.colwidths.length&&this.colwidths[i])
return cint(this.colwidths[i])+'px';else return'100px';}
_r.DataTable.prototype.make_head_tab=function(colnames){var r0=this.htab.insertRow(0);if(this.has_index){var c0=r0.insertCell(0);c0.className='report_head_cell';$w(c0,'30px');$a(c0,'div').innerHTML='Sr';this.total_width=30;}
for(var i=0;i<colnames.length;i++){var w=this.get_col_width(i);this.total_width+=cint(w);var c=r0.insertCell(r0.cells.length);c.className='report_head_cell';if(w)$w(c,w);$a(c,'div').innerHTML=colnames[i];c.val=colnames[i];}
$w(this.htab,this.total_width+'px');$w(this.tab,this.total_width+'px');}
_r.DataTable.prototype.make_data_cell=function(ri,ci,val){var row=this.tab.rows[ri];var c=row.insertCell(row.cells.length);if(row.style.color)
c.style.color=row.style.color;if(row.style.backgroundColor)
c.style.backgroundColor=row.style.backgroundColor;if(row.style.fontWeight)
c.style.fontWeight=row.style.fontWeight;if(row.style.fontSize)
c.style.fontSize=row.style.fontSize;var w=this.get_col_width(ci);if(w)$w(c,w);c.val=val;var me=this;c.div=$a(c,'div','',{width:(cint(w)-7)+'px'});$s(c.div,val,this.coltypes[ci],this.coloptions[ci])}
_r.DataTable.prototype.do_print=function(){this._get_query(true);args={query:this.query,title:this.rep_name?this.rep_name:this.dt,colnames:null,colwidhts:null,coltypes:null,has_index:this.has_index,has_headings:this.has_headings,check_limit:1,is_simple:(this.is_simple?'Yes':''),sc_id:(this.search_criteria?this.search_criteria.name:''),filter_values:docstring(this.filter_vals),finder:this.finder?this.finder:null};new_widget('_p.PrintQuery',function(w){if(!_p.print_query)
_p.print_query=w;_p.print_query.show_dialog(args);},1);}
_r.DataTable.prototype.do_export=function(){this._get_query(true);var me=this;export_query(this.query,function(q){export_csv(q,(me.rep_name?me.rep_name:me.dt),(me.search_criteria?me.search_criteria.name:''),me.is_simple,docstring(me.filter_vals));});}
_r.DataTable.prototype.do_calc=function(){_r.show_calc(this.tab,this.colnames,this.coltypes,1);}
_r.DataTable.prototype.get_col_data=function(colname){var ci=0;if(!this.htab)return[];for(var i=1;i<this.htab.rows[0].cells.length;i++){var hc=this.htab.rows[0].cells[i];if(hc.val==colname){ci=i;break;}}
var ret=[];for(var ri=0;ri<this.tab.rows.length;ri++){ret[ret.length]=this.tab.rows[ri].cells[ci].val;}
return ret;}
_r.DataTable.prototype.get_html=function(){var w=document.createElement('div');w=$a(w,'div');w.style.marginTop='16px';var tab=$a(w,'table');var add_head_style=function(c,w){c.style.fontWeight='bold';c.style.border='1px solid #000';c.style.padding='2px';if(w)$w(c,w);return c;}
var add_cell_style=function(c){c.style.padding='2px';c.style.border='1px solid #000';return c;}
tab.style.borderCollapse='collapse';var hr=tab.insertRow(0);var c0=add_head_style(hr.insertCell(0),'30px');c0.innerHTML='Sr';for(var i=1;i<this.htab.rows[0].cells.length;i++){var hc=this.htab.rows[0].cells[i];var c=add_head_style(hr.insertCell(i),hc.style.width);c.innerHTML=hc.innerHTML;}
for(var ri=0;ri<this.tab.rows.length;ri++){var row=this.tab.rows[ri];var dt_row=tab.insertRow(tab.rows.length);for(var ci=0;ci<row.cells.length;ci++){var c=add_cell_style(dt_row.insertCell(ci));c.innerHTML=row.cells[ci].innerHTML;}}
return w.innerHTML;}
_r.calc_dialog=null;_r.show_calc=function(tab,colnames,coltypes,add_idx){if(!add_idx)add_idx=0;if(!tab||!tab.rows.length){msgprint("No Data");return;}
if(!_r.calc_dialog){var d=new Dialog(400,400,"Calculator")
d.make_body([['Select','Column'],['Data','Sum'],['Data','Average'],['Data','Min'],['Data','Max']])
d.widgets['Sum'].readonly='readonly';d.widgets['Average'].readonly='readonly';d.widgets['Min'].readonly='readonly';d.widgets['Max'].readonly='readonly';d.widgets['Column'].onchange=function(){d.set_calc();}
d.set_calc=function(){var cn=sel_val(this.widgets['Column']);var cidx=0;var sum=0;var avg=0;var minv=null;var maxv=null;for(var i=0;i<this.colnames.length;i++){if(this.colnames[i]==cn){cidx=i+add_idx;break;}}
for(var i=0;i<this.datatab.rows.length;i++){var c=this.datatab.rows[i].cells[cidx];var v=c.div?flt(c.div.innerHTML):flt(c.innerHTML);sum+=v;if(minv==null)minv=v;if(maxv==null)maxv=v;if(v>maxv)maxv=v;if(v<minv)minv=v;}
d.widgets['Sum'].value=fmt_money(sum);d.widgets['Average'].value=fmt_money(sum/this.datatab.rows.length);d.widgets['Min'].value=fmt_money(minv);d.widgets['Max'].value=fmt_money(maxv);_r.calc_dialog=d;}
d.onshow=function(){var cl=[];for(var i in _r.calc_dialog.colnames){if(in_list(['Currency','Int','Float'],_r.calc_dialog.coltypes[i]))
cl.push(_r.calc_dialog.colnames[i]);}
if(!cl.length){this.hide();alert("No Numeric Column");return;}
var s=this.widgets['Column'];empty_select(s);add_sel_options(s,cl);s.inp.value=cl[0];this.set_calc();}
_r.calc_dialog=d;}
_r.calc_dialog.datatab=tab;_r.calc_dialog.colnames=colnames;_r.calc_dialog.coltypes=coltypes;_r.calc_dialog.show();}