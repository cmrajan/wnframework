
var fixh=50;var fixw=182;var toolbarh=24;var select_register=[];var account_id='';var pagewidth=480;var NULL_CHAR='^\5*';var startup_lst=[];var login_file='login.html';var datatables={}
var __sid150;var tinyMCE;var editAreaLoader;var calendar;var Calendar;var GraphViewer;var text_dialog;try{document.execCommand('BackgroundImageCache',false,true);}catch(e){}
var agt=navigator.userAgent.toLowerCase();var appVer=navigator.appVersion.toLowerCase();var is_minor=parseFloat(appVer);var is_major=parseInt(is_minor);var iePos=appVer.indexOf('msie');if(iePos!=-1){is_minor=parseFloat(appVer.substring(iePos+5,appVer.indexOf(';',iePos)))
is_major=parseInt(is_minor);}
var isIE=(iePos!=-1);var isIE6=(isIE&&is_major<=6);var isIE7=(isIE&&is_minor>=7);if(/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){var isFF=1;var ffversion=new Number(RegExp.$1)
if(ffversion>=3)var isFF3=1;else if(ffversion>=2)var isFF2=1;else if(ffversion>=1)var isFF1=1;}
var _history_current;function historyChange(newLocation,historyData){if(window.location.href.search('iwebnotes.com')!=-1)return;var t=newLocation.replace(/\%20/g,' ');t=t.split('~~~');var c=nav_obj.ol[nav_obj.ol.length-1];if(t.length==2){if(c[0]==t[0]&&c[1]==t[1])return;}else{if(c[0]==t[0]&&c[1]==t[1]&&c[2]==t[2])return;}
if(t[0]=='DocType'){_history_current=newLocation;loaddoc(t[1],t[2]);}else if(t[0]=='Report'){_history_current=newLocation;loadreport(t[1],t[2]);}else if(t[0]=='Page'){_history_current=newLocation;loadpage(t[1]);}else if(t[0]=='Application'){_history_current=newLocation;loadapp(t[1]);}};var profile;var session;function startup(){fm=new FloatingMessage();dhtmlHistory.initialize();dhtmlHistory.addListener(historyChange);addEvent('click',function(e,target){if(target.className.substr(0,2)!='cp'){if(grid_click_event)grid_click_event(e,target);for(var i=0;i<popup_list.length;i++){if(popup_list[i]){popup_list[i].hideIfNotClicked(e);show_selects();}}}});addEvent('keydown',function(e,target){if(isIE)var kc=window.event.keyCode;else var kc=e.keyCode;if(grid_selected_cell){grid_selected_cell.grid.cell_keypress(e,kc);}
if(kc==13&&cur_cont&&cur_cont.page&&cur_cont.page.name=='_search'){if(search_page.cur_finder&&search_page.cur_finder.dt&&(!selector.display)&&inList(['Result','Set Filters','Select Columns'],search_page.cur_finder.mytabs.cur_tab.label.innerHTML)){search_page.cur_finder.dt.run();search_page.cur_finder.mytabs.tabs['Result'].show();}}
if(kc==27&&cur_dialog)cur_dialog.hide();});var call_back1=function(r,rt){if(r.exc){msgprint(r.exc);return;}
profile=r.profile
user=r.profile.name;user_fullname=profile.first_name+(r.profile.last_name?(' '+r.profile.last_name):'');user_defaults=profile.defaults;user_roles=profile.roles;user_email=profile.email;sys_defaults=r.sysdefaults;session.startup=r.startup;session.rt=profile.;session.m_rt=r.m_rt;session.nt=r.nt;session.mi=eval(r.mi);session.from_gateway=r.from_gateway;session.n_online=r.n_online;account_id=r.account;session.account_name=r.account_id;home_page=r.home_page;makeui(r,rt);}
var args={};if(get_url_param('sid150')){args.sid150=get_url_param('sid150');__sid150=args.sid150;}
if(get_url_param('dbx'))args['dbx']=get_url_param('dbx');if(get_url_param('__account'))account_id=get_url_param('__account');$c('startup',args,call_back1);window.onscroll=function(){$i('loading_div').style.top=(get_scroll_top()+10)+'px';}}
function get_url_param(name){name=name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");var regexS="[\\?&]"+name+"=([^&#]*)";var regex=new RegExp(regexS);var results=regex.exec(window.location.href);if(results==null)
return"";else
return results[1];}
function loadscript(src,call_back){set_loading();var script=$a('head','script');script.type='text/javascript';script.src=src;script.onload=function(){if(call_back)call_back();hide_loading();}
script.onreadystatechange=function(){if(this.readyState=='complete'||this.readyState=='loaded'){hide_loading();call_back();}}}
var apps=[];var cur_app;var last_app;var frame_adj=0;function Application(app_name){var me=this;this.name=app_name;this.cont=new Container(app_name);this.cont.init();this.cont.has_frame=1;this.cont.onhide=function(){}
this.cont.onshow=function(){if(!this.frame_loaded)
this.body.appendChild(me.frame);this.frame_loaded=1;}
apps[app_name]=this;return this;}
function loadapp(app_name,sub_id){if(apps[app_name]){apps[app_name].cont.show();set_title(app_name);nav_obj.open_notify('Application',app_name,'');cur_page=null;cur_app=apps[app_name];}else{callback=function(r,rt){if(r.exc){msgprint(r.exc);return;}
var app=new Application(app_name);app.frame=document.createElement('iframe');app.frame.className='app_frame';app.frame.app_name=app_name;app.frame.frameBorder=0;args={sid150:r.sid};if(r.dbx)args.dbx=r.dbx;if(r.__account)args.__account=r.__account;nav_obj.open_notify('Application',app_name,'');app.frame.src='http://'+r.url+'/index.cgi?'+makeArgString(args,1);cur_app=app;cur_app.cont.show();set_frame_dims();set_title(app_name);}
var args={'app_name':app_name};if(sub_id)args.sub_id=sub_id;$c("login_app",args,callback);}}
var outUrl="cgi-bin/run.cgi";function checkResponse(r,on_timeout,no_loading,freeze_msg){try{if(r.readyState==4&&r.status==200)return true;else return false;}catch(e){msgprint("error:Request timed out, try again");if(on_timeout)on_timeout();hide_loading();if(freeze_msg)unfreeze();return false;}}
var pending_req=0;function newHttpReq(){if(!isIE)var r=new XMLHttpRequest();else if(window.ActiveXObject)var r=new ActiveXObject("Microsoft.XMLHTTP");return r;}
function $c(command,args,fn,on_timeout,no_loading,freeze_msg){var req=newHttpReq();ret_fn=function(){if(checkResponse(req,on_timeout,no_loading,freeze_msg)){var rtxt=req.responseText;if(!no_loading)hide_loading();rtxt=rtxt.replace(/'\^\\x05\*'/g,'null')
rtxt=rtxt.replace(/"\^\\x05\*"/g,'null')
r=eval("var a="+rtxt+";a")
if(r.exc&&r.__redirect_login){msgprint(r.exc,0,function(){document.location=login_file});return;}
if(freeze_msg)unfreeze();if(r.exc){errprint(r.exc);};if(r.server_messages){msgprint(r.server_messages);};if(r.docs){LocalDB.sync(r.docs);}
if(r.docs1){LocalDB.sync(r.docs1);}
saveAllowed=true;if(fn)fn(r,rtxt);}}
req.onreadystatechange=ret_fn;req.open("POST",outUrl,true);req.setRequestHeader("ENCTYPE","multipart/form-data");req.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");args['cmd']=command;req.send(makeArgString(args));if(!no_loading)set_loading();if(freeze_msg)freeze(freeze_msg,1);}
function $c_obj(doclist,method,arg,call_back,no_loading,freeze_msg){if(doclist.substr){$c('runserverobj',{'doctype':doclist,'method':method,'arg':arg},call_back);}else{$c('runserverobj',{'docs':compress_doclist(doclist),'method':method,'arg':arg},call_back,no_loading,freeze_msg);}}
function $c_graph(img,control_dt,method,arg){img.src=outUrl+'?'+makeArgString({cmd:'get_graph',dt:control_dt,method:method,arg:arg});}
function makeArgString(dict,no_account){var varList=[];if(!no_account){dict['__account']=account_id;if(__sid150)dict['sid150']=__sid150;}
for(key in dict){varList[varList.length]=key+'='+encodeURIComponent(dict[key]);}
return varList.join('&');}
function addEvent(ev,fn){if(isIE){document.attachEvent('on'+ev,function(){fn(window.event,window.event.srcElement);});}else{document.addEventListener(ev,function(e){fn(e,e.target);},true);}}
function empty_select(s){if(s){var tmplen=s.length;for(var i=0;i<tmplen;i++)s.options[0]=null;}}
function sel_val(sel){try{if(sel.selectedIndex<sel.options.length)return sel.options[sel.selectedIndex].value;else return'';}catch(err){return'';}}
function add_sel_options(s,list,sel_val,o_style){for(var i in list){var o=new Option(list[i],list[i],false,(list[i]==sel_val?true:false));if(o_style)$y(o,o_style);s.options[s.options.length]=o}}
function cint(v,def){v=v+'';v=lstrip(v,['0',]);v=parseInt(v);if(isNaN(v))v=def?def:0;return v;}
function validate_email(id){if(strip(id).search("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")==-1)return 0;else return 1;}
function d2h(d){return d.toString(16);}
function h2d(h){return parseInt(h,16);}
function get_darker_shade(col,factor){if(!factor)factor=0.5;if(col.length==3){var r=col[0];var g=col[1];var b=col[2]}
else if(col.length==6){var r=col.substr(0,2);var g=col.substr(2,2);var b=col.substr(4,2)}
else return col;return""+d2h(cint(h2d(r)*factor))+d2h(cint(h2d(g)*factor))+d2h(cint(h2d(b)*factor));}
var $n='\n';var $f_lab='<div style="padding: 4px; color: #888;">Fetching...</div>';var my_title='Home';var title_prefix='';function set_title(t){document.title=(title_prefix?(title_prefix+' - '):'')+t;}
function $a(parent,newtag,className,cs){if(!parent)alert("Error in adding to DOM element:"+newtag+','+className);if(parent.substr)parent=$i(parent);var c=document.createElement(newtag);parent.appendChild(c);if(className)c.className=className;if(cs)$y(c,cs);return c;}
function $a_input(p,in_type,in_name,cs){if(isIE){p.innerHTML=repl('<input type="%(in_type)s" %(in_name)s>',{in_type:in_type,in_name:(in_name?('name="'+in_name+'"'):'')});var o=p.childNodes[0];}else{var o=$a(p,'input');o.setAttribute('type',in_type);if(in_name)o.setAttribute('name',in_name);}
if(cs)$y(o,cs);return o;}
function $dh(d){if(d&&d.substr)d=$i(d);if(d&&d.style.display.toLowerCase()!='none')d.style.display='none';}
function $ds(d){if(d&&d.substr)d=$i(d);if(d&&d.style.display.toLowerCase()!='block')d.style.display='block';}
function $di(d){if(d&&d.substr)d=$i(d);if(d)d.style.display='inline';}
function $i(id){if(!id)return null;if(id&&id.appendChild)return id;return document.getElementById(id);}
function $t(parent,txt){if(parent.substr)parent=$i(parent);return parent.appendChild(document.createTextNode(txt));}
function $y(ele,s){if(ele&&s){for(var i in s)ele.style[i]=s[i];}}
function $yt(tab,r,c,s){var rmin=r;var rmax=r;if(r=='*'){rmin=0;rmax=tab.rows.length-1;}
if(r.search&&r.search('-')!=-1){r=r.split('-');rmin=cint(r[0]);rmax=cint(r[1]);}
var cmin=c;var cmax=c;if(c=='*'){cmin=0;cmax=tab.rows[0].cells.length-1;}
if(c.search&&c.search('-')!=-1){c=c.split('-');rmin=cint(c[0]);rmax=cint(c[1]);}
for(var ri=rmin;ri<=rmax;ri++){for(var ci=cmin;ci<=cmax;ci++)
$y($td(tab,ri,ci),s);}}
function set_style(txt){var se=document.createElement('style');se.type="text/css";if(se.styleSheet){se.styleSheet.cssText=txt;}else{se.appendChild(document.createTextNode(txt));}
document.getElementsByTagName('head')[0].appendChild(se);}
function make_table(parent,nr,nc,table_width,widths,cell_style){var t=$a(parent,'table');t.style.borderCollapse='collapse';if(table_width)t.style.width=table_width;if(cell_style)t.cell_style=cell_style;for(var ri=0;ri<nr;ri++){var r=t.insertRow(ri);for(var ci=0;ci<nc;ci++){var c=r.insertCell(ci);if(ri==0&&widths&&widths[ci]){c.style.width=widths[ci];}
if(cell_style){for(var s in cell_style)c.style[s]=cell_style[s];}}}
t.append_row=function(){return append_row(this);}
return t;}
function append_row(t){var r=t.insertRow(t.rows.length);if(t.rows.length>1){for(var i=0;i<t.rows[0].cells.length;i++){var c=r.insertCell(i);if(t.cell_style){for(var s in t.cell_style)c.style[s]=t.cell_style[s];}}}
return r}
function $td(t,r,c){if(r<0)r=t.rows.length+r;if(c<0)c=t.rows[0].cells.length+c;return t.rows[r].cells[c];}
function $sum(t,cidx){var s=0;if(cidx<1)cidx=t.rows[0].cells.length+cidx;for(var ri=0;ri<t.rows.length;ri++){var c=t.rows[ri].cells[cidx];if(c.div)s+=flt(c.div.innerHTML);else if(c.value)s+=flt(c.value);else s+=flt(c.innerHTML);}
return s;}
function $s(ele,v,ftype,fopt){if(v==null)v='';if(ftype=='Text'||ftype=='Small Text'){ele.innerHTML=v?v.replace(/\n/g,'<br>'):'';}else if(ftype=='Date'){v=dateutil.str_to_user(v);if(v==null)v=''
ele.innerHTML=v;}else if(ftype=='Link'&&fopt){ele.innerHTML='';doc_link(ele,fopt,v);}else if(ftype=='Currency'){ele.style.textAlign='right';ele.innerHTML=fmt_money(v);}else if(ftype=='Int'){ele.style.textAlign='right';ele.innerHTML=v;}else if(ftype=='Check'){if(v)ele.innerHTML='<img src="images/ui/tick.gif">';else ele.innerHTML='';}else{ele.innerHTML=v;}}
function clean_smart_quotes(s){if(s){s=s.replace(/\u2018/g,"'");s=s.replace(/\u2019/g,"'");s=s.replace(/\u201c/g,'"');s=s.replace(/\u201d/g,'"');s=s.replace(/\u2013/g,'-');s=s.replace(/\u2014/g,'--');}
return s;}
function copy_dict(d){var n={};for(var k in d)n[k]=d[k];return n;}
function $p(ele,top,left){ele.style.position='absolute';ele.style.top=top+'px';ele.style.left=left+'px';}
function replace_newlines(t){return t?t.replace(/\n/g,'<br>'):'';}
function cstr(s){if(s==null)return'';return s+'';}
function flt(v,decimals){if(v==null||v=='')return 0;v=(v+'').replace(/,/g,'');v=parseFloat(v);if(isNaN(v))
v=0;if(decimals!=null)
return v.toFixed(decimals);return v;}
function $w(e,w){if(e&&e.style&&w)e.style.width=w;}
function $h(e,h){if(e&&e.style&&h)e.style.height=h;}
function $bg(e,w){if(e&&e.style&&w)e.style.backgroundColor=w;}
function $fg(e,w){if(e&&e.style&&w)e.style.color=w;}
function $pd(e,w){if(e&&e.style&&w)e.style.padding=w;}
function $mg(e,w){if(e&&e.style&&w)e.style.margin=w;}
function $fsize(e,w){if(e&&e.style&&w)e.style.fontSize=w;}
function $op(e,w){if(e&&e.style&&w){set_opacity(e,w);}}
function esc_quotes(s){if(s==null)s='';return s.replace(/'/,"\'");}
function strip(s,chars){s=lstrip(s,chars);s=rstrip(s,chars);return s;}
function lstrip(s,chars){if(!chars)chars=['\n','\t',' '];var first_char=s.substr(0,1);while(in_list(chars,first_char)){s=s.substr(1);first_char=s.substr(0,1);}
return s;}
function rstrip(s,chars){if(!chars)chars=['\n','\t',' '];var last_char=s.substr(s.length-1);while(in_list(chars,last_char)){s=s.substr(0,s.length-1);last_char=s.substr(s.length-1);}
return s;}
function repl_all(s,s1,s2){var idx=s.indexOf(s1);while(idx!=-1){s=s.replace(s1,s2);idx=s.indexOf(s1);}
return s;}
function repl(s,dict){if(s==null)return'';for(key in dict)s=repl_all(s,'%('+key+')s',dict[key]);return s;}
function same_day(d1,d2){if(d1.getFullYear()==d2.getFullYear()&&d1.getMonth()==d2.getMonth()&&d1.getDate()==d2.getDate())return true;else return false;}
var month_list=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];var month_last={1:31,2:28,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31}
var month_list_full=['January','February','March','April','May','June','July','August','September','October','November','December'];function int_to_str(i,len){i=''+i;if(i.length<len)for(c=0;c<(len-i.length);c++)i='0'+i;return i}
function DateFn(){this.str_to_obj=function(d){if(!d)return new Date();if(d.search('-')!=-1){var t=d.split('-');return new Date(t[0],t[1]-1,t[2]);}else if(d.search('/')!=-1){var t=d.split('/');return new Date(t[0],t[1]-1,t[2]);}else{return new Date();}}
this.obj_to_str=function(d){return d.getFullYear()+'-'+int_to_str(d.getMonth()+1,2)+'-'+int_to_str(d.getDate(),2);}
this.obj_to_user=function(d){return dateutil.str_to_user(dateutil.obj_to_str(d));}
this.get_diff=function(d1,d2){return((d1-d2)/86400000);}
this.add_days=function(d,days){d.setTime(d.getTime()+(days*24*60*60*1000));return d}
this.month_start=function(){var d=new Date();return d.getFullYear()+'-'+int_to_str(d.getMonth()+1,2)+'-01';}
this.month_end=function(){var d=new Date();var m=d.getMonth()+1;var y=d.getFullYear();last_date=month_last[m];if(m==2&&(y%4)==0&&((y%100)!=0||(y%400)==0))
last_date=29;return y+'-'+int_to_str(m,2)+'-'+last_date;}
this.str_to_user=function(val,no_time_str){var user_fmt=locals['Control Panel']['Control Panel'].date_format;var time_str='';if(!user_fmt)user_fmt='dd-mm-yyyy';if(val==null||val=='')return null;if(val.search(':')!=-1){var tmp=val.split(' ');if(tmp[1])
time_str=' '+tmp[1];var d=tmp[0];}else{var d=val;}
if(no_time_str)time_str='';d=d.split('-');if(d.length==3){if(user_fmt=='dd-mm-yyyy')
val=d[2]+'-'+d[1]+'-'+d[0]+time_str;else if(user_fmt=='dd/mm/yyyy')
val=d[2]+'/'+d[1]+'/'+d[0]+time_str;else if(user_fmt=='yyyy-mm-dd')
val=d[0]+'-'+d[1]+'-'+d[2]+time_str;else if(user_fmt=='mm/dd/yyyy')
val=d[1]+'/'+d[2]+'/'+d[0]+time_str;else if(user_fmt=='mm-dd-yyyy')
val=d[1]+'-'+d[2]+'-'+d[0]+time_str;}
return val;}
this.full_str=function(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '
+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();}}
var dateutil=new DateFn();var date=dateutil;var reversedate=dateutil.str_to_user;function only_date(val){if(val==null||val=='')return null;if(val.search(':')!=-1){var tmp=val.split(' ');var d=tmp[0].split('-');}else{var d=val.split('-');}
if(d.length==3)
val=d[2]+'-'+d[1]+'-'+d[0];return val;}
function time_to_ampm(v){if(!v){var d=new Date();var t=[d.getHours(),cint(d.getMinutes()/5)*5]}else{var t=v.split(':');}
if(t.length!=2){show_alert('[set_time] Incorect time format');return;}
if(cint(t[0])==0)var ret=['12',t[1],'AM'];else if(cint(t[0])<12)var ret=[cint(t[0])+'',t[1],'AM'];else if(cint(t[0])==12)var ret=['12',t[1],'PM'];else var ret=[(cint(t[0])-12)+'',t[1],'PM'];return ret;}
function time_to_hhmm(hh,mm,am){if(am=='AM'&&hh=='12'){hh='00';}else if(am=='PM'&&hh!='12'){hh=cint(hh)+12;}
return hh+':'+mm;}
function btn_dis(d,tf){d.disabled=tf?true:false;}
function objpos(obj){if(obj.substr)obj=$i(obj);var acc_lefts=0;var acc_tops=0;if(!obj)show_alert("No Object Specified");var co={};while(obj){acc_lefts+=obj.offsetLeft;acc_tops+=obj.offsetTop;if(isIE){if(obj!=window.document.body){acc_tops-=obj.scrollTop;acc_lefts-=obj.scrollLeft;}}else{var op=obj.offsetParent
var scr_obj=obj;while(scr_obj&&(scr_obj!=op)&&(scr_obj!=window.document.body)){acc_tops-=scr_obj.scrollTop;acc_lefts-=scr_obj.scrollLeft;scr_obj=scr_obj.parentNode;}}
obj=obj.offsetParent;}
co.x=acc_lefts,co.y=acc_tops;return co;}
function get_screen_dims(){var d={};d.w=0;d.h=0;if(typeof(window.innerWidth)=='number'){d.w=window.innerWidth;d.h=window.innerHeight;}else if(document.documentElement&&(document.documentElement.clientWidth||document.documentElement.clientHeight)){d.w=document.documentElement.clientWidth;d.h=document.documentElement.clientHeight;}else if(document.body&&(document.body.clientWidth||document.body.clientHeight)){d.w=document.body.clientWidth;d.h=document.body.clientHeight;}
return d}
function get_content_dims(){var d=get_screen_dims();d.h=(d.h-fixh)+'px';d.w=(d.w-fixw-30)+'px';return d;}
function fmt_money(v){if(v==null||v=='')return'0.00';v=(v+'').replace(/,/g,'');v=parseFloat(v);if(isNaN(v)){return'';}else{v=v.toFixed(2);var delimiter=",";amount=v+'';var a=amount.split('.',2)
var d=a[1];var i=parseInt(a[0]);if(isNaN(i)){return'';}
var minus='';if(v<0){minus='-';}
i=Math.abs(i);var n=new String(i);var a=[];while(n.length>3)
{var nn=n.substr(n.length-3);a.unshift(nn);n=n.substr(0,n.length-3);}
if(n.length>0){a.unshift(n);}
n=a.join(delimiter);if(d.length<1){amount=n;}
else{amount=n+'.'+d;}
amount=minus+amount;return amount;}}
function rename_from_local(doc){if(doc.localname){try{var old=locals[doc.doctype][doc.localname];old.parent=null;old.__deleted=1;}catch(e){alert("[rename_from_local] No Document for: "+doc.localname);}
var frm=frms[doc.doctype];if(frm&&frm.opendocs[doc.localname]){local_dt[doc.doctype][doc.name]=local_dt[doc.doctype][doc.localname];local_dt[doc.doctype][doc.localname]=null;rdocs.remove(doc.doctype,doc.localname);rdocs.add(doc.doctype,doc.name,1);frm.cur_section[doc.name]=frm.cur_section[doc.localname];delete frm.cur_section[doc.localname];frm.is_editable[doc.name]=frm.is_editable[doc.localname];delete frm.is_editable[doc.localname];if(frm.attachments[doc.localname]){frm.attachments[doc.name]=frm.attachments[doc.localname];frm.attachments[doc.localname]=null;for(var i in frm.attachments[doc.name]){frm.attachments[doc.name][i].docname=doc.name;}}
if(frm.docname==doc.localname)
frm.docname=doc.name;nav_obj.rename_notify(doc.doctype,doc.localname,doc.name)
frm.opendocs[doc.localname]=false;frm.opendocs[doc.name]=true;}
if(calendar&&calendar.has_event[doc.localname])
calendar.has_event[doc.localname]=false;if(todo&&todo.docs[doc.localname]){todo.docs[doc.name]=todo.docs[doc.localname];todo.docs[doc.name].docname=doc.name;todo.docs[doc.localname]=null;}
delete doc.localname;}}
function keys(obj){var mykeys=[];for(key in obj)mykeys[mykeys.length]=key;return mykeys;}
function values(obj){var myvalues=[];for(key in obj)myvalues[myvalues.length]=obj[key];return myvalues;}
function seval(s){return eval('var a='+s+';a');}
function in_list(list,item){for(var i=0;i<list.length;i++){if(list[i]==item)return true;}
return false;}
function has_common(list1,list2){if(!list1||!list2)return false;for(var i=0;i<list1.length;i++){if(in_list(list2,list1[i]))return true;}
return false;}
var inList=in_list;function add_lists(l1,l2){var l=[];for(var k in l1)l[l.length]=l1[k];for(var k in l2)l[l.length]=l2[k];return l;}
function docstring(obj){var l=[];for(key in obj){var v=obj[key];if(v!=null){if(typeof(v)==typeof(1)){l[l.length]="'"+key+"':"+(v+'');}else{v=v+'';l[l.length]="'"+key+"':'"+v.replace(/'/g,"\\'").replace(/\n/g,"\\n")+"'";}}}
return"{"+l.join(',')+'}';}
function compress_doclist(list){var kl={};var vl=[];var flx={};for(var i=0;i<list.length;i++){var o=list[i];var fl=[];if(!kl[o.doctype]){var tfl=['doctype','name','docstatus','owner','parent','parentfield','parenttype','idx','creation','modified','modified_by','__islocal','__deleted','__newname','__modified'];var fl=['doctype','name','docstatus','owner','parent','parentfield','parenttype','idx','creation','modified','modified_by','__islocal','__deleted','__newname','__modified'];for(key in fields[o.doctype]){if((!in_list(fl,key))&&(!in_list(no_value_fields,fields[o.doctype][key].fieldtype))){fl[fl.length]=key;tfl[tfl.length]=key.replace(/'/g,"\\'").replace(/\n/g,"\\n");}}
flx[o.doctype]=fl;kl[o.doctype]="['"+tfl.join("', '")+"']";}
var nl=[];var fl=flx[o.doctype];for(var j=0;j<fl.length;j++){var v=o[fl[j]];if(v==null)
v=NULL_CHAR;if(typeof(v)==typeof(1)){nl[nl.length]=v+'';}else{v=v+'';nl[nl.length]="'"+v.replace(/'/g,"\\'").replace(/\n/g,"\\n")+"'";}}
vl[vl.length]='['+nl.join(', ')+']';}
var sk=[];var kls=[];for(key in kl)kls[kls.length]="'"+key+"':"+kl[key];var kls='{'+kls.join(',')+'}';var vl='['+vl.join(',')+']';return"{'_vl':"+vl+",'_kl':"+kls+"}";}
function expand_doclist(docs){var l=[];for(var i=0;i<docs._vl.length;i++)
l[l.length]=zip(docs._kl[docs._vl[i][0]],docs._vl[i]);return l;}
function zip(k,v){var obj={};for(var i=0;i<k.length;i++){obj[k[i]]=v[i];}
return obj;}
function ie_refresh(e){$dh(e);$ds(e);}
function Layout(parent,width){if(parent&&parent.substr){parent=$i(parent);}
if(parent)
this.wrapper=$a(parent,'div','layoutDiv');else{this.wrapper=document.createElement('div')
this.wrapper.className='layoutDiv';}
$w(this.wrapper,width?width:(pagewidth+'px'));this.width=this.wrapper.style.width;this.myrows=[];}
Layout.prototype.addrow=function(){this.cur_row=new LayoutRow(this,this.wrapper);this.myrows[this.myrows.length]=this.cur_row;return this.cur_row}
Layout.prototype.addsubrow=function(){this.cur_row=new LayoutRow(this,this.cur_row.wrapper);this.myrows[this.myrows.length]=this.cur_row;return this.cur_row}
Layout.prototype.addcell=function(width){return this.cur_row.addCell(width);}
Layout.prototype.setcolour=function(col){$bg(cc,col);}
Layout.prototype.show=function(){$ds(this.wrapper);}
Layout.prototype.hide=function(){$dh(this.wrapper);}
Layout.prototype.close_borders=function(){if(this.with_border){this.myrows[this.myrows.length-1].wrapper.style.borderBottom='1px solid #000';}}
function LayoutRow(layout,parent){this.layout=layout;this.wrapper=$a(parent,'div','layout_row');this.sub_wrapper=$a(this.wrapper,'div');if(layout.with_border){this.wrapper.style.border='1px solid #000';this.wrapper.style.borderBottom='0px';}
this.header=$a(this.sub_wrapper,'div');this.body=$a(this.sub_wrapper,'div');this.table=$a(this.body,'table','layout_row_table');this.row=this.table.insertRow(0);this.mycells=[];}
LayoutRow.prototype.hide=function(){$dh(this.wrapper);}
LayoutRow.prototype.show=function(){$ds(this.wrapper);}
LayoutRow.prototype.addCell=function(wid){var lc=new LayoutCell(this.layout,this,wid);this.mycells[this.mycells.length]=lc;return lc;}
function LayoutCell(layout,layoutRow,width){if(width){var w=width+'';if(w.substr(w.length-2,2)!='px'){if(w.substr(w.length-1,1)!="%"){width=width+'%'};}}
this.width=width;this.layout=layout;var cidx=layoutRow.row.cells.length;this.cell=layoutRow.row.insertCell(cidx);this.cell.style.verticalAlign='top';if(width)
this.cell.style.width=width;var h=$a(this.cell,'div');this.wrapper=$a(this.cell,'div','',{padding:'8px'});layout.cur_cell=this.wrapper;layout.cur_cell.header=h;}
LayoutCell.prototype.show=function(){$ds(this.wrapper);}
LayoutCell.prototype.hide=function(){$dh(this.wrapper);}
var Finder;function ReportPage(parent){var me=this;this.finders={};var div=$a(parent,'div','',{margin:'0px 8px'});var htab=make_table($a(div,'div','',{padding:'4px',backgroundColor:'#DDD'}),1,2,'100%',['80%','20%']);this.main_title=$a($td(htab,0,0),'h2','',{margin:'0px 4px',display:'inline'});$y($td(htab,0,1),{textAlign:'right'});this.close_btn=$a($a($td(htab,0,1),'div','',{padding:'2px',margin:'0px'}),'img','',{cursor:'pointer'});this.close_btn.src="images/icons/close.gif";this.close_btn.onclick=function(){nav_obj.show_last_open();}
this.button_area2=$a($td(htab,0,1),'div',{marginTop:'8px'});var htab=make_table($a(div,'div','',{padding:'4px'}),1,2,'100%',['80%','20%']);this.button_area=$a($td(htab,0,0),'div');this.button_area2=$a($td(htab,0,1),'div',{marginTop:'8px'});$y($td(htab,0,1),{textAlign:'right'});if(has_common(['Administrator','System Manager'],user_roles)){var savebtn=$a(this.button_area2,'span','link_type',{marginRight:'8px'});savebtn.innerHTML='Save';savebtn.onclick=function(){if(me.cur_finder)me.cur_finder.save_criteria();};var advancedbtn=$a(this.button_area2,'span','link_type');advancedbtn.innerHTML='Advanced';advancedbtn.onclick=function(){if(me.cur_finder){if(!me.cur_finder.current_loaded){msgprint("error:You must save the report before you can set Advanced features");return;}
loaddoc('Search Criteria',me.cur_finder.sc_dict[me.cur_finder.current_loaded]);}};}
var runbtn=$a(this.button_area,'button');runbtn.innerHTML='Run'.bold();runbtn.onclick=function(){if(me.cur_finder){me.cur_finder.dt.start_rec=1;me.cur_finder.dt.run();}}
$dh(this.button_area);this.finder_area=$a(parent,'div');this.set_dt=function(dt,onload){$dh(me.home_area);$ds(me.finder_area);$ds(me.button_area);my_onload=function(f){me.cur_finder=f;me.cur_finder.mytabs.tabs['Result'].show();if(onload)onload(f);}
if(me.cur_finder)
me.cur_finder.hide();if(me.finders[dt]){me.finders[dt].show(my_onload);}else{me.finders[dt]=new Finder(me.finder_area,dt,my_onload);}}}
function loadreport(dt,rep_name,onload,menuitem){var cb2=function(){_loadreport(dt,rep_name,onload,menuitem);}
if(Finder){cb2();}
else loadscript('js/widgets/report_table.js',cb2);}
function _loadreport(dt,rep_name,onload,menuitem){search_page.set_dt(dt,function(finder){if(rep_name){var t=finder.current_loaded;finder.load_criteria(rep_name);if(onload)onload(finder);if(menuitem)finder.menuitems[rep_name]=menuitem;if((finder.dt)&&(!finder.dt.has_data()||finder.current_loaded!=t))finder.dt.run();if(finder.menuitems[rep_name])finder.menuitems[rep_name].show_selected();}
nav_obj.open_notify('Report',dt,rep_name);});if(cur_page!='_search')loadpage('_search');}
function show_data_table(html_field,user_query,ht){if(html_field.substr){html_field=get_field(cur_frm.doctype,html_field,cur_frm.docname);}
html_field.options=$f_lab;refresh_field(html_field.label);var show_sql_data_result=function(r,rt){html_field.options=get_SQL_table_HTML(r.values,eval(r.colnames),eval(r.coltypes),eval(r.coloptions),'',0,eval(r.colwidths),ht);refresh_field(html_field.label);}
if(user_query){$c('runquery',{'query':user_query,'report_name':'DataTable','defaults':pack_defaults(),'roles':'["'+user_roles.join('","')+'"]'},show_sql_data_result);}}
function scroll_head(ele){var h=ele.childNodes[0];h.style.top=cint(ele.scrollTop)+'px';}
function get_SQL_table_HTML(rset,colnames,coltypes,coloptions,ttype,start,colwidths,ht){var get_width=function(i){if(colwidths&&colwidths[i])var w=cint(colwidths[i])+'px';else var w='100px';return w;}
var total_width=30;for(var i=0;i<colnames.length;i++){total_width+=cint(get_width(i));}
if(ht)var ht_style='height: '+cint(ht)+'px;'
else ht_style='';var h='<div class="report_tab" style="'+ht_style+'" onscroll="scroll_head(this)">';if(rset.length){h+='<div class="report_head_wrapper"><table style="width:'+total_width+'px;">';h+='<tr><td class="report_head_cell" style="width: 30px;"><div>Sr</div></td>';for(var i=0;i<colnames.length;i++){h+='<td class="report_head_cell" style="width: '+get_width(i)+';"><div>'+colnames[i]+'</div></td>';}
h+='</tr>';h+='</table></div>';if(!start)start=0;h+='<div class="report_tab_wrapper" style="top: 24px;"><table style="width:'+total_width+'px;">';for(var vi=0;vi<rset.length;vi++){start++;if(vi%2)var bc='background-color: #DEF;';else var bc='';var style=' style="'+bc+' width: 30px"';if(rset[vi]){h+='<tr><td'+style+'>'+start+'</td>';for(var ci=0;ci<rset[vi].length;ci++){var style=' style="width:'+get_width(ci)+';'+bc+'"';if(coltypes[ci]=='Link'){if(ttype=='Selector')
v='<a href = \'javascript:setlinkvalue("'+rset[vi][ci]+'")\'>'+rset[vi][ci]+'</a>';else
v='<a href = "javascript:loaddoc('+"'"+coloptions[ci]+"','"+rset[vi][ci]+"'"+')">'+rset[vi][ci]+'</a>';}else if(coltypes[ci]=='Date'){v=dateutil.str_to_user(rset[vi][ci]);if(v==null)v='';}else if(coltypes[ci]=='Currency'){v=fmt_money(rset[vi][ci]);if(v==null)v='';}else{v=rset[vi][ci];}
h+='<td'+style+'><div>'+v+'</div></td>';}
h+='</tr>';}}
h+='</table></div>';}else{h+='<div style="margin: 20px; text-align: center;">No Records Found</div>';}
return h;}
function make_rounded(ele,corners){if(!corners)corners=[1,1,1,1];if(corners[0])$a(ele,'div','rctl');if(corners[1]){var tmp=$a(ele,'div','rctr');}
if(corners[2]){var tmp=$a(ele,'div','rcbr');}
if(corners[3]){var tmp=$a(ele,'div','rcbl');}}
function addImg(parent,src,cls,w,h,opt_id){var extn=src.split('.');extn=extn[1];if(isIE&&(extn.toLowerCase()=='png')){var sp=$a(parent,'span',cls);if(opt_id)opt_id=' id="'+opt_id+'" ';else opt_id='';var newhtml="<span class=\""+cls+"\" style=\"width: "+w+"; height: "+h+"; filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'"+src+"\', sizingMethod='scale');\""+opt_id+"></span>";sp.outerHTML=newhtml;return sp;}else{var im=$a(parent,'img',cls);im.src=src;return im;}}
var cur_dialog;var top_index=91;function Dialog(w,h,title,content){this.wrapper=$a('dialogs','div','dialog_wrapper');this.w=w;this.h=h;$w(this.wrapper,w+'px');this.head=$a(this.wrapper,'div','dialog_head');this.body=$a(this.wrapper,'div','dialog_body');this.make_head(title);if(content)this.make_body(content);this.onshow='';this.oncancel='';this.display=false;var me=this;}
Dialog.prototype.make_head=function(title){var t=make_table(this.head,1,2,'100%',['100%','16px'],{padding:'2px'});$y($td(t,0,0),{paddingLeft:'16px',fontWeight:'bold',fontSize:'14px',textAlign:'center'});$y($td(t,0,1),{textAlign:'right'});var img=$a($td(t,0,01),'img','',{cursor:'pointer'});img.src='images/icons/close.gif';this.title_text=$td(t,0,0);if(!title)title='';this.title_text.innerHTML=title;var me=this;img.onclick=function(){if(me.oncancel)me.oncancel();me.hide();}
this.cancel_img=img;}
Dialog.prototype.show=function(){freeze();var d=get_screen_dims();this.wrapper.style.left=((d.w-this.w)/2)+'px';this.wrapper.style.top=(get_scroll_top()+((d.h-this.h)/2))+'px';top_index++;$y(this.wrapper,{zIndex:top_index});$ds(this.wrapper);this.display=true;cur_dialog=this;if(this.onshow)this.onshow();}
Dialog.prototype.hide=function(){var me=this;unfreeze();if(this.onhide)this.onhide();$dh(this.wrapper);this.display=false;cur_dialog=null;}
Dialog.prototype.set_title=function(title){if(!title)title='';this.title_text.innerHTML=title.bold();}
Dialog.prototype.make_body=function(content){this.rows={};this.widgets={};for(var i in content)this.make_row(content[i]);}
Dialog.prototype.make_row=function(d){var me=this;this.rows[d[1]]=$a(this.body,'div','dialog_row');var row=this.rows[d[1]];if(d[0]!='HTML'){var t=make_table(row,1,2,'100%',['30%','70%']);row.tab=t;var c1=$td(t,0,0);var c2=$td(t,0,1);if(d[0]!='Check'&&d[0]!='Button')
$t(c1,d[1]);}
if(d[0]=='HTML'){if(d[2])row.innerHTML=d[2];this.widgets[d[1]]=row;}else if(d[0]=='Check'){var i=$a_input(c2,'checkbox','',{width:'20px'});c1.innerHTML=d[1];this.widgets[d[1]]=i;}else if(d[0]=='Data'){c1.innerHTML=d[1];c2.style.overflow='auto';this.widgets[d[1]]=$a(c2,'input');if(d[2])$a(c2,'div','comment').innerHTML=d[2];}else if(d[0]=='Password'){c1.innerHTML=d[1];c2.style.overflow='auto';this.widgets[d[1]]=$a_input(c2,'password');if(d[3])$a(c2,'div','comment').innerHTML=d[3];}else if(d[0]=='Select'){c1.innerHTML=d[1];this.widgets[d[1]]=$a(c2,'select');if(d[2])$a(c2,'div','comment').innerHTML=d[2];}else if(d[0]=='Text'){c1.innerHTML=d[1];c2.style.overflow='auto';this.widgets[d[1]]=$a(c2,'textarea');if(d[2])$a(c2,'div','comment').innerHTML=d[2];}else if(d[0]=='Button'){c2.style.height='32px';c2.style.textAlign='right';var b=$a(c2,'button');b.innerHTML=d[1];b.dialog=me;if(d[2]){b._onclick=d[2];b.onclick=function(){this._onclick(me);}}
this.widgets[d[1]]=b;}}
function hide_selects(){if(!isIE6)return;$dh('form_newsel');for(var i=0;i<select_register.length;i++){select_register[i].style.visibility='hidden';}}
function show_selects(){if(!isIE6)return;$ds('form_newsel');for(var i=0;i<select_register.length;i++){select_register[i].style.visibility='visible';}}
var fcount=0;var frozen=0;function get_scroll_top(){var st=0;if(document.documentElement&&document.documentElement.scrollTop)
st=document.documentElement.scrollTop;else if(document.body&&document.body.scrollTop)
st=document.body.scrollTop;return st;}
function set_loading(){var d=$i('loading_div')
if(!d)return;d.style.top=(get_scroll_top()+10)+'px';$ds(d);pending_req++;}
function hide_loading(){var d=$i('loading_div')
if(!d)return;pending_req--;if(!pending_req)$dh(d);}
var msg_dialog;function msgprint(msg,static,callback){if(!msg_dialog){msg_dialog=new Dialog(300,200,"Message");msg_dialog.make_body([['HTML','Msg'],])
msg_dialog.onhide=function(){msg_dialog.msg_area.innerHTML='';$dh(msg_dialog.msg_icon);if(msg_dialog.custom_onhide)msg_dialog.custom_onhide();}
var t=make_table(msg_dialog.rows['Msg'],1,2,'100%',['20px','250px'],{padding:'2px',verticalAlign:'Top'});msg_dialog.msg_area=$td(t,0,1);msg_dialog.msg_icon=$a($td(t,0,0),'img');}
if(!msg_dialog.display)msg_dialog.show();var has_msg=msg_dialog.msg_area.innerHTML?1:0;var m=$a(msg_dialog.msg_area,'div','');if(has_msg)$y(m,{marginTop:'4px'});$dh(msg_dialog.msg_icon);if(msg.substr(0,6).toLowerCase()=='error:'){msg_dialog.msg_icon.src='images/icons/error.gif';$di(msg_dialog.msg_icon);msg=msg.substr(6);}else if(msg.substr(0,8).toLowerCase()=='message:'){msg_dialog.msg_icon.src='images/icons/application.gif';$di(msg_dialog.msg_icon);msg=msg.substr(8);}else if(msg.substr(0,3).toLowerCase()=='ok:'){msg_dialog.msg_icon.src='images/icons/accept.gif';$di(msg_dialog.msg_icon);msg=msg.substr(3);}
m.innerHTML=replace_newlines(msg);msg_dialog.custom_onhide=callback;}
function freeze(msg,do_freeze){if(msg){var div=$i('dialog_message');var d=get_screen_dims();div.style.left=((d.w-250)/2)+'px';div.style.top=(get_scroll_top()+200)+'px';div.innerHTML='<div style="font-size:16px; color: #444; font-weight: bold; text-align: center;">'+msg+'</div>';$ds(div);}
hide_selects();$ds($i('dialog_back'));$h($i('dialog_back'),document.body.offsetHeight+'px');fcount++;frozen=1;}
function unfreeze(){$dh($i('dialog_message'));if(!fcount)return;fcount--;if(!fcount){$dh($i('dialog_back'));show_selects();frozen=0;}}
function FloatingMessage(){if($i('fm_cancel')){$i('fm_cancel').onclick=function(){$dh($i('floating_message'));}
this.show=function(content){$i('fm_content').innerHTML=content;$ds($i('floating_message'));}}}
var err_console;var err_list=[];function errprint(t){err_list[err_list.length]=('<pre style="font-family: Courier, Fixed; font-size: 11px; border-bottom: 1px solid #AAA; overflow: auto; width: 90%;">'+t+'</pre>');}
function show_errors(){msgprint(err_list.join('\n'));}
function submit_error(e){if(isIE){var t='Explorer: '+e+'\n'+e.description;}else{var t='Mozilla: '+e.toString()+'\n'+e.message+'\nLine Number:'+e.lineNumber;}
$c('client_err_log',args={'error':t});errprint(e+'\nLine Number:'+e.lineNumber+'\nStack:'+e.stack);}
function setup_err_console(){err_console=new Dialog(640,480,'Error Console')
err_console.make_body([['HTML','Error List'],['Button','Ok'],['Button','Clear']]);err_console.widgets['Ok'].onclick=function(){err_console.hide();}
err_console.widgets['Clear'].onclick=function(){err_list=[];err_console.rows['Error List'].innerHTML='';}
err_console.onshow=function(){about_dialog.hide();err_console.rows['Error List'].innerHTML='<div style="padding: 16px; height: 360px; width: 90%; overflow: auto;">'
+err_list.join('<div style="height: 10px; margin-bottom: 10px; border-bottom: 1px solid #AAA"></div>')+'</div>';}}
startup_lst[startup_lst.length]=setup_err_console;function show_alert(m){fm.show(m);}
var cur_cont='';var containers=[];function Container(name){}
Container.prototype.init=function(){this.wrapper=$a(cont_area,'div','container_div');if(isFF){$dh(this.wrapper);$y(this.wrapper,{overflow:'hidden'});}
this.head=$a(this.wrapper,'div','container_head');this.body=$a(this.wrapper,'div','container_body');if(this.oninit)this.oninit();}
Container.prototype.show=function(){if(this.onshow)this.onshow();if(cur_cont)cur_cont.hide();cur_cont=this;if(this.wrapper.style.display.toLowerCase()=='none'){$ds(this.wrapper);return;}
if(isFF&&this.has_frame){$y(this.wrapper,{height:null})}else{$ds(this.wrapper);}}
Container.prototype.hide=function(){if(this.onhide)this.onhide();if(isFF&&this.has_frame){$y(this.wrapper,{height:'0px'})}else{$dh(this.wrapper);}
hide_autosuggest();cur_cont='';}
function make_tbar_link(parent,label,fn,icon,isactive){var div=$a(parent,'div','',{cursor:'pointer'});var t=make_table(div,1,2,'90%',['20px',null]);var img=$a($td(t,0,0),'img');img.src='images/icons/'+icon;var l=$a($td(t,0,1),'span','link_type');l.style.fontSize='11px';l.innerHTML=label;div.onclick=fn;div.show=function(){$ds(this);}
div.hide=function(){$dh(this);}
$td(t,0,0).isactive=isactive;$td(t,0,1).isactive=isactive;l.isactive=isactive;div.isactive=isactive;return div;}
function Tool_Bar(parent,bottom_rounded,in_grid,btn_col){this.body=$a(parent,'div','tbar_body');this.buttons={};this.btn_col=btn_col;this.in_grid=in_grid;if(bottom_rounded){make_rounded(this.body,[0,0,1,1]);}
this.hide=function(){$dh(this.body)}
this.show=function(){$ds(this.body)}}
Tool_Bar.prototype.make_button=function(name,onclick,imagesrc,w,bg,border){var btn=$a(this.body,'div');btn.my_class='tbar_button';if(!w)w=60;if(bg)$bg(btn,bg);if(border)$b(btn);$w(btn,w+'px');if(imagesrc){var t=$a(btn,'table');var r=t.insertRow(0);r.insertCell(0);r.insertCell(1);$w(r.cells[0],'20px');btn.img=$a(r.cells[0],'img');btn.img.src='images/icons/'+imagesrc;btn.my_class='tbar_imgbutton';r.cells[1].innerHTML=name;if(this.btn_col)
r.cells[1].style.color=this.btn_col;btn.img.btn=btn;btn.img.isactive=this.in_grid;r.cells[0].isactive=this.in_grid;r.cells[1].isactive=this.in_grid;}else{btn.innerHTML=name;}
btn.className=btn.my_class;btn.isactive=this.in_grid;btn.user_onclick=onclick;btn.onclick=function(){if(!this.is_disabled){this.user_onclick(this);}};btn.set_disabled=function(){this.className=this.my_class+' tbar_btn_disabled';this.is_disabled=true;}
btn.set_enabled=function(){this.className=this.my_class;this.is_disabled=false;}
btn.onmouseover=function(){if(!this.is_disabled){this.className=this.my_class+' tbar_btn_over';}}
btn.onmouseout=function(){if(!this.is_disabled){this.className=this.my_class;}}
btn.onmousedown=function(){if(!this.is_disabled){this.className=this.my_class+' tbar_btn_down';}}
btn.onmouseup=function(){if(!this.is_disabled){this.className=this.my_class+' tbar_btn_over';}}
btn.hide=function(){$dh(this);}
btn.show=function(){$ds(this);}
if(btn.img)btn.img.onclick=function(){if(!btn.is_disabled)this.btn.user_onclick(btn);}
this.buttons[name]=btn;return btn;}
function execJS(node)
{var bSaf=(navigator.userAgent.indexOf('Safari')!=-1);var bOpera=(navigator.userAgent.indexOf('Opera')!=-1);var bMoz=(navigator.appName=='Netscape');if(!node)return;var st=node.getElementsByTagName('SCRIPT');var strExec;for(var i=0;i<st.length;i++){if(bSaf){strExec=st[i].innerHTML;st[i].innerHTML="";}else if(bOpera){strExec=st[i].text;st[i].text="";}else if(bMoz){strExec=st[i].textContent;st[i].textContent="";}else{strExec=st[i].text;st[i].text="";}
try{var x=document.createElement("script");x.type="text/javascript";if((bSaf)||(bOpera)||(bMoz))
x.innerHTML=strExec;else x.text=strExec;document.getElementsByTagName("head")[0].appendChild(x);}catch(e){alert(e);}}}
function set_message(t){byId('messages').innerHTML=t;}
var known={0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen',20:'twenty',30:'thirty',40:'forty',50:'fifty',60:'sixty',70:'seventy',80:'eighty',90:'ninety'}
function in_words(n){n=cint(n)
if(known[n])return known[n];var bestguess=n+'';var remainder=0
if(n<=20)
alert('Error while converting to words');else if(n<100){return in_words(Math.floor(n/10)*10)+'-'+in_words(n%10);}else if(n<1000){bestguess=in_words(Math.floor(n/100))+' '+'hundred';remainder=n%100;}else if(n<100000){bestguess=in_words(Math.floor(n/1000))+' '+'thousand';remainder=n%1000;}else if(n<10000000){bestguess=in_words(Math.floor(n/100000))+' '+'lakh';remainder=n%100000;}else{bestguess=in_words(Math.floor(n/10000000))+' '+'crore'
remainder=n%10000000}
if(remainder){if(remainder>=100)comma=','
else comma=''
return bestguess+comma+' '+in_words(remainder);}else{return bestguess;}}
var cur_autosug;function hide_autosuggest(){if(cur_autosug)cur_autosug.clearSuggestions();}
var bsn;if(typeof(bsn)=="undefined")_b=bsn={};if(typeof(_b.Autosuggest)=="undefined")_b.Autosuggest={};else alert("Autosuggest is already set!");_b.AutoSuggest=function(id,param)
{this.fld=$i(id);if(!this.fld){return 0;alert('AutoSuggest: No ID');}
this.sInp="";this.nInpC=0;this.aSug=[];this.iHigh=0;this.oP=param?param:{};var k,def={minchars:1,meth:"get",varname:"input",className:"autosuggest",timeout:5000,delay:1000,offsety:-5,shownoresults:true,noresults:"No results!",maxheight:250,cache:true,maxentries:25};for(k in def)
{if(typeof(this.oP[k])!=typeof(def[k]))
this.oP[k]=def[k];}
var p=this;this.fld.onkeypress=function(ev){if(!(text_dialog&&text_dialog.display)&&!selector.display)return p.onKeyPress(ev);};this.fld.onkeyup=function(ev){if(!(text_dialog&&text_dialog.display)&&!selector.display)return p.onKeyUp(ev);};this.fld.setAttribute("autocomplete","off");};_b.AutoSuggest.prototype.onKeyPress=function(ev)
{var key=(window.event)?window.event.keyCode:ev.keyCode;var RETURN=13;var TAB=9;var ESC=27;var bubble=1;switch(key)
{case TAB:this.setHighlightedValue();bubble=0;break;case RETURN:this.setHighlightedValue();bubble=0;break;case ESC:this.clearSuggestions();break;}
return bubble;};_b.AutoSuggest.prototype.onKeyUp=function(ev)
{var key=(window.event)?window.event.keyCode:ev.keyCode;var ARRUP=38;var ARRDN=40;var bubble=1;switch(key)
{case ARRUP:this.changeHighlight(key);bubble=0;break;case ARRDN:this.changeHighlight(key);bubble=0;break;default:this.getSuggestions(this.fld.value);}
return bubble;};_b.AutoSuggest.prototype.getSuggestions=function(val)
{if(val==this.sInp)return 0;if(this.body&&this.body.parentNode)
this.body.parentNode.removeChild(this.body);this.sInp=val;if(val.length<this.oP.minchars)
{this.aSug=[];this.nInpC=val.length;return 0;}
var ol=this.nInpC;this.nInpC=val.length?val.length:0;var l=this.aSug.length;if(this.nInpC>ol&&l&&l<this.oP.maxentries&&this.oP.cache)
{var arr=[];for(var i=0;i<l;i++)
{if(this.aSug[i].value.substr(0,val.length).toLowerCase()==val.toLowerCase())
arr.push(this.aSug[i]);}
this.aSug=arr;this.createList(this.aSug);return false;}
else
{var pointer=this;var input=this.sInp;clearTimeout(this.ajID);this.ajID=setTimeout(function(){pointer.doAjaxRequest(input)},this.oP.delay);}
return false;};_b.AutoSuggest.prototype.doAjaxRequest=function(input)
{if(input!=this.fld.value)
return false;var pointer=this;var q='';this.oP.link_field.set_get_query();if(this.oP.link_field.get_query){if(cur_frm)var doc=locals[cur_frm.doctype][cur_frm.docname];q=this.oP.link_field.get_query(doc);}
$c('search_link',args={'txt':this.fld.value,'dt':this.oP.link_field.df.options,'defaults':pack_defaults(),'query':q,'roles':'["'+user_roles.join('","')+'"]'},function(r,rt){pointer.setSuggestions(r,rt,input);});return;};_b.AutoSuggest.prototype.setSuggestions=function(r,rt,input)
{if(input!=this.fld.value)
return false;this.aSug=[];if(this.oP.json){var jsondata=eval('('+rt+')');for(var i=0;i<jsondata.results.length;i++){this.aSug.push({'id':jsondata.results[i].id,'value':jsondata.results[i].value,'info':jsondata.results[i].info});}}
this.createList(this.aSug);};_b.AutoSuggest.prototype.createList=function(arr)
{var pointer=this;var pos=_b.DOM.getPos(this.fld);if(pos.x<=0||pos.y<=0)return;if(this.body&&this.body.parentNode)
this.body.parentNode.removeChild(this.body);this.killTimeout();if(arr.length==0&&!this.oP.shownoresults)
return false;var div=_b.DOM.cE("div",{className:this.oP.className});div.style.zIndex=95;div.isactive=1;this.ul=_b.DOM.cE("ul",{id:"as_ul"});var ul=this.ul;for(var i=0;i<arr.length;i++){var val=arr[i].value;var st=val.toLowerCase().indexOf(this.sInp.toLowerCase());var output=val.substring(0,st)+"<em>"+val.substring(st,st+this.sInp.length)+"</em>"+val.substring(st+this.sInp.length);var span=_b.DOM.cE("span",{},output,true);span.isactive=1;if(arr[i].info!="")
{var small=_b.DOM.cE("small",{},arr[i].info);span.appendChild(small);small.isactive=1}
var a=_b.DOM.cE("a",{href:"#"});a.appendChild(span);a.name=i+1;a.onclick=function(e){pointer.setHighlightedValue();return false;};a.onmouseover=function(){pointer.setHighlight(this.name);};a.isactive=1;var li=_b.DOM.cE("li",{},a);ul.appendChild(li);}
if(arr.length==0&&this.oP.shownoresults){var li=_b.DOM.cE("li",{className:"as_warning"},this.oP.noresults);ul.appendChild(li);}
div.appendChild(ul);var mywid=cint(this.fld.offsetWidth);if(cint(mywid)<300)mywid=300;var left=pos.x-((mywid-this.fld.offsetWidth)/2);if(left<0){mywid=mywid+(left/2);left=0;}
div.style.left=left+"px";div.style.top=(pos.y+this.fld.offsetHeight+this.oP.offsety)+"px";div.style.width=mywid+'px';div.onmouseover=function(){pointer.killTimeout()};div.onmouseout=function(){pointer.resetTimeout()};$i('body_div').appendChild(div);this.iHigh=0;this.changeHighlight(40);var pointer=this;this.toID=setTimeout(function(){pointer.clearSuggestions()},this.oP.timeout);cur_autosug=this;this.body=div;};_b.AutoSuggest.prototype.changeHighlight=function(key)
{var list=this.ul;if(!list)
return false;var n;if(key==40)
n=this.iHigh+1;else if(key==38)
n=this.iHigh-1;if(n>list.childNodes.length)
n=list.childNodes.length;if(n<1)
n=1;this.setHighlight(n);};_b.AutoSuggest.prototype.setHighlight=function(n)
{var list=this.ul;if(!list)
return false;if(this.iHigh>0)
this.clearHighlight();this.iHigh=Number(n);list.childNodes[this.iHigh-1].className="as_highlight";this.killTimeout();};_b.AutoSuggest.prototype.clearHighlight=function()
{var list=this.ul;if(!list)
return false;if(this.iHigh>0){list.childNodes[this.iHigh-1].className="";this.iHigh=0;}};_b.AutoSuggest.prototype.setHighlightedValue=function()
{if(this.iHigh){if(this.custom_select)
this.sInp=this.fld.value=this.custom_select(this.fld.value,this.aSug[this.iHigh-1].value);else
this.sInp=this.fld.value=this.aSug[this.iHigh-1].value;try{this.fld.focus();if(this.fld.selectionStart)
this.fld.setSelectionRange(this.sInp.length,this.sInp.length);}catch(e){return;}
this.clearSuggestions();this.killTimeout();if(typeof(this.oP.callback)=="function")
this.oP.callback(this.aSug[this.iHigh-1]);if(this.fld.onchange)
this.fld.onchange();}};_b.AutoSuggest.prototype.killTimeout=function(){cur_autosug=this;clearTimeout(this.toID);};_b.AutoSuggest.prototype.resetTimeout=function(){cur_autosug=this;clearTimeout(this.toID);var pointer=this;this.toID=setTimeout(function(){pointer.clearSuggestions()},1000);};_b.AutoSuggest.prototype.clearSuggestions=function(){this.killTimeout();var pointer=this;if(this.body){$dh(this.body);}
if(this.ul)
delete this.ul;cur_autosug=null;};if(typeof(_b.DOM)=="undefined")
_b.DOM={};_b.DOM.cE=function(type,attr,cont,html)
{var ne=document.createElement(type);if(!ne)return 0;for(var a in attr)ne[a]=attr[a];var t=typeof(cont);if(t=="string"&&!html)ne.appendChild(document.createTextNode(cont));else if(t=="string"&&html)ne.innerHTML=cont;else if(t=="object")ne.appendChild(cont);return ne;};_b.DOM.getPos=function(e){var p=objpos(e)
p.y=p.y+5;return p;};function set_opacity(ele,ieop){var op=ieop/100;if(ele.filters){try{ele.filters.item("DXImageTransform.Microsoft.Alpha").opacity=ieop;}catch(e){ele.style.filter='progid:DXImageTransform.Microsoft.Alpha(opacity='+ieop+')';}}else{ele.style.opacity=op;}}
function animate(ele,style_key,from,to,callback){steps=10;intervals=20;powr=0.5
if(ele.animateMemInt){window.clearInterval(ele.animateMemInt);}
var actStep=0;ele.animateMemInt=window.setInterval(function(){ele.currentAnimateVal=easeInOut(cint(from),cint(to),steps,actStep,powr);if(in_list(['width','height','top','left'],style_key))
ele.currentAnimateVal=ele.currentAnimateVal+"px";if(style_key=='opacity')
set_opacity(ele,ele.currentAnimateVal);else
ele.style[style_key]=ele.currentAnimateVal;actStep++;if(actStep>steps){window.clearInterval(ele.animateMemInt);if(callback)callback(ele);}},intervals)}
function easeInOut(minValue,maxValue,totalSteps,actualStep,powr){var delta=maxValue-minValue;var stepp=minValue+(Math.pow(((1/totalSteps)*actualStep),powr)*delta);return Math.ceil(stepp)}
list_opts={cell_style:{padding:'3px 2px',borderRight:'1px solid #CCC'},alt_cell_style:{backgroundColor:'#F2F2FF'},head_style:{backgroundColor:'#F2F2F2',height:'20px',overflow:'hidden',verticalAlign:'middle',textAlign:'center',fontWeight:'bold',padding:'1px'},head_main_style:{padding:'0px',borderRight:'1px solid #CCC'},hide_export:0,hide_print:0,hide_refresh:0,hide_rec_label:0,show_calc:1,show_empty_tab:1,show_bottom_paging:1,round_corners:1,no_border:0};function Listing(head_text,no_index,no_loading){this.start=0;this.page_len=20;this.paging_len=5;this.filters_per_line=3;this.head_text=head_text?head_text:'Result';this.keyword='records';this.no_index=no_index;this.underline=1;this.show_cell=null;this.show_result=null;this.colnames=null;this.colwidths=null;this.coltypes=null;this.coloptions=null;this.filters={};this.sort_list={};this.sort_order_dict={};this.is_std_query=false;this.server_call=null;this.no_loading=no_loading;this.opts=copy_dict(list_opts);}
Listing.prototype.make=function(parent){var me=this;this.wrapper=parent;this.filter_wrapper=$a(parent,'div','srs_filter_wrapper');this.filter_area=$a(this.filter_wrapper,'div','srs_filter_area');$dh(this.filter_wrapper);this.btn_area=$a(parent,'div','',{margin:'8px 0px'});this.body_area=$a(parent,'div','srs_body_area');var div=$a(this.body_area,'div','srs_paging_area');this.body_head=make_table(div,1,2,'100%',['50%','50%'],{verticalAlign:'middle'});$y(this.body_head,{borderCollapse:'collapse'});this.rec_label=$td(this.body_head,0,0);if(this.opts.hide_rec_label){$y($td(this.body_head,0,0),{width:'0%'});$y($td(this.body_head,0,1),{width:'100%'});}
this.results=$a($a(this.body_area,'div','srs_results_area'),'div');this.fetching_area=$a(this.body_area,'div','',{height:'120px',background:'url("images/ui/square_loading.gif") center no-repeat',display:'none'});if(this.opts.show_empty_tab)
this.make_result_tab();this.bottom_div=$a(this.body_area,'div','',{paddingTop:'8px',height:'22px'});var t=make_table(me.btn_area,1,12,'',['20px','','20px','','20px','','20px','','20px','','20px',''],{height:'36px',verticalAlign:'middle'});var cnt=0;this.btns={};var make_btn=function(label,src,onclick,bold){$w($td(t,0,cnt+1),(20+6*label.length)+'px');var img=$a($td(t,0,cnt+0),'img','');img.src="images/icons/"+src+".gif";var span=$a($td(t,0,cnt+1),'span','link_type',{margin:'0px 8px 0px 4px'});if(bold)$y(span,{fontSize:'14px',fontWeight:'bold'});span.innerHTML=label;span.onclick=onclick;me.btns[label]=[img,span];}
var tmp=0;if(!this.opts.hide_refresh){make_btn('Refresh','page_refresh',function(){me.run();},1);cnt+=2;}
if(this.opts.show_new){make_btn('New ','page_add',function(){new_doc(me.dt);},1);cnt+=2;}
if(this.opts.show_report){make_btn('Report Builder','table',function(){loadreport(me.dt);},0);cnt+=2;}
if(!this.opts.hide_export){make_btn('Export','page_excel',function(){me.do_export();});cnt+=2;}
if(!this.opts.hide_print){make_btn('Print','printer',function(){me.do_print();});cnt+=2;}
if(this.opts.show_calc){make_btn('Calc','calculator',function(){me.do_calc();});cnt+=2;$dh(this.btns['Calc'][0]);$dh(this.btns['Calc'][1]);}
if(!cnt)$dh(this.btn_area);this.paging_nav={};this.make_paging_area('top',$td(this.body_head,0,1));if(this.opts.show_bottom_paging)
this.make_paging_area('bottom',this.bottom_div);}
Listing.prototype.do_print=function(){this.build_query();if(!this.query){alert('No Query!');return;}
args={query:this.query,title:this.head_text,colnames:this.colnames,colwidths:this.colwidths,coltypes:this.coltypes,has_index:(this.no_index?0:1),has_headings:1,check_limit:1,is_simple:1}
print_query(args);}
Listing.prototype.do_calc=function(){show_calc(this.result_tab,this.colnames,this.coltypes,0)}
ListPaging=function(id,list,p){var mo_bg='#FFF';this.list=list;this.wrapper=$a(p,'div','paging_area');$dh(this.wrapper);var cw=['15px','50px'];for(var i=0;i<list.paging_len;i++)cw[cw.length]='20px';cw[cw.length]='35px';cw[cw.length]='15px'
var pt=make_table(this.wrapper,1,cw.length,null,cw)
var me=this;var make_link=function(p,label,onclick,rtborder){p.innerHTML=label;p.style.cursor='pointer';p.onmouseover=function(){if(!this.disabled){this.className='srs_paging_item srs_paging_item_mo'}}
p.onmouseout=function(){this.className='srs_paging_item';}
p.user_onclick=onclick;p.onclick=function(){this.user_onclick();}
p.disable=function(b){if(!b)$op(this,30);p.style.cursor='default';this.disabled=1;}
p.enable=function(){$op(this,100);p.style.cursor='pointer';this.disabled=0;}
p.rtborder=rtborder;if(rtborder)p.style.borderRight='1px solid #CCC';return p;}
var goto_rec=function(t,st){if(!t.disabled){list.start=st;list.run(1);}}
this.prev1=make_link($td(pt,0,0),'<img src="images/ui/prev_pointer.gif">',function(){goto_rec(this,me.list.start-me.list.page_len);});this.prev2=make_link($td(pt,0,1),'Previous',function(){goto_rec(this,me.list.start-me.list.page_len);});for(var i=0;i<list.paging_len;i++){this['p_'+i]=make_link($td(pt,0,i+2),'',function(){goto_rec(this,this.st);},((i==list.paging_len-1)?0:1));}
this.next1=make_link($td(pt,0,cw.length-2),'Next',function(){goto_rec(this,me.list.start+me.list.page_len);});this.next2=make_link($td(pt,0,cw.length-1),'<img src="images/ui/next_pointer.gif">',function(){goto_rec(this,me.list.start+me.list.page_len);});list.paging_nav[id]=this;}
ListPaging.prototype.refresh=function(nr){var lst=this.list;if(cint(lst.max_len)<=cint(lst.page_len)){$dh(this.wrapper);return;}
$ds(this.wrapper);var last=0;var cpage=1;var page_from=1;if((lst.start+nr)==lst.max_len)last=1;if(lst.start>0){this.prev1.enable();this.prev2.enable();cpage=cint(lst.start/lst.page_len)+1;if(cpage>3)page_from=cpage-2;}else{this.prev1.disable();this.prev2.disable();}
for(var i=0;i<lst.paging_len;i++){var st=((page_from-1)+i)*lst.page_len;var p=this['p_'+i];if((page_from+i)==cpage){p.innerHTML=((page_from+i)+'').bold();p.disable(1);}else if(st>lst.max_len){p.innerHTML=(page_from+i)+'';p.disable();}else{p.innerHTML=(page_from+i)+'';p.enable();p.st=st;}}
if(!last){this.next1.enable();this.next2.enable();}else{this.next1.disable();this.next2.disable();}}
Listing.prototype.make_paging_area=function(id,p){new ListPaging(id,this,p);}
Listing.prototype.refresh_paging=function(nr){for(var i in this.paging_nav)this.paging_nav[i].refresh(nr);}
Listing.prototype.hide_paging=function(){for(var i in this.paging_nav)$dh(this.paging_nav[i].wrapper);}
Listing.prototype.add_filter=function(label,ftype,options,tname,fname,cond){if(!this.filter_area){alert('[Listing] make() must be called before add_filter');}
var me=this;if(!this.filter_set){var h=$a(this.filter_area,'div','',{fontSize:'14px',fontWeight:'bold',marginBottom:'4px'});h.innerHTML='Apply Filters';this.filter_area.div=$a(this.filter_area,'div');this.perm=[[1,1],]
this.filters={};}
$ds(this.filter_wrapper);if((!this.inp_tab)||(this.inp_tab.rows[0].cells.length==this.filters_per_line)){this.inp_tab=$a(this.filter_area.div,'table','',{width:'100%'});this.inp_tab.insertRow(0);}
var c=this.inp_tab.rows[0].insertCell(this.inp_tab.rows[0].cells.length);$y(c,{width:cint(100/this.filters_per_line)+'%',textAlign:'left',verticalAlign:'top'});var d1=$a(c,'div');d1.innerHTML=label;$y(d1,{marginBottom:'2px'});var d2=$a(c,'div');if(ftype=='Text')ftype='Data';var inp=make_field({fieldtype:ftype,'label':label,'options':options},'',d2,this,0,1);inp.in_filter=1;inp.report=this;inp.df.single_select=1;inp.parent_cell=c;inp.parent_tab=this.input_tab;$y(inp.wrapper,{width:'140px'});inp.refresh();$y(inp.input,{width:'100%'});inp.tn=tname;inp.fn=fname;inp.condition=cond;var me=this;inp.onchange=function(){me.start=0;}
this.filters[label]=inp;this.filter_set=1;}
Listing.prototype.remove_filter=function(label){var inp=this.filters[label];inp.parent_tab.rows[0].deleteCell(inp.parent_cell.cellIndex);delete this.filters[label];}
Listing.prototype.remove_all_filters=function(){for(var k in this.filters)this.remove_filter(k);$dh(this.filter_wrapper);}
Listing.prototype.add_sort=function(ci,field_name){this.sort_list[ci]=field_name;}
Listing.prototype.has_data=function(){return this.n_records;}
Listing.prototype.set_default_sort=function(fieldname,sort_order){this.sort_order=sort_order;this.sort_order_dict[fieldname]=sort_order;this.sort_by=fieldname;}
Listing.prototype.set_sort=function(cell,ci,field_name){var me=this;$y(cell.sort_cell,{width:'18px'});cell.sort_img=$a(cell.sort_cell,'img');cell.sort_img.src='images/icons/sort_desc.gif';cell.field_name=field_name;$dh(cell.sort_img);$y(cell.label_cell,{textDecoration:'underline',color:'#44A',cursor:'pointer'});cell.onmouseover=function(){$di(this.sort_img);}
cell.onmouseout=function(){$dh(this.sort_img);}
cell.onclick=function(){me.sort_by=this.field_name;if(me.sort_order_dict[field_name]=='ASC'){me.sort_order='ASC';me.sort_order_dict[field_name]='DESC';this.sort_img.src='images/icons/sort_desc.gif';}else{me.sort_order='DESC';me.sort_order_dict[field_name]='ASC';this.sort_img.src='images/icons/sort_asc.gif';}
me.run();}}
Listing.prototype.do_export=function(){this.build_query();var cn=[];if(this.no_index)
cn=this.colnames;else{for(var i=1;i<this.colnames.length;i++)cn.push(this.colnames[i]);}
var q=export_ask_for_max_rows(this.query,function(query){export_csv(query,this.head_text,null,1,null,cn);});}
Listing.prototype.build_query=function(){if(this.get_query)this.get_query(this);if(!this.query){alert('No Query!');return;}
var cond=[];for(var i in this.filters){var f=this.filters[i];var val=f.get_value();var c=f.condition;if(!c)c='=';if(val&&c.toLowerCase()=='like')val+='%';if(f.tn&&val&&!in_list(['All','Select...',''],val))
cond.push(repl(' AND `tab%(dt)s`.%(fn)s %(condition)s "%(val)s"',{dt:f.tn,fn:f.fn,condition:c,val:val}));}
if(cond){this.query+=NEWLINE+cond.join(NEWLINE)
this.query_max+=NEWLINE+cond.join(NEWLINE)}
if(this.group_by)
this.query+=' '+this.group_by+' ';if(this.sort_by&&this.sort_order){this.query+=NEWLINE+' ORDER BY '+this.sort_by+' '+this.sort_order;}
if(this.show_query)msgprint(this.query);}
Listing.prototype.set_rec_label=function(total,cur_page_len){if(this.opts.hide_rec_label)
return;else if(total==-1)
this.rec_label.innerHTML='Fetching...'
else if(total>0)
this.rec_label.innerHTML=repl('Total %(total)s %(keyword)s. Showing %(start)s to %(end)s',{total:total,start:cint(this.start)+1,end:cint(this.start)+cint(cur_page_len),keyword:this.keyword});else if(total==null)
this.rec_label.innerHTML=''
else if(total==0)
this.rec_label.innerHTML='No Result'}
Listing.prototype.run=function(from_page){this.build_query();var q=this.query;var me=this;if(this.max_len&&this.start>=this.max_len)this.start-=this.page_len;if(this.start<0||(!from_page))this.start=0;q+=' LIMIT '+this.start+','+this.page_len;var call_back=function(r,rt){me.clear_tab();me.max_len=r.n_values;if(r.values&&r.values.length){me.n_records=r.values.length;var nc=r.values[0].length;if(me.colwidths)nc=me.colwidths.length-(me.no_index?0:1);if(!me.show_empty_tab){me.remove_result_tab();me.make_result_tab(r.values.length);}
me.refresh(r.values.length,nc,r.values);me.total_records=r.n_values;me.set_rec_label(r.n_values,r.values.length);}else{me.n_records=0;me.set_rec_label(0);if(!me.show_empty_tab){me.remove_result_tab();me.make_result_tab(0);}else{me.clear_tab();}}
$ds(me.results);if(me.onrun)me.onrun();}
this.set_rec_label(-1);if(this.server_call)
{this.server_call(this,call_back);}
else{args={query_max:this.query_max,'defaults':pack_defaults(),'roles':'["'+user_roles.join('","')+'"]'}
if(this.is_std_query)args.query=q;else args.simple_query=q;$c('runquery',args,call_back,null,this.no_loading);}}
Listing.prototype.remove_result_tab=function(){if(!this.result_tab)return;this.result_tab.parentNode.removeChild(this.result_tab);delete this.result_tab;}
Listing.prototype.reset_tab=function(){this.remove_result_tab();this.make_result_tab();}
Listing.prototype.make_result_tab=function(nr){if(this.result_tab)return;if(!this.colwidths)alert("Listing: Must specify column widths");var has_headrow=this.colnames?1:0;if(nr==null)nr=this.page_len;nr+=has_headrow;var nc=this.colwidths.length;var t=make_table(this.results,nr,nc,'100%',this.colwidths,{padding:'0px'});t.className='srs_result_tab';this.result_tab=t;$y(t,{borderCollapse:'collapse'});if(has_headrow)
this.make_headings(t,nr,nc);for(var ri=(has_headrow?1:0);ri<t.rows.length;ri++){for(var ci=0;ci<t.rows[ri].cells.length;ci++){if(this.opts.cell_style)$y($td(t,ri,ci),this.opts.cell_style);if(this.opts.alt_cell_style&&(ri%2))$y($td(t,ri,ci),this.opts.alt_cell_style);if(this.opts.show_empty_tab)$td(t,ri,ci).innerHTML='&nbsp;';}}
if(this.opts.no_border==1){$y(t,{border:'0px'});}
this.result_tab=t;}
Listing.prototype.clear_tab=function(){$dh(this.results);if(this.result_tab){var nr=this.result_tab.rows.length;for(var ri=(this.colnames?1:0);ri<nr;ri++)
for(var ci=0;ci<this.result_tab.rows[ri].cells.length;ci++)
$td(this.result_tab,ri,ci).innerHTML=(this.opts.show_empty_tab?'&nbsp;':'');}}
Listing.prototype.clear=function(){this.rec_label.innerHTML='';this.clear_tab();}
Listing.prototype.refresh_calc=function(){if(!this.opts.show_calc)return;if(has_common(this.coltypes,['Currency','Int','Float'])){$di(this.btns['Calc'][0]);$di(this.btns['Calc'][1]);}}
Listing.prototype.refresh=function(nr,nc,d){this.refresh_paging(nr);this.refresh_calc();if(this.show_result)
this.show_result();else{if(nr){var has_headrow=this.colnames?1:0;for(var ri=0;ri<nr;ri++){var c0=$td(this.result_tab,ri+has_headrow,0);if(!this.no_index){c0.innerHTML=cint(this.start)+cint(ri)+1;}
for(var ci=0;ci<nc;ci++){var c=$td(this.result_tab,ri+has_headrow,ci+(this.no_index?0:1));if(c){c.innerHTML='';if(this.show_cell)this.show_cell(c,ri,ci,d);else this.std_cell(d,ri,ci);}}}}}}
Listing.prototype.make_headings=function(t,nr,nc){for(var ci=0;ci<nc;ci++){var tmp=make_table($td(t,0,ci),1,2,'100%',['','0px'],this.opts.head_style);$y(tmp,{tableLayout:'fixed',borderCollapse:'collapse'});$y($td(t,0,ci),this.opts.head_main_style);$td(t,0,ci).sort_cell=$td(tmp,0,1);$td(t,0,ci).label_cell=$td(tmp,0,0);$td(tmp,0,1).style.padding='0px';$td(tmp,0,0).innerHTML=this.colnames[ci]?this.colnames[ci]:'&nbsp;';if(this.sort_list[ci])this.set_sort($td(t,0,ci),ci,this.sort_list[ci]);var div=$a($td(t,0,ci),'div');div.style.borderBottom='1px solid #CCC';if(this.coltypes&&this.coltypes[ci]&&in_list(['Currency','Float','Int'],this.coltypes[ci]))$y($td(t,0,ci).label_cell,{textAlign:'right'})}}
Listing.prototype.std_cell=function(d,ri,ci){var has_headrow=this.colnames?1:0;var c=$td(this.result_tab,ri+has_headrow,ci+(this.no_index?0:1));c.div=$a(c,'div');$s(c.div,d[ri][ci],this.coltypes?this.coltypes[ci+(this.no_index?0:1)]:null,this.coloptions?this.coloptions[ci+(this.no_index?0:1)]:null);}
function TabbedPage(parent,only_labels){this.tabs={};this.cur_tab=null;var lw=$a(parent,'div','box_label_wrapper');var lb=$a(lw,'div','box_label_body');this.label_area=$a(lb,'ul','box_tabs');if(!only_labels)this.body_area=$a(parent,'div');else this.body_area=null;}
TabbedPage.prototype.add_tab=function(n,onshow){var tab=$a(this.label_area,'li');tab.label=$a(tab,'a');tab.label.innerHTML=n;if(this.body_area){tab.tab_body=$a(this.body_area,'div','box_tabs_body');$dh(tab.tab_body);}else{tab.tab_body=null;}
tab.onshow=onshow;var me=this;tab.hide=function(){if(this.tab_body)$dh(this.tab_body);this.className='';hide_autosuggest();}
tab.set_selected=function(){if(me.cur_tab)me.cur_tab.hide();this.className='box_tab_selected';$op(this,100);me.cur_tab=this;}
tab.show=function(arg){this.set_selected();if(this.tab_body)$ds(this.tab_body);if(this.onshow)this.onshow(arg);}
tab.onmouseover=function(){if(me.cur_tab!=this)$op(this,60);}
tab.onmouseout=function(){$op(this,100);}
tab.onclick=function(){this.show();}
this.tabs[n]=tab;return tab;}
TabbedPage.prototype.disable_tab=function(n){if(this.cur_tab==this.tabs[n])this.tabs[n].hide();$dh(this.tabs[n])}
TabbedPage.prototype.enable_tab=function(n){$di(this.tabs[n])}
var READ=0;var WRITE=1;var CREATE=2;var SUBMIT=3;var CANCEL=4;var AMEND=5;var NEWLINE='\n';var exp_icon="images/ui/right-arrow.gif";var min_icon="images/ui/down-arrow.gif";var FG1="#FFFFAA";var FG2="#DDDDDD";var BG1="#FFFFFF";var BG2="#F8F8F8";var user;var frms={};var frm_con;var session={};var cal;var selector;var is_testing=false;var tree;var user_defaults;var user_roles;var user_fullname;var user_recent;var user_email;var user_img={};var recent_docs=[];session.al=[];var max_dd_rows;var cur_frm;var popup_list=[];var scroll_list=[];var grid_selected_cell;var cont_area;var tables_parents;var no_value_fields=['Section Break','Column Break','HTML','Table','FlexTable','Button','Image'];function makeui(r,rt){if(r.exc){msgprint(r.exc);return;}
if(!user){msgprint('Not Logged In',0,logout);return;}
check_pwd_expiry();session.al=r.al;user_recent=r.recent_documents;if(cint(r.testing_mode)){alert(r.testing_mode);is_testing=true;}
for(var i=0;i<startup_lst.length;i++){startup_lst[i]();}
if(session.from_gateway){$dh('user_div')}
$i('user_id').innerHTML=user_fullname?user_fullname:user;$ds('body_div');if(isIE)$y(document.getElementsByTagName('html')[0],{overflowY:'scroll'});$dh('startup_div');if(isIE){$i('dialog_back').style['filter']='alpha(opacity=60)';}
window.onresize=set_frame_dims;set_frame_dims();loadpage('_home');if(sys_defaults.login_file)login_file=sys_defaults.login_file;}
var export_dialog;function export_ask_for_max_rows(query,callback){if(!export_dialog){var d=new Dialog(400,300,"Export...");d.make_body([['Data','Max rows','Blank to export all rows'],['Button','Go'],]);d.widgets['Go'].onclick=function(){export_dialog.hide();n=export_dialog.widgets['Max rows'].value;if(cint(n))
export_dialog.query+=' LIMIT 0,'+cint(n);callback(export_dialog.query);}
d.onshow=function(){this.widgets['Max rows'].value='500';}
export_dialog=d;}
export_dialog.query=query;export_dialog.show();}
function open_url_post(URL,PARAMS){var temp=document.createElement("form");temp.action=URL;temp.method="POST";temp.style.display="none";for(var x in PARAMS){var opt=document.createElement("textarea");opt.name=x;opt.value=PARAMS[x];temp.appendChild(opt);}
document.body.appendChild(temp);temp.submit();return temp;}
function export_csv(q,report_name,sc_id,is_simple,filter_values,colnames){var args={}
args.cmd='runquery_csv';args.__account=account_id;if(__sid150)args.sid150=__sid150;if(is_simple)args.simple_query=q;else args.query=q;args.sc_id=sc_id?sc_id:'';args.filter_values=filter_values?filter_values:'';if(colnames)args.colnames=colnames.join(',');args.report_name=report_name?report_name:'';args.defaults=pack_defaults();args.roles='["'+user_roles.join('","')+'"]';open_url_post(outUrl,args);}
var print_dialog;function show_print_dialog(args){if(!print_dialog){var d=new Dialog(400,300,"Print");d.make_body([['Data','Max rows','Blank to print all rows'],['Data','Rows per page'],['Button','Go'],]);d.widgets['Go'].onclick=function(){print_dialog.hide();go_print_query(print_dialog.args,cint(print_dialog.widgets['Max rows'].value),cint(print_dialog.widgets['Rows per page'].value))}
d.onshow=function(){this.widgets['Rows per page'].value='35';this.widgets['Max rows'].value='500';}
print_dialog=d;}
print_dialog.args=args;print_dialog.show();}
function print_query(args){show_print_dialog(args);}
function go_print_query(args,max_rows,page_len){if(cint(max_rows)!=0)args.query+=' LIMIT 0,'+cint(max_rows);if(!args.query)return;var callback=function(r,rt){if(!r.values){return;}
if(!page_len)page_len=r.values.length;if(r.colnames&&r.colnames.length)
args.colnames=args.has_index?add_lists(['Sr'],r.colnames):r.colnames;if(r.colwidths&&r.colwidths.length)
args.colwidths=args.has_index?add_lists(['25px'],r.colwidths):r.colwidths;if(r.coltypes)
args.coltypes=args.has_index?add_lists(['Data'],r.coltypes):r.coltypes;if(args.coltypes){for(var i in args.coltypes)
if(args.coltypes[i]=='Link')args.coltypes[i]='Data';}
if(args.colwidths){var tw=0;for(var i=0;i<args.colwidths.length;i++)tw+=cint(args.colwidths[i]?args.colwidths[i]:100);for(var i=0;i<args.colwidths.length;i++)args.colwidths[i]=cint(cint(args.colwidths[i]?args.colwidths[i]:100)/tw*100)+'%';}
var has_heading=args.colnames?1:0;if(!args.has_headings)has_heading=0;var tl=[]
for(var st=0;st<r.values.length;st=st+page_len){tl.push(print_query_table(r,st,page_len,has_heading,args.finder))}
var html='<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
+'<html><head>'
+'<title>'+args.title+'</title>'
+'<style>'+def_print_style+'</style>'
+'</head><body>'
+(r.header_html?r.header_html:'')
+tl.join('\n<div style="page-break-after: always;"></div>\n')
+(r.footer_html?r.footer_html:'')
+'</body></html>';print_go(html)}
var out_args=copy_dict(args);if(args.is_simple){out_args.simple_query=args.query;delete out_args.query;}else{out_args.defaults=pack_defaults();out_args.roles='["'+user_roles.join('","')+'"]';}
if(args.filter_values)
out_args.filter_values=args.filter_values;$c('runquery',out_args,callback);}
function print_query_table(r,start,page_len,has_heading,finder){var div=document.createElement('div');if(!r.page_template){var head=$a(div,'div',null,{fontSize:'20px',fontWeight:'bold',margin:'16px 0px',borderBottom:'1px solid #CCC',paddingBottom:'8px'});head.innerHTML=args.title;}
var m=start+page_len;if(m>r.values.length)m=r.values.length
var t=make_table(div,m+has_heading-start,r.values[0].length+args.has_index,'100%',null);t.className='simpletable';if(args.colwidths)
$y(t,{tableLayout:'fixed'});if(has_heading){for(var i=0;i<args.colnames.length;i++){$td(t,0,i).innerHTML=args.colnames[i].bold();if(args.colwidths&&args.colwidths[i]){$w($td(t,0,i),args.colwidths[i]);}}}
for(var ri=start;ri<m;ri++){if(args.has_index)
$td(t,ri+has_heading-start,0).innerHTML=ri+1;for(var ci=0;ci<r.values[0].length;ci++){if(ri-start==0&&args.colwidths&&args.colwidths[i]){$w($td(t,0,i),args.colwidths[i]);}
var c=$td(t,ri+has_heading-start,ci+args.has_index)
c.div=$a(c,'div');$s(c.div,r.values[ri][ci],args.coltypes?args.coltypes[ci+args.has_index]:null);}}
if(r.style){for(var i=0;i<r.style.length;i++){$yt(t,r.style[i][0],r.style[i][1],r.style[i][2]);}}
if(finder&&finder.aftertableprint){finder.aftertableprint(t);}
if(r.page_template)return repl(r.page_template,{table:div.innerHTML});else return div.innerHTML;}
var wn_toolbar;var left_sidebar_width=0;var right_sidebar_width=0;var header_height=40;var footer_height=0;var overall_width=0;var home_page;var hide_webnotes_toolbar=false;function setup_display(){var cp=locals['Control Panel']['Control Panel'];wn_toolbar=new MenuToolbar($i('topmenu_div'))
if(cp.background_color){$y($i('center_div'),{backgroundColor:cp.background_color});$y($i('menu_div'),{backgroundColor:cp.background_color});$y($i('footer_div'),{backgroundColor:cp.background_color});}
if(cint(cp.header_height)){header_height=cint(cp.header_height);}
if(cint(cp.footer_height)){footer_height=cint(cp.footer_height);if(cp.footer_html)$i('footer_div').innerHTML=cp.footer_html;}
if(cint(cp.left_sidebar_width)){left_sidebar_width=cint(cp.left_sidebar_width);}
if(cint(cp.right_sidebar_width)){right_sidebar_width=cint(cp.right_sidebar_width);}
hide_webnotes_toolbar=cint(user_defaults.hide_webnotes_toolbar)
if(!hide_webnotes_toolbar)
hide_webnotes_toolbar=cint(cp.hide_webnotes_toolbar);if(user=='Administrator')hide_webnotes_toolbar=false;if(hide_webnotes_toolbar){$dh('wn_toolbar');}
cont_area=$a('center_div','div','center_area');if(cp.client_logo){var img=$a('head_banner','img');img.src='images/'+cp.client_logo;img.setAttribute('height','40px');}else if(cp.client_name){$i('head_banner').innerHTML=cp.client_name;}
if(cp.page_width){set_overall_width(cp.page_width);pagewidth=overall_width-left_sidebar_width-right_sidebar_width-32;}else{pagewidth=screen.width-left_sidebar_width-right_sidebar_width-cint(screen.width*0.1);}
max_dd_rows=15;if(cint(cp.new_style_search))
makeselector2();else
makeselector();if(cp.startup_code)
eval(cp.startup_code)
if(pscript.client_startup)
pscript.client_startup();}
startup_lst[startup_lst.length]=setup_display;function set_overall_width(w){overall_width=cint(w);pagewidth=overall_width-left_sidebar_width-right_sidebar_width-32;}
var search_sel;function setup_search_select(){search_sel=$a('qsearch_sel','select');add_sel_options(search_sel,session.m_rt);search_sel.selectedIndex=0;search_sel.onchange=function(){open_quick_search();}
select_register[select_register.length]=search_sel;var search_btn=$a('qsearch_btn','button');search_btn.innerHTML='Search';search_btn.onclick=function(){open_quick_search();}}
function open_quick_search(){selector.set_search(sel_val(search_sel));search_sel.disabled=1;selector.show();}
startup_lst[startup_lst.length]=setup_search_select;var load_todo=function(){loadpage('_todo');}
var load_cal=function(){loadpage('_calendar');}
function setup_more(){var tm=wn_toolbar.add_top_menu('Start',function(){});var fn=function(){if(this.dt=='Page')
loadpage(this.dn);else
loaddoc(this.dt,this.dn);mclose();}
wn_toolbar.add_item('Start','To Do',load_todo);wn_toolbar.add_item('Start','Calendar',load_cal);session.mi.sort(function(a,b){return(a[4]-b[4])});for(var i=0;i<session.mi.length;i++){var d=session.mi[i];var mi=wn_toolbar.add_item('Start',d[1],fn);mi.dt=d[0];mi.dn=d[5]?d[5]:d[1];}}
startup_lst[startup_lst.length]=setup_more;function setup_home(){wn_toolbar.add_top_menu('Home',function(){loadpage(home_page);});}
startup_lst[startup_lst.length]=setup_home;function setup_new_docs(){wn_toolbar.add_top_menu('New',function(){});var fn=function(){new_doc(this.dt);mclose();}
for(var i=0;i<session.nt.length;i++){var mi=wn_toolbar.add_item('New',session.nt[i],fn);mi.dt=session.nt[i];}}
startup_lst[startup_lst.length]=setup_new_docs;var rdocs;function setup_recent_docs(){rdocs=wn_toolbar.add_top_menu('Recent',function(){});rdocs.items={};var fn=function(){loaddoc(this.dt,this.dn);mclose();}
rdocs.add=function(dt,dn,on_top){if(!in_list(['Start Page','ToDo Item','Event','Search Criteria'],dt)){if(this.items[dt+'-'+dn]){var mi=this.items[dt+'-'+dn];mi.bring_to_top();return;}
var tdn=dn;var rec_label='<table style="width: 100%" cellspacing=0><tr>'
+'<td style="width: 10%; vertical-align: middle;"><div class="status_flag" id="rec_'+dt+'-'+dn+'"></div></td>'
+'<td style="width: 50%; text-decoration: underline; color: #22B; padding: 2px;">'+tdn+'</td>'
+'<td style="font-size: 11px;">'+dt+'</td></tr></table>';var mi=wn_toolbar.add_item('Recent',rec_label,fn,on_top);mi.dt=dt;mi.dn=dn;this.items[dt+'-'+dn]=mi;if(pscript.on_recent_update)pscript.on_recent_update();}}
rdocs.remove=function(dt,dn){var it=rdocs.items[dt+'-'+dn];if(it)$dh(it);if(pscript.on_recent_update)pscript.on_recent_update();}
var rlist=user_recent.split('\n');var m=rlist.length;if(m>15)m=15;for(var i=0;i<m;i++){var t=rlist[i].split('~~~');if(t[1]){var dn=t[0];var dt=t[1];rdocs.add(dt,dn,0);}}}
startup_lst[startup_lst.length]=setup_recent_docs;var search_page;function setup_search_page(){var tmp=new Page('_search');tmp.cont.body.style.height='100%';search_page=new ReportPage(tmp.cont.body);wn_toolbar.add_top_menu('Report Builder',function(){});var fn=function(){loadreport(this.dt);mclose();}
for(var i=0;i<session.rt.length;i++){var mi=wn_toolbar.add_item('Report Builder',session.rt[i],fn);mi.dt=session.rt[i];}}
startup_lst[startup_lst.length]=setup_search_page;var ToDoList;var todo;function setup_todo(){var hpage=new Page('_todo');hpage.cont.body.style.height='100%';hpage.cont.onshow=function(){if(!todo)todo=new ToDoList(hpage.cont.body);todo.organize_by_priority();}}
startup_lst[startup_lst.length]=setup_todo;function setup_calendar(){calpage=new Page('_calendar');calpage.cont.body.style.height='100%';calpage.cont.onshow=function(){if(!calendar){calendar=new Calendar();calendar.init(calpage.cont.body);}}}
startup_lst[startup_lst.length]=setup_calendar;var has_back_link=0;function setup_back_link(){if($i('back_link')){has_back_link=1;$i('back_link').onclick=function(){nav_obj.show_last_open();}}}
startup_lst[startup_lst.length]=setup_back_link;var nav_obj={}
nav_obj.ol=[];nav_obj.open_notify=function(t,dt,dn){if(nav_obj.length){var tmp=nav_obj[nav_obj.length-1];if(tmp[0]==t&&tmp[1]==dt&&tmp[2]==dn)return;}
var tmp=[];for(var i in nav_obj.ol)
if(!(nav_obj.ol[i][0]==t&&nav_obj.ol[i][1]==dt&&nav_obj.ol[i][2]==dn))tmp.push(nav_obj.ol[i]);nav_obj.ol=tmp;nav_obj.ol.push([t,dt,dn])
dhtmlHistory.add(t+'~~~'+dt+(dn?('~~~'+dn):''),'');if(!(has_back_link&&dt))return;var l=$i('back_link');var tmp=nav_obj.ol[nav_obj.ol.length-2];if(tmp)
l.innerHTML=('<< Back to '+(tmp[0]=='Page'?tmp[1]:(tmp[1]+' '+tmp[2]))).bold();else
l.innerHTML='';}
nav_obj.rename_notify=function(dt,oldn,newn){for(var i in nav_obj.ol)
if(nav_obj.ol[i][1]==dt&&nav_obj.ol[i][2]==oldn)nav_obj.ol[i][2]=newn;}
nav_obj.show_last_open=function(){var l=nav_obj.ol[nav_obj.ol.length-2];delete nav_obj.ol[nav_obj.ol.length-1];if(!l)loadpage('_home');else if(l[0]=='Page'){loadpage(l[1]);}else if(l[0]=='Report'){loadreport(l[1],l[2]);}else if(l[0]=='DocType'){loaddoc(l[1],l[2]);}else if(l[0]=='Application'){loadapp(l[1]);}}
var pages=[];function Page(page_name,content){this.name=page_name;this.cont=new Container(page_name);this.cont.init();if(content)this.cont.body.innerHTML=content;pages[page_name]=this;if(page_name==home_page)pages['_home']=this;this.cont.page=this;this.cont.onshow=function(){try{if(pscript['onshow_'+this.page.name])pscript['onshow_'+this.page.name]();}catch(e){submit_error(e);}
set_title(this.page.name);}
return this;}
var pscript={};var cur_page;function loadpage(page_name,call_back,menuitem){if(page_name=='_home')page_name=home_page;var fn=function(r,rt){if(pages[page_name]){var p=pages[page_name]
try{if(pscript['refresh_'+page_name])pscript['refresh_'+page_name](menuitem);}catch(e){submit_error(e);}}else{var p=render_page(page_name,menuitem);if(menuitem)p.menuitem=menuitem;if(!p)return;}
p.cont.show();if(p.menuitem)p.menuitem.show_selected();cur_page=page_name;if(call_back)call_back();if(page_name!='_search')
nav_obj.open_notify('Page',page_name,'');}
if(get_local('Page',page_name)||pages[page_name])fn();else $c('getdoc',{'name':page_name,'doctype':"Page",'user':user,'is_page':1},fn);}
function render_page(page_name,menuitem){if(!page_name)return;if((!locals['Page'])||(!locals['Page'][page_name])){alert(page_name+' not found');return;}
var pdoc=locals['Page'][page_name];if(pdoc.style)set_style(pdoc.style)
var script=pdoc.__script?pdoc.__script:pdoc.script;if(script)
try{eval(script);}catch(e){submit_error(e);}
var p=new Page(page_name,pdoc.__content?pdoc.__content:pdoc.content);try{if(pscript['onload_'+page_name])pscript['onload_'+page_name](menuitem);}catch(e){submit_error(e);}
return p;}
function refresh_page(page_name){var fn=function(r,rt){render_page(page_name)}
$c('getdoc',{'name':page_name,'doctype':"Page",'user':user,'is_page':1},fn)}
function check_perm_match(p,dt,dn){if(!dn)return true;var out=false;if(p.match){if(user_defaults[p.match]){for(var i=0;i<user_defaults[p.match].length;i++){if(user_defaults[p.match][i]==locals[dt][dn][p.match]){return true;}}
return false;}else if(!locals[dt][dn][p.match]){return true;}else{return false;}}else{return true;}}
function get_perm(doctype,dn,ignore_submit){var perm=[[0,0],];if(in_list(user_roles,'Administrator'))perm[0][READ]=1;var plist=getchildren('DocPerm',doctype,'permissions','DocType');for(var pidx in plist){var p=plist[pidx];var pl=cint(p.permlevel?p.permlevel:0);if(in_list(user_roles,p.role)){if(check_perm_match(p,doctype,dn)){if(!perm[pl])perm[pl]=[];if(!perm[pl][READ]){if(cint(p.read))perm[pl][READ]=1;else perm[pl][READ]=0;}
if(!perm[pl][WRITE]){if(cint(p.write)){perm[pl][WRITE]=1;perm[pl][READ]=1;}else perm[pl][WRITE]=0;}
if(!perm[pl][CREATE]){if(cint(p.create))perm[pl][CREATE]=1;else perm[pl][CREATE]=0;}
if(!perm[pl][SUBMIT]){if(cint(p.submit))perm[pl][SUBMIT]=1;else perm[pl][SUBMIT]=0;}
if(!perm[pl][CANCEL]){if(cint(p.cancel))perm[pl][CANCEL]=1;else perm[pl][CANCEL]=0;}
if(!perm[pl][AMEND]){if(cint(p.amend))perm[pl][AMEND]=1;else perm[pl][AMEND]=0;}}}}
if((!ignore_submit)&&dn&&locals[doctype][dn].docstatus>0){for(pl in perm)
perm[pl][WRITE]=0;}
return perm;}
var grid_click_event;function set_frame_dims(){var d=get_screen_dims();var toolbar_height=26;if(hide_webnotes_toolbar)toolbar_height=0;var main_top=header_height+toolbar_height;var head_h=main_top?(main_top+1):0;if(isIE&&head_h)head_h=head_h+1;if(overall_width){d.w=overall_width;if(isIE){d.w=d.w-1;}
$w($i('main_div'),d.w+'px');$w($i('head_div'),d.w+'px');$w($i('center_div'),(d.w-left_sidebar_width-right_sidebar_width)+'px');}
$h($i('head_div'),head_h+'px');if(footer_height)
$h($i('footer_div'),footer_height+'px');if(left_sidebar_width)$w($i('menu_div'),left_sidebar_width+'px');else $w($i('menu_div'),'0px');if(right_sidebar_width)$w($i('right_sidebar_div'),right_sidebar_width+'px');else $w($i('right_sidebar_div'),'0px');if(cur_app){var footer_buff=4;$y(cont_area,{margin:'0px',border:'0px'});$y(cur_app.frame,{height:(d.h-main_top-footer_height-footer_buff-frame_adj)+'px'})}}
function edit_profile(){loaddoc("Profile",user);}
function logout(){$c('logout',args={},function(){window.location=login_file;});}
var about_dialog;function make_about(){var d=new Dialog(360,480,'About')
d.make_body([['HTML','info']]);var reset_testing_html='';if(has_common(user_roles,['Administrator','System Manager'])){reset_testing_html="<br><div onclick='setup_testing()' class='link_type'>Reset Testing Mode (Old testing data will be lost)</div>"
+"<br><div onclick='download_backup()' class='link_type'>Download Backup</div>";}
d.rows['info'].innerHTML="<div style='padding: 16px;'><center>"
+"<div style='text-align: center'><img src = 'images/ui/webnotes30x120.gif'></div>"
+"<br><br>&copy; 2007-08 Web Notes Technologies Pvt. Ltd."
+"<p><span style='color: #888'>Customized Web Based Solutions and Products</span>"
+"<br>51 / 2406, Nishigandha, Opp MIG Cricket Club,<br>Bandra (East),<br>Mumbai 51</p>"
+"<p>Phone: +91-22-6526-5364 (M-F 9-6)"
+"<br>Email: info@webnotestech.com"
+"<br><b>Customer Support: support@webnotestech.com</b></p>"
+"<p><a href='http://www.webnotestech.com'>www.webnotestech.com</a></p></center>"
+"<div style='background-color: #DFD; padding: 16px;'>"
+"<div id='testing_mode_link' onclick='enter_testing()' class='link_type'>Enter Testing Mode</div>"
+reset_testing_html
+"<br><div onclick='err_console.show()' class='link_type'><b>Error Console</b></div>"
+"</div>"
+"</div>";if(is_testing)$i('testing_mode_link').innerHTML='End Testing';about_dialog=d;}
function download_backup(){window.location=outUrl+"?cmd=backupdb&read_only=1&__account="+account_id
+(__sid150?("&sid150="+__sid150):'')
+"&db_name="+account_id;}
function enter_testing(){about_dialog.hide();if(is_testing){end_testing();return;}
var a=prompt('Type in the password','');if(a=='start testing'){$c('start_test',args={},function(){$ds('testing_div');is_testing=true;$i('testing_mode_link').innerHTML='End Testing';});}else{msgprint('Sorry, only administrators are allowed use the testing mode.');}}
function setup_testing(){about_dialog.hide();$c('setup_test',args={},function(){});}
function end_testing(){$c('end_test',args={},function(){$dh('testing_div');is_testing=false;$i('testing_mode_link').innerHTML='Enter Testing Mode';});}
startup_lst[startup_lst.length]=make_about;search_fields={};function makeselector2(){var d=new Dialog(600,440,'Search');d.make_body([['HTML','List']]);d.loading_div=$a(d.widgets.List,'div','comment',{margin:'8px 0px',display:'none'});d.loading_div.innerHTML='Setting up...';d.ls=new Listing("Search",1);d.ls.opts={cell_style:{padding:'3px 2px',border:'0px'},alt_cell_style:{backgroundColor:'#FFFFFF'},hide_export:1,hide_print:1,hide_refresh:0,hide_rec_label:0,show_calc:0,show_empty_tab:0,show_bottom_paging:0,round_corners:0,no_border:1}
d.ls.is_std_query=1;d.ls.colwidths=[''];d.ls.make(d.widgets.List);$y(d.ls.results,{height:'200px',overflowY:'auto'});d.ls.get_query=function(){if(d.input&&d.input.get_query){var doc={};if(cur_frm)doc=locals[cur_frm.doctype][cur_frm.docname];this.query=d.input.get_query(doc);this.query_max='SELECT COUNT(*) FROM '+this.query.split(' FROM ')[1];}else{var q={};var fl=[]
q.table=repl('`tab%(dt)s`',{dt:d.sel_type});for(var i in d.fields)
fl.push(q.table+'.`'+d.fields[i][0]+'`')
q.fields=fl.join(', ');q.conds=q.table+'.docstatus < 2 ';this.query=repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s",q);this.query_max=repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s",q);}}
d.ls.show_cell=function(cell,ri,ci,dat){var l=$a($a(cell,'div','',{borderBottom:'1px dashed #CCC',paddingBottom:'4px'}),'span','link_type');l.innerHTML=dat[ri][0];l.d=d;l.onclick=function(){if(this.d.style=='Search')
loaddoc(this.d.sel_type,this.innerHTML);else
setlinkvalue(this.innerHTML);}
var l=$a(cell,'div','comment');var tmp=[];for(var i=1;i<dat[ri].length;i++)tmp.push(dat[ri][i]);l.innerHTML=tmp.join(', ');}
d.set_search=function(dt){if(d.style!='Search'){d.ls.clear();}
d.style='Search';if(d.input){d.input=null;sel_type=null;}
d.sel_type=dt;d.title_text.innerHTML='Search for '+dt;}
d.set=function(input,type,label){d.sel_type=type;d.input=input;if(d.style!='Link'){d.ls.clear();}
d.style='Link';if(!d.sel_type)d.sel_type='Value';d.title_text.innerHTML='Select a "'+d.sel_type+'" for field "'+label+'"';}
d.onshow=function(){if(d.sel_type!='Value'&&!search_fields[d.sel_type]){$dh(d.ls.wrapper);$ds(d.loading_div);$c('getsearchfields',{doctype:d.sel_type},function(r,rt){search_fields[d.sel_type]=r.searchfields;d.show_lst();})}else{d.show_lst();}}
d.onhide=function(){search_sel.disabled=0;}
d.show_lst=function(){$ds(d.ls.wrapper);$dh(d.loading_div);d.fields=search_fields[d.sel_type];if(d.sel_type=='Value'){d.fields=[];}
if(d.sel_type!=d.set_doctype){d.ls.clear();d.ls.remove_all_filters();for(var i=0;i<(d.fields.length>4?4:d.fields.length);i++){if(d.fields[i][2]=='Link')d.fields[i][2]='Data';d.ls.add_filter(d.fields[i][1],d.fields[i][2],d.fields[i][3],d.sel_type,d.fields[i][0],(in_list(['Data','Text','Link'],d.fields[i][2])?'LIKE':''));}}
d.set_doctype=d.sel_type;if(d.ls.filters['ID'].input)d.ls.filters['ID'].input.focus();}
selector=d;}
function makeselector(){var d=new Dialog(540,440,'Search');d.make_body([['Data','Beginning With','Tip: You can use wildcard "%"'],['Select','Search By'],['Button','Search'],['HTML','Result']]);d.wrapper.style.zIndex=93;var inp=d.widgets['Beginning With'];var field_sel=d.widgets['Search By'];var btn=d.widgets['Search'];d.sel_type='';d.values_len=0;d.set=function(input,type,label){d.sel_type=type;d.input=input;if(d.style!='Link'){d.rows['Result'].innerHTML='';d.values_len=0;}
d.style='Link';if(!d.sel_type)d.sel_type='Value';d.title_text.innerHTML='Select a "'+d.sel_type+'" for field "'+label+'"';}
d.set_search=function(dt){if(d.style!='Search'){d.rows['Result'].innerHTML='';d.values_len=0;}
d.style='Search';if(d.input){d.input=null;sel_type=null;}
d.sel_type=dt;d.title_text.innerHTML='Quick Search for '+dt;}
inp.onkeydown=function(e){if(isIE)var kc=window.event.keyCode;else var kc=e.keyCode;if(kc==13)if(!btn.disabled)btn.onclick();}
var _add_sel_options=function(s,list){for(var i in list){s.options[s.options.length]=new Option(list[i][1],list[i][0],false,false);}}
d.onshow=function(){if(d.set_doctype!=d.sel_type){d.rows['Result'].innerHTML='';d.values_len=0;}
inp.value='';if(d.input&&d.input.txt.value){inp.value=d.input.txt.value;}
try{inp.focus();}catch(e){}
if(d.input)d.input.set_get_query();$ds(d.rows['Search By']);if(search_fields[d.sel_type]){empty_select(field_sel);_add_sel_options(field_sel,search_fields[d.sel_type]);}else{empty_select(field_sel);_add_sel_options(field_sel,[['name','ID']]);$c('getsearchfields',{'doctype':d.sel_type},function(r,rt){search_fields[d.sel_type]=r.searchfields;empty_select(field_sel);_add_sel_options(field_sel,search_fields[d.sel_type]);field_sel.selectedIndex=0;});}}
d.onhide=function(){search_sel.disabled=0;}
btn.onclick=function(){btn_dis(btn,true);d.set_doctype=d.sel_type;var q='';if(d.input&&d.input.get_query){var doc={};if(cur_frm)doc=locals[cur_frm.doctype][cur_frm.docname];var q=d.input.get_query(doc);if(!q){return'';}}
$c('search2',args={'txt':strip(inp.value),'doctype':d.sel_type,'defaults':pack_defaults(),'query':q,'searchfield':sel_val(field_sel),'defaults':pack_defaults(),'roles':'["'+user_roles.join('","')+'"]'},function(r,rtxt){btn_dis(btn,false);if(r.coltypes)r.coltypes[0]='Link';d.values_len=r.values.length;d.set_result(r);},function(){btn_dis(btn,false);});}
d.set_result=function(r){d.rows['Result'].innerHTML='';var c=$a(d.rows['Result'],'div','comment',{paddingBottom:'4px',marginBottom:'4px',borderBottom:'1px solid #CCC',marginLeft:'4px'});if(r.values.length==50)
c.innerHTML='Showing max 50 results. Use filters to narrow down your search';else
c.innerHTML='Showing '+r.values.length+' resuts.';var w=$a(d.rows['Result'],'div','',{height:'240px',overflow:'auto',margin:'4px'});for(var i=0;i<r.values.length;i++){var div=$a(w,'div','',{marginBottom:'4px',paddingBottom:'4px',borderBottom:'1px dashed #CCC'});var l=$a(div,'div','link_type');l.innerHTML=r.values[i][0];l.link_name=r.values[i][0];l.dt=r.coloptions[0];if(d.input)
l.onclick=function(){setlinkvalue(this.link_name);}
else
l.onclick=function(){loaddoc(this.dt,this.link_name);}
var cl=[]
for(var j=1;j<r.values[i].length;j++)cl.push(r.values[i][j]);var c=$a(div,'div','comment',{marginTop:'2px'});c.innerHTML=cl.join(', ');}}
d.wrapper.style.zIndex='95';selector=d;}
function DocLink(p,doctype,name,onload){var a=$a(p,'span','link_type');a.innerHTML=a.dn=name;a.dt=doctype;a.onclick=function(){loaddoc(this.dt,this.dn,onload)};return a;}
var doc_link=DocLink;function page_link(p,name,onload){var a=$a(p,'span','link_type');a.innerHTML=a.pn=name;a.onclick=function(){loadpage(this.pn,onload)};return a;}
function setlinkvalue(name){selector.hide();selector.input.set(name);selector.input.set_input(name);if(selector.input.txt)selector.input.txt.onchange();}
function pack_defaults(){myd=[];for(var d in user_defaults){myd[myd.length]='"'+d+'":["'+user_defaults[d].join('", "')+'"]';}
return'{'+myd.join(',')+'}';}
var calc_dialog;function show_calc(tab,colnames,coltypes,add_idx){if(!add_idx)add_idx=0;if(!tab||!tab.rows.length){msgprint("No Data");return;}
if(!calc_dialog){var d=new Dialog(400,400,"Calculator")
d.make_body([['Select','Column'],['Data','Sum'],['Data','Average'],['Data','Min'],['Data','Max']])
d.widgets['Sum'].readonly='readonly';d.widgets['Average'].readonly='readonly';d.widgets['Min'].readonly='readonly';d.widgets['Max'].readonly='readonly';d.widgets['Column'].onchange=function(){d.set_calc();}
d.set_calc=function(){var cn=sel_val(this.widgets['Column']);var cidx=0;var sum=0;var avg=0;var minv=null;var maxv=null;for(var i=0;i<this.colnames.length;i++){if(this.colnames[i]==cn){cidx=i+add_idx;break;}}
for(var i=0;i<this.datatab.rows.length;i++){var c=this.datatab.rows[i].cells[cidx];var v=c.div?flt(c.div.innerHTML):flt(c.innerHTML);sum+=v;if(minv==null)minv=v;if(maxv==null)maxv=v;if(v>maxv)maxv=v;if(v<minv)minv=v;}
d.widgets['Sum'].value=fmt_money(sum);d.widgets['Average'].value=fmt_money(sum/this.datatab.rows.length);d.widgets['Min'].value=fmt_money(minv);d.widgets['Max'].value=fmt_money(maxv);calc_dialog=d;}
d.onshow=function(){var cl=[];for(var i in calc_dialog.colnames){if(in_list(['Currency','Int','Float'],calc_dialog.coltypes[i]))
cl.push(calc_dialog.colnames[i]);}
if(!cl.length){this.hide();alert("No Numeric Column");return;}
var s=this.widgets['Column'];empty_select(s);add_sel_options(s,cl);s.selectedIndex=0;this.set_calc();}
calc_dialog=d;}
calc_dialog.datatab=tab;calc_dialog.colnames=colnames;calc_dialog.coltypes=coltypes;calc_dialog.show();}
function rename_doc(){if(!cur_frm)return;var f=cur_frm;new_name=prompt('Enter a new name for '+f.docname,'');if(new_name){$c('rename',args={'dt':f.doctype,'old':f.docname,'new':new_name},function(r,rtxt){f.refresh();});}}
function new_doc(doctype,onload){loadfrm(function(){_new_doc(doctype,onload);});}
function _new_doc(doctype,onload){if(!doctype){if(cur_frm)doctype=cur_frm.doctype;else return;}
var fn=function(){frm=frms[doctype];if(frm.perm[0][CREATE]==1){if(frm.meta.issingle){var d=doctype;set_default_values(locals[doctype][doctype]);}else
var d=LocalDB.create(doctype);if(onload)onload(d);nav_obj.open_notify('DocType',doctype,d);frm.show(d);}else{msgprint('error:Not Allowed To Create '+doctype+'\nContact your Admin for help');}}
if(!frms[doctype])frm_con.add_frm(doctype,fn);else fn(frms[doctype]);}
var newdoc=new_doc;function reload_doc(){if(frms['DocType']&&frms['DocType'].opendocs[cur_frm.doctype]){msgprint("error:Cannot refresh an instance of \""+cur_frm.doctype+"\" when the DocType is open.");return;}
var ret_fn=function(r,rtxt){var t=cur_frm.doctype+'/'+cur_frm.docname;if(r.n_tweets)n_tweets[t]=r.n_tweets;if(r.last_comment)last_comments[t]=r.last_comment;cur_frm.runclientscript('setup',cur_frm.doctype,cur_frm.docname);cur_frm.refresh();}
if(cur_frm.doc.__islocal){$c('getdoctype',{'doctype':cur_frm.doctype},ret_fn,null,null,'Refreshing '+cur_frm.doctype+'...');}else{var gl=cur_frm.grids;for(var i=0;i<gl.length;i++){var dt=gl[i].df.options;for(var dn in locals[dt]){if(locals[dt][dn].__islocal&&locals[dt][dn].parent==cur_frm.docname){var d=locals[dt][dn];d.parent='';d.docstatus=2;d.__deleted=1;}}}
$c('getdoc',{'name':cur_frm.docname,'doctype':cur_frm.doctype,'getdoctype':1,'user':user},ret_fn,null,null,'Refreshing '+cur_frm.docname+'...');}}
function loadfrm(call_back){var fn=function(){frm_con=new FrmContainer();frm_con.init();call_back();}
if(!frm_con)fn();else call_back();}
function loaddoc(doctype,name,onload,menuitem){loadfrm(function(){_loaddoc(doctype,name,onload,menuitem);});}
function _loaddoc(doctype,name,onload,menuitem){selector.hide();if(!name)name=doctype;var fn=function(r,rt){if(locals[doctype]&&locals[doctype][name]){var frm=frms[doctype];if(menuitem)frm.menuitem=menuitem;if(onload)onload(frm);nav_obj.open_notify('DocType',doctype,name);if(r&&r.n_tweets)n_tweets[doctype+'/'+name]=r.n_tweets;if(r&&r.last_comment)last_comments[doctype+'/'+name]=r.last_comment;frm.show(name);if(frm.menuitem)frm.menuitem.show_selected();cur_page=null;}else{msgprint('error:There where errors while loading '+doctype+','+name);}}
if(frms['DocType']&&frms['DocType'].opendocs[doctype]){msgprint("Cannot open an instance of \""+doctype+"\" when the DocType is open.");return;}
if(!frms[doctype]){frm_con.add_frm(doctype,fn,name);}else{if(is_doc_loaded(doctype,name)){fn();}else{$c('getdoc',{'name':name,'doctype':doctype,'user':user},fn,null,null,'Loading '+name);}}}
var load_doc=loaddoc;var loaded_doctypes=[];window.onload=startup;var locals={};var fields={};var fields_list={};var LocalDB={};LocalDB.getchildren=function(child_dt,parent,parentfield,parenttype){var l=[];for(var key in locals[child_dt]){var d=locals[child_dt][key];if((d.parent==parent)&&(d.parentfield==parentfield)){if(parenttype){if(d.parenttype==parenttype)l.push(d);}else{l.push(d);}}}
l.sort(function(a,b){return(cint(a.idx)-cint(b.idx))});return l;}
LocalDB.add=function(dt,dn){if(!locals[dt])locals[dt]={};if(locals[dt][dn])delete locals[dt][dn];locals[dt][dn]={'name':dn,'doctype':dt,'docstatus':0};return locals[dt][dn];}
LocalDB.delete_doc=function(dt,dn){var doc=get_local(dt,dn);for(var ndt in locals){if(locals[ndt]){for(var ndn in locals[ndt]){var doc=locals[ndt][ndn];if(doc&&doc.parenttype==dt&&(doc.parent==dn||doc.__oldparent==dn)){locals[ndt][ndn];}}}}
delete locals[dt][dn];}
function get_local(dt,dn){return locals[dt]?locals[dt][dn]:null;}
LocalDB.sync=function(list){if(list._kl)list=expand_doclist(list);for(var i=0;i<list.length;i++){var d=list[i];if(!d.name)
d.name=LocalDB.get_localname(d.doctype);LocalDB.add(d.doctype,d.name);locals[d.doctype][d.name]=d;if(d.doctype=='DocType'){fields_list[d.name]=[];}else if(d.doctype=='DocField'){if(!fields_list[d.parent])fields_list[d.parent]=[];fields_list[d.parent][fields_list[d.parent].length]=d;if(d.fieldname){if(!fields[d.parent])fields[d.parent]={};fields[d.parent][d.fieldname]=d;}else if(d.label){if(!fields[d.parent])fields[d.parent]={};fields[d.parent][d.label]=d;}}else if(d.doctype=='Event'){if((!d.localname)&&calendar&&(!calendar.has_event[d.name]))
calendar.set_event(d);}
rename_from_local(d);}}
local_name_idx={};LocalDB.get_localname=function(doctype){if(!local_name_idx[doctype])local_name_idx[doctype]=1;var n='Unsaved '+doctype+'-'+local_name_idx[doctype];local_name_idx[doctype]++;return n;}
LocalDB.create=function(doctype,n){if(!n)n=LocalDB.get_localname(doctype);var doc=LocalDB.add(doctype,n)
doc.__islocal=1;doc.owner=user;set_default_values(doc);return n;}
LocalDB.get_default_value=function(fn,ft,df){if(df=='_Login'||df=='__user')
return user;else if(df=='_Full Name')
return user_fullname;else if(ft=='Date'&&(df=='Today'||df=='__today')){return get_today();}
else if(df)
return df;else if(user_defaults[fn])
return user_defaults[fn][0];else if(sys_defaults[fn])
return sys_defaults[fn];}
LocalDB.add_child=function(doc,childtype,parentfield){var n=LocalDB.create(childtype);var d=locals[childtype][n];d.parent=doc.name;d.parentfield=parentfield;d.parenttype=doc.doctype;return d;}
LocalDB.no_copy_list=['amended_from','amendment_date','cancel_reason'];LocalDB.copy=function(dt,dn,from_amend){var newdoc=LocalDB.create(dt);for(var key in locals[dt][dn]){if(key!=='name'&&key.substr(0,2)!='__'){locals[dt][newdoc][key]=locals[dt][dn][key];}
var df=get_field(dt,key);if(df&&((!from_amend&&cint(df.no_copy)==1)||in_list(LocalDB.no_copy_list,df.fieldname))){locals[dt][newdoc][key]='';}}
return locals[dt][newdoc];}
var Meta={};var local_dt={};Meta.make_local_dt=function(dt,dn){var dl=make_doclist('DocType',dt);if(!local_dt[dt])local_dt[dt]={};if(!local_dt[dt][dn])local_dt[dt][dn]={};for(var i=0;i<dl.length;i++){var d=dl[i];if(d.doctype=='DocField'){var key=d.fieldname?d.fieldname:d.label;local_dt[dt][dn][key]=copy_dict(d);}}}
Meta.get_field=function(dt,fn,dn){if(dn&&local_dt[dt]&&local_dt[dt][dn]){return local_dt[dt][dn][fn];}else{if(fields[dt])var d=fields[dt][fn];if(d)return d;}
return{};}
Meta.set_field_property=function(fn,key,val,doc){if(!doc&&(cur_frm.doc))doc=cur_frm.doc;try{local_dt[doc.doctype][doc.name][fn][key]=val;refresh_field(fn);}catch(e){alert("Client Script Error: Unknown values for "+doc.name+','+fn+'.'+key+'='+val);}}
var getchildren=LocalDB.getchildren;var get_field=Meta.get_field;var createLocal=LocalDB.create;function MenuToolbar(parent){this.ul=$a(parent,'ul','menu_toolbar');this.cur_top_menu=null;this.max_rows=10;this.dropdown_width='280px';this.top_menus={};this.top_menu_style='top_menu';this.top_menu_mo_style='top_menu_mo';}
MenuToolbar.prototype.add_top_menu=function(label,onclick){var li=$a(this.ul,'li');var a=$a(li,'a',this.top_menu_style);var me=this;a.onclick=function(){onclick();};a.innerHTML=label;a.onmouseover=function(){if(this!=me.cur_top_menu)this.className=me.top_menu_style+' '+me.top_menu_mo_style;if(a.my_mouseover)a.my_mouseover(this);}
a.onmouseout=function(){if(a.my_mouseout)a.my_mouseout(this);if(this!=me.cur_top_menu)
this.className=me.top_menu_style;}
a.set_unselected=function(){this.className=me.top_menu_style;me.is_active=0;}
a.set_selected=function(){if(me.cur_top_menu)me.cur_top_menu.set_unselected();this.className=me.top_menu_style+' '+me.top_menu_mo_style;me.cur_top_menu=this;me.is_active=1;}
this.top_menus[label]=a;return a;}
var closetimer;function mclose(){for(var i=0;i<all_dropdowns.length;i++){if(all_dropdowns[i].is_active)
all_dropdowns[i].hide();}}
function mclosetime(){closetimer=window.setTimeout(mclose,500);}
function mcancelclosetime(){if(closetimer){window.clearTimeout(closetimer);closetimer=null;}}
MenuToolbar.prototype.make_dropdown=function(tm){var me=this;var dropdown=new DropdownMenu(tm.parentNode,this.dropdown_width);tm.dropdown=dropdown;tm.my_mouseover=function(){this.dropdown.show();}
tm.my_mouseout=function(){this.dropdown.clear();}}
MenuToolbar.prototype.add_item=function(top_menu_label,label,onclick,on_top){var me=this;var tm=this.top_menus[top_menu_label];if(!tm.dropdown)
this.make_dropdown(tm,this.dropdown_width);return tm.dropdown.add_item(label,onclick,on_top);}
var all_dropdowns=[];function DropdownMenu(label_ele,width){this.body=$a(label_ele,'div','menu_toolbar_dropdown',{width:(width?width:'140px')});this.label=label_ele;this.items={};this.item_style='dd_item';this.item_mo_style='dd_item_mo';var me=this;this.body.onmouseout=function(){me.clear();}
this.body.onmouseover=function(){mcancelclosetime();}
this.show=function(){mclose();mcancelclosetime();hide_selects();$ds(me.body);if(me.label.set_selected)
me.label.set_selected();me.is_active=1;}
this.hide=function(){$dh(me.body);if(!frozen)show_selects();me.is_active=0;if(me.label.set_unselected)
me.label.set_unselected();}
this.clear=function(){mcancelclosetime();mclosetime();}
all_dropdowns.push(me);}
DropdownMenu.prototype.add_item=function(label,onclick,on_top){var me=this;if(on_top){var mi=document.createElement('div');me.body.insertBefore(mi,me.body.firstChild);mi.className=this.item_style;}else{var mi=$a(this.body,'div',this.item_style);}
mi.innerHTML=label;mi.onclick=onclick;mi.onmouseover=function(){this.className=me.item_style+' '+me.item_mo_style;me.cur_mi=this;}
mi.onmouseout=function(){this.className=me.item_style;}
mi.bring_to_top=function(){me.body.insertBefore(this,me.body.firstChild);}
var nitems=this.body.childNodes.length;if(nitems>max_dd_rows)nitems=max_dd_rows;$h(this.body,(nitems*23)+'px');this.items[label]=mi;return mi;}
function Tree(parent,width,do_animate){this.width=width;this.nodes={};this.allnodes={};this.cur_node;this.is_root=1;this.do_animate=do_animate;var me=this;this.exp_img='images/icons/plus.gif';this.col_img='images/icons/minus.gif';this.body=$a(parent,'div');if(width)$w(this.body,width);this.addNode=function(parent,id,imagesrc,onclick,onexpand,opts,label){var t=new TreeNode(me,parent,id,imagesrc,onclick,onexpand,opts,label);if(!parent){me.nodes[id]=t;}else{parent.nodes[id]=t;}
me.allnodes[id]=t;if(onexpand)
t.create_expimage();t.expanded_once=0;return t;}
var me=this;this.collapseall=function(){for(n in me.allnodes){me.allnodes[n].collapse();}}}
function TreeNode(tree,parent,id,imagesrc,onclick,onexpand,opts,label){var me=this;if(!parent)parent=tree;this.parent=parent;this.nodes={};this.onclick=onclick;this.onexpand=onexpand;this.text=label?label:id;this.tree=tree;if(opts)
this.opts=opts;else
this.opts={show_exp_img:1,show_icon:1,label_style:{padding:'2px',cursor:'pointer',fontSize:'11px'},onselect_style:{fontWeight:'bold'},ondeselect_style:{fontWeight:'normal'}}
var tc=1;if(this.opts.show_exp_img)tc+=1;if(!this.parent.tab){this.parent.tab=make_table(this.parent.body,2,tc,'100%');$y(this.parent.tab,{tableLayout:'fixed',borderCollapse:'collapse'});}else{this.parent.tab.append_row();this.parent.tab.append_row();}
var mytab=this.parent.tab;if(this.opts.show_exp_img){this.exp_cell=$td(mytab,mytab.rows.length-2,0);$y(this.exp_cell,{cursor:'pointer',textAlign:'center',verticalAlign:'middle',width:'20px'});this.exp_cell.innerHTML='&nbsp;';}else{}
this.create_expimage=function(){if(!me.opts.show_exp_img)return;if(!me.expimage){me.exp_cell.innerHTML='';me.expimage=$a(me.exp_cell,'img');me.expimage.src=me.exp_img?me.exp_img:me.tree.exp_img;me.expimage.onclick=me.toggle;}}
this.label=$a($td(mytab,mytab.rows.length-2,tc-1),'div');$y(this.label,this.opts.label_style);if(this.opts.show_icon){var t2=make_table($a(this.label,'div'),1,2,'100%',['20px',null]);$y(t2,{borderCollapse:'collapse'});this.img_cell=$td(t2,0,0);$y(this.img_cell,{cursor:'pointer',verticalAlign:'middle',width:'20px'});if(!imagesrc)imagesrc="images/icons/folder.gif";this.usrimg=$a(this.img_cell,'img');this.usrimg.src=imagesrc;this.label=$td(t2,0,1);$y(this.label,{verticalAlign:'middle'});}
this.loading_div=$a($td(mytab,mytab.rows.length-1,this.opts.show_exp_img?1:0),"div","comment",{fontSize:'11px'});$dh(this.loading_div);this.loading_div.innerHTML='Loading...';this.body=$a($td(mytab,mytab.rows.length-1,this.opts.show_exp_img?1:0),"div",'',{overflow:'hidden',display:'none'});this.select=function(){me.show_selected();if(me.onclick)me.onclick(me);}
this.show_selected=function(){if(me.tree.cur_node)me.tree.cur_node.deselect();if(me.opts.onselect_style)$y(me.label,me.opts.onselect_style)
me.tree.cur_node=me;}
this.deselect=function(){if(me.opts.ondeselect_style)$y(me.label,me.opts.ondeselect_style)
me.tree.cur_node=null}
this.expanded=0;this.toggle=function(){if(me.expanded)
me.collapse();else
me.expand();}
this.collapse=function(){me.body.orig_height=cint(me.body.clientHeight);if(me.tree.do_animate)
animate(me.body,'height',cint(me.body.clientHeight),0,function(ele){$dh(ele);ele.style.height=null;});else
$dh(me.body);if(me.expimage&&me.expimage.src)me.expimage.src=me.exp_img?me.exp_img:me.tree.exp_img;me.expanded=0;}
this.expand=function(){if(me.onexpand&&!me.expanded_once){me.onexpand(me);if(!me.tree.do_animate)me.show_expanded();}else{me.show_expanded();}
me.expanded=1;me.expanded_once=1;}
this.show_expanded=function(){if(me.tree.do_animate&&(!keys(me.nodes).length))return;$ds(me.body);if(!me.body.orig_height)
me.body.orig_height=me.body.clientHeight;if(me.tree.do_animate){$y(me.body,{height:'0px'});animate(me.body,'height',0,(me.body.orig_height?me.body.orig_height:cint(me.body.clientHeight)),function(ele){ele.style.height=null;});}
if(me.opts.show_exp_img&&me.expimage&&me.expimage.src){me.expimage.src=me.col_img?me.col_img:me.tree.col_img;}}
this.setlabel=function(l){me.label.value=l;me.label.innerHTML=l;}
this.setlabel(this.text);this.setcolor=function(c){this.backColor=c;if(cur_node!=this)
$bg(this.body,this.backColor);}
this.label.onclick=function(e){me.select();}
this.label.ondblclick=function(e){me.select();if(me.ondblclick)me.ondblclick(me);}
this.clear_child_nodes=function(){if(this.tab){this.tab.parentNode.removeChild(this.tab);delete this.tab;}
this.expanded_once=0;}}
check_pwd_expiry=function(){var check_pwd_callback=function(r,rt){if(r.message!='Yes')return;var d=show_reset_pwd_dialog();d.widgets['Heading'].innerHTML='Your password has expired, please set a new password';$dh(d.cancel_img);}
$c_obj('Profile Control','has_pwd_expired','',check_pwd_callback)}
var reset_pwd_dialog;function show_reset_pwd_dialog(){if(!reset_pwd_dialog){var p=new Dialog(300,400,'Reset Password');p.make_body([['HTML','Heading',''],['Password','New Password','Enter New Password'],['HTML','','<div id="pwd_new" class="comment" style="margin-left:30%; color: RED"></div>'],['Password','Retype New Password'],['HTML','','<div id="pwd_retype" class="comment" style="margin-left:30%; color: RED"></div>'],['Button','Reset']]);p.onshow=function(){$y(p.widgets['Retype New Password'],{backgroundColor:'#FFF'});p.widgets['Retype New Password'].value='';p.widgets['New Password'].value='';p.widgets['Reset'].disabled=true;}
p.widgets['New Password'].onchange=function(){validatePassword(p.widgets['New Password'].value,{length:[6,Infinity],lower:1,upper:1,numeric:1,badWords:["password","admin"],badSequenceLength:4});}
p.widgets['Retype New Password'].onchange=function(){if(p.widgets['New Password'].value==p.widgets['Retype New Password'].value&&p.widgets['New Password'].value!=''){p.widgets['Reset'].disabled=false;$i('pwd_retype').innerHTML='';$y(p.widgets['Retype New Password'],{backgroundColor:'#DFD'})}else{p.widgets['Reset'].disabled=true;$y(p.widgets['Retype New Password'],{backgroundColor:'#FFF'})
$i('pwd_retype').innerHTML='Passwords do not matching, Try again';}}
p.widgets['Reset'].onclick=function(){if(p.widgets['New Password'].value==p.widgets['Retype New Password'].value&&p.widgets['New Password'].value!=''){var reset_pwd_callback=function(r,rt){if(r.exc)msgprint(r.exc);if(r.message=='ok'){p.hide();msgprint('ok:Your password has been updated. Please login using the new password');}else{$i('pwd_new').innerHTML=r.message;}}
var pwd=p.widgets['New Password'].value;$c_obj('Profile Control','reset_password',pwd,reset_pwd_callback)}}
reset_pwd_dialog=p;}
reset_pwd_dialog.show();return p;}
function validatePassword(pw,options){var o={lower:0,upper:0,alpha:0,numeric:0,special:0,length:[0,Infinity],custom:[],badWords:[],badSequenceLength:0,noQwertySequences:false,noSequential:false};for(var property in options)
o[property]=options[property];var re={lower:/[a-z]/g,upper:/[A-Z]/g,alpha:/[A-Z]/gi,numeric:/[0-9]/g,special:/[\W_]/g},rule,i;if(pw.length<o.length[0]||pw.length>o.length[1]){$i('pwd_new').innerHTML='Password must be atleast 6 characters long.';}else if(!/[A-Z]/.test(pw)||!/[0-9]/.test(pw)||!/[a-z]/.test(pw)){$i('pwd_new').innerHTML='Password must contain atleast one capital letter, one small letter and one number.';}else{$i('pwd_new').innerHTML='';}}
function SidebarMenu(){this.menu_items={};this.menu_lists={};this.menu_dt_details={};this.menu_page=new Page('_menu');this.menu_page.cont.onshow=function(){if(sidebar_menu.cur_node)sidebar_menu.cur_node.show_selected();}
this.wrapper=$a(this.menu_page.cont.body,'div','',{margin:'8px'});this.head=$a(this.wrapper,'div','standard_title');this.body=$a(this.wrapper,'div');this.tree_wrapper=$a($i('menu_div'),'div','center_area',{padding:'4px',paddingBottom:'0px',marginRight:'0px'});this.menu_tree=new Tree($a(this.tree_wrapper,'div'),'100%',1);}
SidebarMenu.prototype.menu_click=function(n){if(n.menu_item.menu_item_type=='DocType'){sidebar_menu.cur_node=n;sidebar_menu.show_listing(n.menu_item.name);}else if(n.menu_item.menu_item_type=='New'){newdoc(n.menu_item.link_id);}else if(n.menu_item.menu_item_type=='Single'){loaddoc(n.menu_item.link_id,n.menu_item.link_id,null,n);n.toggle();}else if(n.menu_item.menu_item_type=='Page'){loadpage(n.menu_item.link_id,n.onload,n);n.toggle();}else if(n.menu_item.menu_item_type=='Report'){loadreport(n.menu_item.link_id,n.menu_item.criteria_name,n.onload,n);}else{if(n.onload)n.onload();n.toggle();}}
pscript.set_menu_style=function(level){var opt={}
if(level==0){opt={show_exp_img:0,show_icon:0,label_style:{padding:'4px',cursor:'pointer',color:'#222',marginBottom:'4px',fontSize:'14px',borderBottom:'1px solid #CCC',fontWeight:'bold',backgroundColor:'#EEE'}}}else if(level==1){opt={show_exp_img:0,show_icon:0,label_style:{padding:'4px',paddingTop:'0px',marginBottom:'4px',cursor:'pointer',borderBottom:'1px solid #CCC',fontSize:'12px',marginLeft:'8px'},onselect_style:{fontWeight:'bold'},ondeselect_style:{fontWeight:'normal'}}}if(level>=2){opt={show_exp_img:0,show_icon:0,label_style:{padding:'4px',paddingTop:'0px',marginBottom:'4px',cursor:'pointer',borderBottom:'1px dashed #EEE',fontSize:'11px',marginLeft:'12px'},onselect_style:{fontWeight:'bold'},ondeselect_style:{fontWeight:'normal'}}}
return opt}
SidebarMenu.prototype.make_menu=function(parent_node){var me=sidebar_menu;var callback=function(r,rt){var level=0
if(parent_node)level=parent_node.level;var opt=pscript.set_menu_style(level);for(var i=0;i<r.message.length;i++){var n=me.menu_tree.addNode(parent_node,r.message[i].menu_item_label,(r.message[i].icon?'images/icons/'+r.message[i].icon:''),me.menu_click,(r.message[i].has_children?me.make_menu:null),opt);n.menu_item=r.message[i];if(n.menu_item.onload){n.onload=eval('var a='+n.menu_item.onload+';a');}
if(n.menu_item.menu_item_type=='DocType')
me.menu_items[n.menu_item.name]=n.menu_item;if(parent_node)n.level=parent_node.level+1;else n.level=1;}
if(parent_node){parent_node.show_expanded();}}
$c_obj('Menu Control','get_children',parent_node?parent_node.menu_item.name:'',callback);}
SidebarMenu.prototype.show_listing=function(mid){loadpage('_menu');var me=sidebar_menu;var mi=me.menu_items[mid];if(!me.menu_dt_details[mid]){$c_obj('Menu Control','get_dt_details',mi.link_id+'~~~'+mi.doctype_fields,function(r,rt){me.menu_dt_details[mi.name]=r.message;if(r.message)me.show_listing(mi.name);});return;}
me.head.innerHTML=mi.menu_item_label;if(me.cur_menu_lst)
$dh(me.cur_menu_lst.wrapper);if(!me.menu_lists[mi.name]){var lst=new Listing(mi.menu_item_label);lst.cl=me.menu_dt_details[mi.name].columns;lst.dt=mi.link_id;lst.opts={cell_style:{padding:'3px 2px',borderBottom:'1px dashed #CCC'},alt_cell_style:{backgroundColor:'#FFFFFF'},head_style:{height:'20px',overflow:'hidden',verticalAlign:'middle',fontWeight:'bold',padding:'1px'},head_main_style:{padding:'0px'},hide_export:1,hide_print:1,hide_refresh:0,hide_rec_label:0,show_calc:0,show_empty_tab:0,show_bottom_paging:0,round_corners:0,no_border:1,show_new:1,show_report:1}
if(user_defaults.hide_report_builder)lst.opts.show_report=0;lst.is_std_query=1;lst.get_query=function(){q={};var fl=[];q.table=repl('`tab%(dt)s`',{dt:this.dt});for(var i=0;i<this.cl.length;i++)fl.push(q.table+'.`'+this.cl[i][0]+'`')
q.fields=fl.join(', ');q.conds=q.table+'.docstatus < 2 ';this.sort_order=in_list(this.coltypes,'Date')?'DESC':'ASC';this.sort_by='name';this.query=repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s",q);this.query_max=repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s",q);}
lst.colwidths=['5%'];lst.colnames=['Sr'];lst.coltypes=['Data'];lst.coloptions=[''];for(var i=0;i<lst.cl.length;i++){lst.colwidths[i+1]=cint(100/lst.cl.length)+'%';lst.colnames[i+1]=lst.cl[i][1];lst.coltypes[i+1]=lst.cl[i][2];lst.coloptions[i+1]=lst.cl[i][3];}
lst.make($a(this.body,'div','',{display:'none'}));var sf=me.menu_dt_details[mi.name].filters;for(var i=0;i<sf.length;i++){if(in_list(['Int','Currency','Float','Date'],sf[i][2])){lst.add_filter('From '+sf[i][1],sf[i][2],sf[i][3],mi.link_id,sf[i][0],'>=');lst.add_filter('To '+sf[i][1],sf[i][2],sf[i][3],mi.link_id,sf[i][0],'<=');}else{lst.add_filter(sf[i][1],sf[i][2],sf[i][3],mi.link_id,sf[i][0],(in_list(['Data','Text','Link'],sf[i][2])?'LIKE':''));}}
me.menu_lists[mi.name]=lst;lst.run();}
$ds(me.menu_lists[mi.name].wrapper);me.cur_menu_lst=me.menu_lists[mi.name];}
var sidebar_menu;function setup_side_bar(){if(!left_sidebar_width)return;sidebar_menu=new SidebarMenu();sidebar_menu.make_menu('');}
startup_lst[startup_lst.length]=setup_side_bar;var n_tweets={};var last_comments={};function Tweets(parent){this.tag=null;this.last_comment='';this.wrapper=$a(parent,'div','',{padding:'8px'});var ht=make_table($a(this.wrapper,'div'),1,1,'100%',['100%'],{textAlign:'center',verticalAlign:'middle'})
this.label=$a($td(ht,0,0),'div');this.label.innerHTML='Write Something';this.inp=$a($a($td(ht,0,0),'div'),'input','',{width:'180px',margin:'4px 0px'});var me=this;this.btn=$a($td(ht,0,0),'button');this.btn.innerHTML='Send';this.btn.onclick=function(){if(strip(me.inp.value)){$c_obj('Home Control','send_tweet',(me.inp.value+'~~~'+(me.tag?me.tag:'')),function(r,rt){me.tweet_lst.run();});}
me.comment_added=1;me.last_comment=me.inp.value;me.inp.value='';}
var lst=new Listing('Tweets',1,1);lst.opts.hide_export=1;lst.opts.hide_print=1;lst.opts.hide_refresh=1;lst.opts.no_border=1;lst.opts.hide_rec_label=1;lst.opts.show_calc=0;lst.opts.round_corners=0;lst.opts.alt_cell_style={};lst.opts.cell_style={padding:'3px'};lst.page_len=10;lst.colwidths=['100%'];lst.coltypes=['Data'];lst.get_query=function(){var tag_cond='';if(me.tag)tag_cond=' and t1.`tag`="'+me.tag+'" ';this.query=repl('select t1.creation, t1.by, t1.comment, t2.file_list from tabTweet t1, tabProfile t2 where t1.by = t2.name %(tag_cond)s order by t1.name desc',{tag_cond:tag_cond});this.query_max=repl('select count(*) from tabTweet t1 where docstatus<2 %(tag_cond)s',{tag_cond:tag_cond});}
lst.show_cell=function(cell,ri,ci,d){var div=$a(cell,'div','',{paddingBottom:'2px',marginBottom:'2px',borderBottom:'1px dashed #CCC'});var t=make_table(div,1,2,'100%',['10%','90%'],{textAlign:'left'});if(d[ri][3]){var img=$a($td(t,0,0),'img','',{width:'40px'});var img_src=d[ri][3].split(NEWLINE)[0].split(',')[0];img.src=repl('cgi-bin/getfile.cgi?ac=%(ac)s&name=%(fn)s&thumbnail=40',{fn:img_src,ac:session.account_name});}else{var div=make_table($td(t,0,0),1,1,'40px',['100%']);var np_div=$td(div,0,0);np_div.innerHTML='No Picture';$y(np_div,{color:'#AAA',fontSize:'11px',padding:'2px',verticalAlign:'middle',textAlign:'center',border:'1px solid #AAA'});}
$td(t,0,1).innerHTML=repl('<div class="comment" style="font-size:11px">%(by)s: %(on)s</div><div style="font-size: 12px;">%(comment)s</div>',{'by':d[ri][1],'on':dateutil.str_to_user(d[ri][0]),'comment':d[ri][2]});}
this.inp.onkeypress=function(e){if(isIE)var kc=window.event.keyCode;else var kc=e.keyCode;if(kc==13)me.btn.onclick();}
lst.make(this.wrapper);this.tweet_lst=lst;this.msg_area=$a(this.wrapper,'div','',{margin:'4px 0px'});lst.onrun=function(){if(!this.total_records)me.msg_area.innerHTML='No comments yet. Be the first one to comment!';else me.msg_area.innerHTML='';}
this.show=function(tag){me.tag=tag;me.tweet_lst.run();}}
var tweet_dialog;function setup_tweets(){tweet_dialog=document.createElement('div');$y(tweet_dialog,{height:'360px',width:'240px'})
tweet_dialog.tweets=new Tweets(tweet_dialog);tweet_dialog.show=function(){this.tweets.comment_added=false;this.tweets.show(cur_frm.doctype+'/'+cur_frm.docname);}
tweet_dialog.hide=function(){n_tweets[tweet_dialog.tweets.tag]=cint(tweet_dialog.tweets.tweet_lst.total_records);last_comments[tweet_dialog.tweets.tag]=[dateutil.full_str(),user,tweet_dialog.tweets.last_comment];frm_con.comments_btn.innerHTML='Comments ('+n_tweets[tweet_dialog.tweets.tag]+')';if(tweet_dialog.tweets.comment_added)
cur_frm.set_last_comment();}}
startup_lst[startup_lst.length]=setup_tweets;function set_user_img(img,username){function set_it(){if(user_img[username]=='no_img')
img.src='images/ui/no_img/no_img_m.gif';else
img.src=repl('cgi-bin/getfile.cgi?ac=%(ac)s&name=%(fn)s',{fn:user_img[username],ac:session.account_name});}
if(user_img[username])
set_it();else
$c('get_user_img',{username:username},function(r,rt){user_img[username]=r.message;set_it();},null,1);}
function print_doc(){frm_con.tbarlinks.selectedIndex=0;if(cur_frm.doc.docstatus==2){msgprint("Cannot Print Cancelled Documents.");return;}
if(cint(cur_frm.doc.docstatus)==0&&cur_frm.perm[0][SUBMIT]){}
if(cur_frm.print_sel.options.length>1){print_doc_dialog.show();}else{print_format('Standard',print_go);}}
function makeformatselector(frm){fl=getchildren('DocFormat',frm.meta.name,'formats','DocType');frm.print_sel=document.createElement('select');frm.print_sel.options[0]=new Option('Standard','Standard',false,false);for(var i=0;i<fl.length;i++){frm.print_sel.options[frm.print_sel.options.length]=new Option(fl[i].format,fl[i].format,false,false);}
frm.print_sel.selectedIndex==0;}
var print_doc_dialog;function makeprintdialog(){var d=new Dialog(360,140,"Print Formats");$dh(d.wrapper);d.make_body([['HTML','Select'],['Button','Go',execute_print]]);print_doc_dialog=d;d.onshow=function(){var c=d.widgets['Select'];if(c.cur_sel)c.removeChild(c.cur_sel);c.appendChild(cur_frm.print_sel);c.cur_sel=cur_frm.print_sel;}}
function execute_print(){print_format(sel_val(cur_frm.print_sel),print_go);}
var email_dialog;function sendmail(emailto,emailfrom,cc,subject,message,fmt,with_attachments){var fn=function(html){$c('sendmail',{'sendto':emailto,'sendfrom':emailfrom?emailfrom:'','cc':cc?cc:'','subject':subject,'message':message,'body':html,'with_attachments':with_attachments?1:0,'dt':cur_frm.doctype,'dn':cur_frm.docname},function(r,rtxt){});}
print_format(fmt,fn);}
function email_doc(){if(!cur_frm)return;sel=makeformatselector(cur_frm);$td(email_dialog.rows['Format'].tab,0,1).innerHTML='';$td(email_dialog.rows['Format'].tab,0,1).appendChild(cur_frm.print_sel);email_dialog.widgets['Subject'].value=cur_frm.meta.name+': '+cur_frm.docname;email_dialog.show();frm_con.tbarlinks.selectedIndex=0;}
var email_as_field='email_id';var email_as_dt='Contact';var email_as_in='email_id,contact_name';function makeemail(){var d=new Dialog(440,440,"Send Email");$dh(d.wrapper);var email_go=function(){var emailfrom=d.widgets['From'].value;var emailto=d.widgets['To'].value;if(!emailfrom)
emailfrom=user_email;var email_list=emailto.split(/[,|;]/);var valid=1;for(var i=0;i<email_list.length;i++){if(!validate_email(email_list[i])){msgprint('error:'+email_list[i]+' is not a valid email id');valid=0;}}
if(emailfrom&&!validate_email(emailfrom)){msgprint('error:'+emailfrom+' is not a valid email id. To change the default please click on Profile on the top right of the screen and change it.');return;}
if(!valid)return;var cc=emailfrom;if(!emailfrom){emailfrom=locals['Control Panel']['Control Panel'].auto_email_id;cc='';}
sendmail(emailto,emailfrom,emailfrom,d.widgets['Subject'].value,d.widgets['Message'].value,sel_val(cur_frm.print_sel),d.widgets['Send With Attachments'].checked);email_dialog.hide();}
d.onhide=function(){hide_autosuggest();}
d.make_body([['Data','To','Example: abc@hotmail.com, xyz@yahoo.com'],['Data','Format'],['Data','Subject'],['Data','From','Optional'],['Check','Send With Attachments','Will send all attached documents (if any)'],['Text','Message'],['Button','Send',email_go]]);d.widgets['From'].value=(user_email?user_email:'');var opts={script:'',json:true,maxresults:10};var as=new bsn.AutoSuggest(d.widgets['To'],opts);as.custom_select=function(txt,sel){var r='';var tl=txt.split(',');for(var i=0;i<tl.length-1;i++)r=r+tl[i]+',';r=r+(r?' ':'')+sel;if(r[r.length-1]==NEWLINE)r=substr(0,r.length-1);return r;}
as.doAjaxRequest=function(txt){var pointer=as;var q='';var last_txt=txt.split(',');last_txt=last_txt[last_txt.length-1];var call_back=function(r,rt){as.aSug=[];if(!r.cl)return;for(var i=0;i<r.cl.length;i++){as.aSug.push({'id':r.cl[i],'value':r.cl[i],'info':''});}
as.createList(as.aSug);}
$c('get_contact_list',{'select':email_as_field,'from':email_as_dt,'where':email_as_in,'txt':(last_txt?strip(last_txt):'%')},call_back);return;}
var sel;email_dialog=d;}
function is_doc_loaded(dt,dn){var exists=false;if(locals[dt]&&locals[dt][dn])exists=true;if(exists&&dt=='DocType'&&!locals[dt][dn].__islocal&&!inList(loaded_doctypes,dn))
exists=false;return exists;}
function FrmContainer(){}
FrmContainer.prototype=new Container()
FrmContainer.prototype.oninit=function(){this.make_head();this.make_toolbar();make_text_dialog();}
FrmContainer.prototype.make_head=function(){this.head_div=$a(this.head,'div','',{borderBottom:'1px solid #AAA',margin:'0px 4px'});this.tbartab=make_table($a(this.head_div,'div'),1,2,'100%',['50%','50%'],{backgroundColor:"#DDD"});$y($td(this.tbartab,0,0),{padding:'4px'});this.main_title=$a($td(this.tbartab,0,0),'h2','',{margin:'0px 8px',display:'inline'});this.sub_title=$a($td(this.tbartab,0,0),'div','',{display:'inline'});this.sub_title.is_inline=1;this.status_title=$a($td(this.tbartab,0,0),'span','',{marginLeft:'8px'});this.status_title.is_inline=1;this.tbar_div=$a($td(this.tbartab,0,1),'div','',{marginRight:'8px',textAlign:'right'})
var tab2=make_table(this.tbar_div,1,4,'400px',['60px','120px','160px','60px'],{textAlign:'center',padding:'3px',verticalAlign:'middle'});$y(tab2,{cssFloat:'right'});$y($td(tab2,0,0),{textAlign:'right'});var comm_img=$a($td(tab2,0,0),'img','',{marginRight:'4px',paddingTop:'2px'});comm_img.src='images/icons/comments.gif';var c=$td(tab2,0,1);this.comments_btn=$a(c,'div','link_type',{padding:'0px 2px',position:'relative',display:'inline'});$y(c,{textAlign:'left'});this.comments_btn.dropdown=new DropdownMenu(c,'240px');$y(this.comments_btn.dropdown.body,{height:'400px'});c.set_unselected=function(){tweet_dialog.hide();}
this.comments_btn.onmouseover=function(){$y(c,{backgroundColor:'#EEE'});if(cur_frm.doc.__islocal){return;}
this.dropdown.body.appendChild(tweet_dialog);this.dropdown.show();tweet_dialog.show();}
this.comments_btn.onmouseout=function(){$y(c,{backgroundColor:'#DDD'});this.dropdown.clear();}
this.comments_btn.innerHTML='Comments';this.tbarlinks=$a($td(tab2,0,2),'select','',{width:'120px'});select_register[select_register.length]=this.tbarlinks;$y($td(tab2,0,3),{padding:'6px 0px 2px 0px',textAlign:'right'});this.close_btn=$a($td(tab2,0,3),'img','',{cursor:'pointer'});this.close_btn.src="images/icons/close.gif";this.close_btn.onclick=function(){nav_obj.show_last_open();}
this.tbartab2=make_table($a(this.head_div,'div'),1,2,'100%',['50%','50%']);var t=make_table($a($td(this.tbartab2,0,0),'div'),1,2,'100%',['38%','62%'])
this.button_area=$a($td(t,0,1),'div','',{margin:'4px'});this.last_update_area=$a($td(t,0,1),'div','',{margin:'0px 4px 4px 4px',color:"#888"});this.owner_img=$a($td(t,0,0),'img','',{margin:'4px 8px 4px 0px',width:'40px',display:'inline'});this.owner_img.is_inline=1;this.mod_img=$a($td(t,0,0),'img','',{margin:'4px 8px 4px 0px',width:'40px',display:'inline'});this.mod_img.is_inline=1;this.last_comment=$a($td(this.tbartab2,0,1),'div','',{display:'none',paddingTop:'4px'});var t=make_table(this.last_comment,1,2,'100%',['40px','']);this.last_comment.img=$a($td(t,0,0),'img','',{width:'40px',marginBottom:'8px'});this.last_comment.comment=$a($td(t,0,1),'div','',{backgroundColor:'#FFFAAA',padding:'4px',height:'32px'})
this.head_elements=[this.button_area,this.tbar_div,this.owner_img,this.mod_img,this.sub_title,this.status_title,this.last_update_area];}
FrmContainer.prototype.show_head=function(){$ds(this.head_div);}
FrmContainer.prototype.hide_head=function(){$dh(this.head_div);}
FrmContainer.prototype.refresh=function(){}
FrmContainer.prototype.make_toolbar=function(){this.btns={};var me=this;var makebtn=function(label,fn,bold){var btn=$a(me.button_area,'button');btn.l_area=$a(btn,'span');btn.l_area.innerHTML=label;btn.onclick=fn;if(bold)$y(btn.l_area,{fontWeight:'bold'});btn.show=function(){if(isFF)$y(this,{display:'-moz-inline-box'});else $y(this,{display:'inline-block'});}
btn.hide=function(){$dh(this);}
me.btns[label]=btn;}
makebtn('Edit',edit_doc);makebtn('Save',function(){save_doc('Save');},1);makebtn('Submit',savesubmit);makebtn('Cancel',savecancel);makebtn('Amend',amend_doc);me.tbarlinks.onchange=function(){var v=sel_val(this);if(v=='New')new_doc();else if(v=='Refresh')reload_doc();else if(v=='Print')print_doc();else if(v=='Email')email_doc();else if(v=='Copy')copy_doc();}
makeemail();makeprintdialog();}
FrmContainer.prototype.refresh_save_btns=function(){var frm=cur_frm;var p=frm.get_doc_perms();if(cur_frm.editable)this.btns['Edit'].hide();else this.btns['Edit'].show();if(cur_frm.editable&&cint(frm.doc.docstatus)==0&&p[WRITE])this.btns['Save'].show();else this.btns['Save'].hide();if(cur_frm.editable&&cint(frm.doc.docstatus)==0&&p[SUBMIT]&&(!frm.doc.__islocal))this.btns['Submit'].show();else this.btns['Submit'].hide();if(cur_frm.editable&&cint(frm.doc.docstatus)==1&&p[CANCEL])this.btns['Cancel'].show();else this.btns['Cancel'].hide();if(cint(frm.doc.docstatus)==2&&p[AMEND])this.btns['Amend'].show();else this.btns['Amend'].hide();}
FrmContainer.prototype.refresh_opt_btns=function(){var frm=cur_frm;var ol=['Actions...','New','Refresh'];if(!frm.meta.allow_print)ol.push('Print');if(!frm.meta.allow_email)ol.push('Email');if(!frm.meta.allow_copy)ol.push('Copy');empty_select(this.tbarlinks);add_sel_options(this.tbarlinks,ol,'Actions...');}
FrmContainer.prototype.show_toolbar=function(){for(var i=0;i<this.head_elements.length;i++)this.head_elements[i].is_inline?$di(this.head_elements[i]):$ds(this.head_elements[i]);this.refresh_save_btns();this.refresh_opt_btns();}
FrmContainer.prototype.hide_toolbar=function(){for(var i=0;i<this.head_elements.length;i++)$dh(this.head_elements[i]);}
FrmContainer.prototype.refresh_toolbar=function(){var frm=cur_frm;if(frm.meta.hide_heading){this.hide_head();}
else{this.show_head();if(frm.meta.hide_toolbar){this.hide_toolbar();}else{this.show_toolbar();}}}
FrmContainer.prototype.add_frm=function(doctype,onload,opt_name){if(frms['DocType']&&frms['DocType'].opendocs[doctype]){msgprint("error:Cannot create an instance of \""+doctype+"\" when the DocType is open.");return;}
if(frms[doctype]){return frms[doctype];}
var me=this;var fn=function(r,rt){if(!locals['DocType'][doctype]){return;}
new Frm(doctype,me.body);if(onload)onload(r,rt);}
if(opt_name&&(!is_doc_loaded(doctype,opt_name))){$c('getdoc',{'name':opt_name,'doctype':doctype,'getdoctype':1,'user':user},fn,null,null,'Loading '+opt_name);}else{$c('getdoctype',args={'doctype':doctype},fn,null,null,'Loading '+doctype);}}
var dialog_record;function edit_record(dt,dn){if(!dialog_record){dialog_record=new Dialog(640,400,'Edit Row');dialog_record.body_wrapper=$a(dialog_record.body,'div','dialog_frm');dialog_record.done_btn=$a($a(dialog_record.body,'div','',{margin:'8px'}),'button');dialog_record.done_btn.innerHTML='Done';dialog_record.done_btn.onclick=function(){dialog_record.hide()}
dialog_record.onhide=function(){if(cur_grid)
cur_grid.refresh_row(cur_grid_ridx,dialog_record.dn);}}
if(!frms[dt]){var f=new Frm(dt,dialog_record.body_wrapper);f.parent_doctype=cur_frm.doctype;f.parent_docname=cur_frm.docname;f.in_dialog=true;f.meta.section_style='Simple';}
if(dialog_record.cur_frm){dialog_record.cur_frm.hide();}
var frm=frms[dt];frm.show(dn);dialog_record.cur_frm=frm;dialog_record.dn=dn;dialog_record.set_title("Editing Row #"+(cur_grid_ridx+1));dialog_record.show();}
function Frm(doctype,parent){this.docname='';this.doctype=doctype;this.display=0;this.in_dialog=false;var me=this;this.is_editable={};this.opendocs={};this.cur_section={};this.sections=[];this.grids=[];this.cscript={};this.parent=parent;if(!parent)this.parent=frm_con.body;this.attachments={};frms[doctype]=this;this.setup_meta(doctype);}
Frm.prototype.onhide=function(){if(grid_selected_cell)grid_selected_cell.grid.cell_deselect();}
Frm.prototype.onshow=function(){}
Frm.prototype.makeprint=function(){makeformatselector(this);}
Frm.prototype.set_heading=function(){var prnname=this.docname;if(this.meta.issingle)prnname=this.doctype;if(frm_con.main_title.innerHTML!=prnname)
frm_con.main_title.innerHTML=prnname;var dt=this.doctype;if(this.meta.issingle)dt='';if(frm_con.sub_title.innerHTML!=dt)
frm_con.sub_title.innerHTML=dt;var doc=locals[this.doctype][this.docname];var tn=$i('rec_'+this.doctype+'-'+this.docname);var set_st=function(col){if(tn)$bg(tn,col);}
var st="";if(doc.__islocal){st="<span style='color:#f81'>Unsaved Draft</span>";set_st('#f81');}else if(doc.__unsaved){st="<span style='color:#f81'>Not Saved</span>";set_st('#f81');}else if(cint(doc.docstatus)==0){st="<span style='color:#0a1'>Saved</span>";set_st('#0A1');}else if(cint(doc.docstatus)==1){st="<span style='color:#44f'>Submitted</span>";set_st('#44F');}else if(cint(doc.docstatus)==2){st="<span style='color:#f44'>Cancelled</span>";set_st('#F44');}
var tm='';if(is_testing&&this.meta.setup_test)
var tm='<span style="margin-left: 4px; padding: 4px; color: #FFF; background-color: #F88;">Test Record</span>';frm_con.status_title.innerHTML=st.bold()+tm;var scrub_date=function(d){if(d)t=d.split(' ');else return'';return dateutil.str_to_user(t[0])+' '+t[1];}
var t=doc.doctype+'/'+doc.name;frm_con.comments_btn.innerHTML='Comments ('+cint(n_tweets[t])+')';this.set_last_comment();var created_str=repl("Created: %(c_by)s %(c_on)s %(m_by)s %(m_on)s",{c_by:doc.owner,c_on:scrub_date(doc.creation?doc.creation:''),m_by:doc.modified_by?('/ Modified: '+doc.modified_by):'',m_on:doc.modified?('on '+scrub_date(doc.modified)):''});set_user_img(frm_con.owner_img,doc.owner);frm_con.owner_img.title=created_str;frm_con.last_update_area.innerHTML='';$dh(frm_con.mod_img);if(doc.modified_by){frm_con.last_update_area.innerHTML=scrub_date(doc.modified?doc.modified:'')+' <span class="link_type" style="margin-left: 8px; font-size: 10px;" onclick="msgprint(\''+created_str.replace('/','<br>')+'\')">Details</span>';if(doc.owner!=doc.modified_by){$di(frm_con.mod_img);set_user_img(frm_con.mod_img,doc.modified_by);frm_con.mod_img.title=created_str;}}
if(this.heading){if(this.meta.hide_heading)$dh(frm_con.head_div);else $ds(frm_con.head_div);}}
Frm.prototype.set_last_comment=function(){var t=this.doc.doctype+'/'+this.doc.name;var lc=last_comments[t]
if(lc&&lc[2]){frm_con.last_comment.comment.innerHTML='Last Comment: <b>'+lc[2]+'</b><div id="comment" style="font-size:11px">By '+lc[1]+' on '+dateutil.str_to_user(lc[0])+'</div>';$ds(frm_con.last_comment);set_user_img(frm_con.last_comment.img,lc[1]);}else{$dh(frm_con.last_comment);}}
Frm.prototype.setup_meta=function(){this.meta=get_local('DocType',this.doctype);this.perm=get_perm(this.doctype);this.makeprint();}
Frm.prototype.setup_attach=function(){var me=this;this.attach_area=$a(this.layout.cur_row.wrapper,'div','attach_area');if(!this.meta.max_attachments)
this.meta.max_attachments=10;var tab=$a($a(this.attach_area,'div'),'table');tab.insertRow(0);var label_area=tab.rows[0].insertCell(0);var main_area=tab.rows[0].insertCell(1);this.files_area=$a(main_area,'div');this.btn_area=$a(main_area,'div');$w(label_area,"33%");var d=$a(label_area,'div');var img=$a(d,'img','',{marginRight:'8px'});img.src='images/icons/paperclip.gif';$a(d,'span').innerHTML='File Attachments:';me.attach_msg=$a(label_area,'div','comment',{padding:'8px',fontSize:'11px'});me.attach_msg.innerHTML="Changes made to the attachments are not permanent until the document is saved";var btn_add_attach=$a(this.btn_area,'button');btn_add_attach.innerHTML='Add';btn_add_attach.onclick=function(){me.add_attachment();me.sync_attachments(me.docname);me.refresh_attachments();}}
Frm.prototype.refresh_attachments=function(){if(!this.perm[0][WRITE]){$dh(this.btn_area);}
else{$ds(this.btn_area);}
var nattach=0;for(var dn in this.attachments){for(var i in this.attachments[dn]){var a=this.attachments[dn][i];if(a.docname!=this.docname)
a.hide();else{a.show();nattach++;if(this.perm[0][WRITE]&&this.editable){$ds(a.delbtn);}
else{$dh(a.delbtn);}}}}
if(this.editable){if(nattach>=cint(this.meta.max_attachments))
$dh(this.btn_area);else
$ds(this.btn_area);}else{$dh(this.btn_area);}}
Frm.prototype.set_attachments=function(){this.attachments[this.docname]=[];var atl=locals[this.doctype][this.docname].file_list;if(atl){atl=atl.split('\n');for(var i in atl){var a=atl[i].split(',');var ff=this.add_attachment(a[0],a[1]);}}}
Frm.prototype.add_attachment=function(filename,fileid){var at_id=this.attachments[this.docname].length;var ff=new FileField(this.files_area,at_id,this);if(filename)ff.filename=filename;if(fileid)ff.fileid=fileid;ff.docname=this.docname;this.attachments[this.docname][at_id]=ff;ff.refresh();return ff;}
Frm.prototype.sync_attachments=function(docname){var fl=[];for(var i in this.attachments[docname]){var a=this.attachments[docname][i];fl[fl.length]=a.filename+','+a.fileid;}
locals[this.doctype][docname].file_list=fl.join('\n')}
function FileField(parent,at_id,frm,addlink){var me=this;this.at_id=at_id
this.wrapper=$a(parent,'div');var tab=$a(this.wrapper,'table');tab.insertRow(0);var main_area=tab.rows[0].insertCell(0);var del_area=tab.rows[0].insertCell(1);$w(del_area,'20%');this.delbtn=$a(del_area,'div','link_type');this.delbtn.innerHTML='Remove';this.remove=function(){var yn=confirm("The document will be saved after the attachment is deleted for the changes to be permanent. Proceed?")
if(yn){me.wrapper.style.display='none';var fid=frm.attachments[frm.docname][me.at_id].fileid;if(fid){$c('remove_attach',args={'fid':fid},function(r,rt){});}
delete frm.attachments[frm.docname][me.at_id];frm.sync_attachments(frm.docname);var ret=frm.save('Save');if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");}}
this.hide=function(){$dh(me.wrapper);}
this.show=function(){$ds(me.wrapper);}
this.delbtn.onclick=this.remove;this.upload_div=$a(main_area,'div');this.download_div=$a(main_area,'div');var div=$a(this.upload_div,'div');div.innerHTML='<iframe id="RSIFrame" name="RSIFrame" src="blank1.html" style="width:400px; height:100px; border:0px"></iframe>';var div=$a(this.upload_div,'div');div.innerHTML='<form method="POST" enctype="multipart/form-data" action="'+outUrl+'" target="RSIFrame"></form>';var ul_form=div.childNodes[0];var f_list=[];var inp_fdata=$a_input($a(ul_form,'span'),'file','filedata');var inp=$a_input($a(ul_form,'span'),'hidden','cmd');inp.value='uploadfile';var inp=$a_input($a(ul_form,'span'),'hidden','__account');inp.value=account_id;if(__sid150)
var inp=$a_input($a(ul_form,'span'),'hidden','sid150');inp.value=__sid150;var inp=$a_input($a(ul_form,'span'),'submit');inp.value='Upload';var inp=$a_input($a(ul_form,'span'),'hidden','doctype');inp.value=frm.doctype;var inp=$a_input($a(ul_form,'span'),'hidden','docname');inp.value=frm.docname;var inp=$a_input($a(ul_form,'span'),'hidden','at_id');inp.value=at_id;this.download_link=$a(this.download_div,'a','link_type');this.refresh=function(){if(this.filename){$dh(this.upload_div);this.download_link.innerHTML=this.filename;this.download_link.href=outUrl+'?cmd=downloadfile&file_id='+this.fileid+"&__account="+account_id+(__sid150?("&sid150="+__sid150):'');this.download_link.target="_blank";$ds(this.download_div);}else{$ds(this.upload_div);$dh(this.download_div);}}}
function file_upload_done(doctype,docname,fileid,filename,at_id){var at_id=cint(at_id);var frm=frms[doctype];var a=frm.attachments[docname][at_id];a.filename=filename;a.fileid=fileid;frm.sync_attachments(docname);a.refresh();var do_save=confirm('File Uploaded Sucessfully. You must save this document for the uploaded file to be registred. Save this document now?');if(do_save){var ret=frm.save('Save');if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");}else{msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");}}
Frm.prototype.set_section=function(sec_id){this.sections[this.cur_section[this.docname]].hide();this.sections[sec_id].show();this.cur_section[this.docname]=sec_id;}
Frm.prototype.setup_tabs=function(){var me=this;$ds(this.tab_wrapper);$y(this.tab_wrapper,{marginTop:'8px'});this.tabs=new TabbedPage(this.tab_wrapper,1);}
Frm.prototype.setup_tips=function(){var me=this;this.tip_box=$a(this.tip_wrapper,'div','frm_tip_box');var tab=$a(this.tip_box,'table');var r=tab.insertRow(0);var c0=r.insertCell(0);this.c1=r.insertCell(1);this.img=$a(c0,'img');this.img.setAttribute('src','images/icons/lightbulb.gif');c0.style.width='24px';this.set_tip=function(t,icon){me.c1.innerHTML=t;$ds(me.tip_box);if(icon)this.img.setAttribute('src','images/icons/'+icon);}
this.append_tip=function(t){if(me.c1.innerHTML)me.c1.innerHTML+='<br><br>';me.c1.innerHTML+=t;$ds(me.tip_box);}
this.clear_tip=function(){me.c1.innerHTML='';$dh(me.tip_box);}
$dh(this.tip_box);}
Frm.prototype.setup_std_layout=function(){if(this.in_dialog)$w(this.wrapper,'500px');this.header=$a(this.wrapper,'div','frm_header');this.heading=$a(this.header,'div','frm_heading');this.tab_wrapper=$a(this.header,'div');$dh(this.tab_wrapper);if(this.meta.section_style=='Tray'){var t=$a(this.wrapper,'table','',{tableLayout:'fixed',width:'100%',borderCollapse:'collapse'});var r=t.insertRow(0);var c=r.insertCell(0);c.className='frm_tray_area';this.tray_area=c;this.body=$a(r.insertCell(1),'div','frm_body');}else{this.body=$a(this.wrapper,'div','frm_body');}
this.tip_wrapper=$a(this.body,'div');if(this.in_dialog)this.meta.hide_heading=1;this.layout=new Layout(this.body,'100%');this.setup_tips();if(this.meta.section_style=='Tabbed')
this.setup_tabs();if(isIE&&this.body){this.body.onscroll=function(){refresh_scroll_heads();}}
if(this.meta.colour)this.layout.wrapper.style.background='#'+this.meta.colour.split(':')[1];this.setup_fields_std();}
Frm.prototype.setup_fields_std=function(){var fl=fields_list[this.doctype];if(fl[0]&&fl[0].fieldtype!="Section Break"){this.layout.addrow();if(fl[0].fieldtype!="Column Break")
this.layout.addcell();}
var sec;for(var i=0;i<fl.length;i++){var f=fl[i];var fn=f.fieldname?f.fieldname:f.label;var fld=make_field(f,this.doctype,this.layout.cur_cell,this);this.fields[this.fields.length]=fld;this.fields_dict[fn]=fld;if(sec)sec.fields[sec.fields.length]=fld;if(f.fieldtype=='Section Break')
sec=fld;if((f.fieldtype=='Section Break')&&(fl[i+1])&&(fl[i+1].fieldtype!='Column Break')){this.layout.addcell();}}}
Frm.prototype.setup_template_layout=function(){this.body=$a(this.wrapper,'div');this.body.innerHTML=this.meta.dt_template;var dt=this.doctype.replace(/ /g,'');this.meta.hide_heading=1;var fl=fields_list[this.doctype];for(var i=0;i<fl.length;i++){var f=fl[i];var fn=f.fieldname?f.fieldname:f.label;var field_area=$i('frm_'+dt+'_'+fn);if(field_area){var fld=make_field(f,this.doctype,field_area,this,0,1);this.fields[this.fields.length]=fld;this.fields_dict[fn]=fld;}}}
Frm.prototype.setup_client_script=function(){if(this.meta.client_script_core||this.meta.client_script||this.meta.__client_script){this.runclientscript('setup',this.doctype,this.docname);}
this.script_setup=1;}
Frm.prototype.setup=function(){var me=this;this.fields=[];this.fields_dict={};if(this.in_dialog)this.wrapper=$a(this.parent,'div');else this.wrapper=$a(this.parent,'div','frm_wrapper');if(this.meta.use_template){this.setup_template_layout();}else{this.setup_std_layout();}
if(this.meta.allow_attach)
this.setup_attach();this.setup_done=true;}
function set_multiple(dt,dn,dict,table_field){var d=locals[dt][dn];for(var key in dict){d[key]=dict[key];if(table_field)refresh_field(key,d.name,table_field);else refresh_field(key);}}
function refresh_many(flist,dn,table_field){for(var i in flist){if(table_field)refresh_field(flist[i],dn,table_field);else refresh_field(flist[i]);}}
function set_field_tip(n,txt){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.description=txt;if(cur_frm&&cur_frm.fields_dict){if(cur_frm.fields_dict[n])
cur_frm.fields_dict[n].comment_area.innerHTML=replace_newlines(txt);else
errprint('[set_field_tip] Unable to set field tip: '+n);}}
function refresh_field(n,docname,table_field){if(table_field){if(dialog_record&&dialog_record.display){if(dialog_record.cur_frm.fields_dict[n]&&dialog_record.cur_frm.fields_dict[n].refresh)
dialog_record.cur_frm.fields_dict[n].refresh();}else{var g=grid_selected_cell;if(g)var hc=g.grid.head_row.cells[g.cellIndex];if(g&&hc&&hc.fieldname==n&&g.row.docname==docname){hc.template.refresh();}else{cur_frm.fields_dict[table_field].grid.refresh_cell(docname,n);}}}else if(cur_frm&&cur_frm.fields_dict){if(cur_frm.fields_dict[n]&&cur_frm.fields_dict[n].refresh)
cur_frm.fields_dict[n].refresh();}}
function set_field_options(n,txt){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.options=txt;refresh_field(n);}
function set_field_permlevel(n,level){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.permlevel=level;refresh_field(n);}
function _hide_field(n,hidden){var df=get_field(cur_frm.doctype,n,cur_frm.docname);if(df)df.hidden=hidden;refresh_field(n);}
function hide_field(n){if(cur_frm){if(n.substr)_hide_field(n,1);else{for(var i in n)_hide_field(n[i],1)}}}
function unhide_field(n){if(cur_frm){if(n.substr)_hide_field(n,0);else{for(var i in n)_hide_field(n[i],0)}}}
Frm.prototype.hide=function(){if(this.layout)this.layout.hide();$dh(this.wrapper);this.display=0;hide_autosuggest();}
Frm.prototype.show=function(docname,from_refresh){if(!this.in_dialog&&cur_frm&&cur_frm!=this){this.defocus_rest();cur_frm.hide();}
if(docname)this.docname=docname;$ds(this.wrapper);this.display=1;if(!this.in_dialog)cur_frm=this;if(!from_refresh)this.refresh();}
Frm.prototype.defocus_rest=function(){mclose();if(grid_selected_cell)grid_selected_cell.grid.cell_deselect();cur_page=null;}
Frm.prototype.get_doc_perms=function(){var p=[0,0,0,0,0,0];for(var i=0;i<this.perm.length;i++){if(this.perm[i]){if(this.perm[i][READ])p[READ]=1;if(this.perm[i][WRITE])p[WRITE]=1;if(this.perm[i][SUBMIT])p[SUBMIT]=1;if(this.perm[i][CANCEL])p[CANCEL]=1;if(this.perm[i][AMEND])p[AMEND]=1;}}
return p;}
Frm.prototype.refresh=function(no_script){if(this.docname){var dt=this.parent_doctype?this.parent_doctype:this.doctype;var dn=this.parent_docname?this.parent_docname:this.docname;this.perm=get_perm(dt,dn);if(!this.setup_done)this.setup();if(!this.script_setup)
this.setup_client_script();this.runclientscript('set_perm',dt,dn);if(!this.perm[0][READ]){msgprint('No Read Permission');nav_obj.show_last_open();return;}
this.doc=get_local(this.doctype,this.docname);if(!this.opendocs[this.docname]){this.setnewdoc(this.docname);}
if(this.doc.__islocal)this.is_editable[this.docname]=1;this.editable=this.is_editable[this.docname];if(!this.in_dialog){set_title(this.meta.issingle?this.doctype:this.docname);if(!no_script)this.runclientscript('refresh');frm_con.show();frm_con.refresh_toolbar();rdocs.add(this.doctype,this.docname,1);this.set_heading();}
refresh_tabs(this);refresh_fields(this);refresh_dependency(this);if(this.layout)this.layout.show();if(this.meta.allow_attach)this.refresh_attachments();if(!this.display)this.show(this.docname,1);}
set_frame_dims();}
function refresh_tabs(me){if(!me)me=cur_frm;if(me.meta.section_style=='Tray'||me.meta.section_style=='Tabbed'){for(var i in me.sections){me.sections[i].hide();}
me.set_section(me.cur_section[me.docname]);if(isIE)refresh_scroll_heads();}}
function refresh_fields(me){if(!me)me=cur_frm;for(fkey in me.fields){var f=me.fields[fkey];f.perm=me.perm;f.docname=me.docname;if(f.refresh)f.refresh();}
on_refresh_main(me);}
function on_refresh_main(me){if(me.fields_dict['amended_from']){if(me.doc.amended_from){unhide_field('amended_from');unhide_field('amendment_date');}else{hide_field('amended_from');hide_field('amendment_date');}}
if(me.meta.autoname&&me.meta.autoname.substr(0,6)=='field:'&&!me.doc.__islocal){var fn=me.meta.autoname.substr(6);set_field_permlevel(fn,1);}}
function refresh_dependency(me){if(!me)return;var dep_dict={};var has_dep=false;for(fkey in me.fields){var f=me.fields[fkey];f.dependencies_clear=true;var guardian=f.df.depends_on;if(guardian){if(!dep_dict[guardian])
dep_dict[guardian]=[];dep_dict[guardian][dep_dict[guardian].length]=f;has_dep=true;}}
if(!has_dep)return;var d=locals[me.doctype][me.docname];function all_dependants_clear(f){if(d[f.df.fieldname])return false;var l=dep_dict[f.df.fieldname];if(l){for(var i=0;i<l.length;i++){if(!l[i].dependencies_clear){return false;}
var v=d[l[i].df.fieldname];if(v||(v==0&&!v.substr)){return false;}}}
return true;}
for(var i=me.fields.length-1;i>=0;i--){var f=me.fields[i];f.guardian_has_value=true;if(f.df.depends_on){var v=d[f.df.depends_on];if(f.df.depends_on.substr(0,3)=='fn:'){f.guardian_has_value=cur_frm.runclientscript(f.df.depends_on.substr(3),cur_frm.doctype,cur_frm.docname);}else{if(v||(v==0&&!v.substr)){}else{f.guardian_has_value=false;}}}
f.dependencies_clear=all_dependants_clear(f);if(f.guardian_has_value){if(f.grid)f.grid.show();else $ds(f.wrapper);}else{if(f.grid)f.grid.hide();else $dh(f.wrapper);}
if(!f.guardian_has_value&&!f.dependencies_clear){if(f.input)f.input.style.color="RED";}else{if(f.input)f.input.style.color="BLACK";}}}
Frm.prototype.setnewdoc=function(docname){if(this.opendocs[docname]){this.docname=docname;return;}
Meta.make_local_dt(this.doctype,docname);this.docname=docname;var me=this;var viewname=docname;if(this.meta.issingle)
viewname=this.doctype;var iconsrc='page.gif';if(this.meta.smallicon)
iconsrc=this.meta.smallicon;this.runclientscript('onload',this.doctype,this.docname);this.is_editable[docname]=1;if(this.meta.read_only_onload)
this.is_editable[docname]=0;if(this.meta.section_style=='Tray'||this.meta.section_style=='Tabbed'){this.cur_section[docname]=0;}
if(this.meta.allow_attach)
this.set_attachments();this.opendocs[docname]=true;if(this.doctype=='DocType')
loaded_doctypes[loaded_doctypes.length]=docname;}
function edit_doc(){cur_frm.is_editable[cur_frm.docname]=true;cur_frm.refresh();}
var validated=true;var validation_message='';Frm.prototype.show_doc=function(dn){this.show(dn);}
Frm.prototype.save=function(save_action,call_back){if(!save_action)save_action='Save';var me=this;if(this.savingflag){msgprint("Document is currently saving....");return;}
if(save_action=='Submit'){locals[this.doctype][this.docname].submitted_on=dateutil.full_str();locals[this.doctype][this.docname].submitted_by=user;}
if(save_action=='Cancel'){var reason=prompt('Reason for cancellation (mandatory)','');if(!strip(reason)){msgprint('Reason is mandatory, not cancelled');return;}
locals[this.doctype][this.docname].cancel_reason=reason;locals[this.doctype][this.docname].cancelled_on=dateutil.full_str();locals[this.doctype][this.docname].cancelled_by=user;}else{validated=true;validation_message='';this.runclientscript('validate',cur_frm.doctype,cur_frm.docname);if(!validated){if(validation_message)
msgprint('Validation Error: '+validation_message);this.savingflag=false;return'Error';}}
var ret_fn=function(r){cur_frm.refresh();if(call_back){if(call_back=='home'){loadpage('_home');return;}
call_back();}}
var me=this;var ret_fn_err=function(){var doc=locals[me.doctype][me.docname];me.savingflag=false;ret_fn();}
this.savingflag=true;if(this.docname&&validated){return savedoc(this.doctype,this.docname,save_action,ret_fn,ret_fn_err);}}
function make_doclist(dt,dn,deleted){var dl=[];dl[0]=locals[dt][dn];for(var ndt in locals){if(locals[ndt]){for(var ndn in locals[ndt]){var doc=locals[ndt][ndn];if(doc&&doc.parenttype==dt&&(doc.parent==dn||(deleted&&doc.__oldparent==dn))){dl[dl.length]=doc;}}}}
return dl;}
Frm.prototype.runscript=function(scriptname,callingfield,onrefresh){var me=this;if(this.docname){var doclist=compress_doclist(make_doclist(this.doctype,this.docname));if(callingfield)callingfield.input.disabled=true;$c('runserverobj',{'docs':doclist,'method':scriptname},function(r,rtxt){if(onrefresh)onrefresh(r,rtxt);me.show();if(callingfield)callingfield.input.disabled=false;});}}
function $c_get_values(args,doc,dt,dn,user_callback){var call_back=function(r,rt){if(!r.message)return;if(user_callback)user_callback(r.message);var fl=args.fields.split(',');for(var i in fl){locals[dt][dn][fl[i]]=r.message[fl[i]];if(args.table_field)
refresh_field(fl[i],dn,args.table_field);else
refresh_field(fl[i]);}}
$c('get_fields',args,call_back);}
function get_server_fields(method,arg,table_field,doc,dt,dn,allow_edit,call_back){if(!allow_edit)freeze('Fetching Data...');$c('runserverobj',args={'method':method,'docs':compress_doclist([doc]),'arg':arg},function(r,rt){if(r.message){var d=locals[dt][dn];var field_dict=eval('var a='+r.message+';a');for(var key in field_dict){d[key]=field_dict[key];if(table_field)refresh_field(key,d.name,table_field);else refresh_field(key);}}
if(call_back){doc=locals[doc.doctype][doc.name];call_back(doc,dt,dn);}
if(!allow_edit)unfreeze();});}
Frm.prototype.runclientscript=function(caller,cdt,cdn){var _dt=this.parent_doctype?this.parent_doctype:this.doctype;var _dn=this.parent_docname?this.parent_docname:this.docname;var doc=get_local(_dt,_dn);if(!cdt)cdt=this.doctype;if(!cdn)cdn=this.docname;var ret=null;try{if(this.cscript[caller])
ret=this.cscript[caller](doc,cdt,cdn);if(this.cscript['custom_'+caller])
ret+=this.cscript['custom_'+caller](doc,cdt,cdn);}catch(e){submit_error(e);}
if(caller&&caller.toLowerCase()=='setup'){var doctype=get_local('DocType',this.doctype);var cs=doctype.__client_script?doctype.__client_script:(doctype.client_script_core+doctype.client_script);if(cs){try{var tmp=eval(cs);}catch(e){submit_error(e);}}
if(doctype.client_string){cur_frm.cstring={};var elist=doctype.client_string.split('---');for(var i=1;i<elist.length;i=i+2){cur_frm.cstring[strip(elist[i])]=elist[i+1];}}}
return ret;}
function ColumnBreak(){this.set_input=function(){};}
var cur_col_break_width;ColumnBreak.prototype.make_body=function(){if((!this.perm[this.df.permlevel])||(!this.perm[this.df.permlevel][READ])||this.df.hidden){return;}
this.cell=this.frm.layout.addcell(this.df.width);cur_col_break_width=this.df.width;var fn=this.df.fieldname?this.df.fieldname:this.df.label;if(this.df&&this.df.label){this.label=$a(this.cell.wrapper,'div','columnHeading');this.label.innerHTML=this.df.label;}}
ColumnBreak.prototype.refresh=function(layout){if(!this.cell)return;var fn=this.df.fieldname?this.df.fieldname:this.df.label;if(fn){this.df=get_field(this.doctype,fn,this.docname);if(this.set_hidden!=this.df.hidden){if(this.df.hidden)
this.cell.hide();else
this.cell.show();this.set_hidden=this.df.hidden;}}}
function SectionBreak(){this.set_input=function(){};}
SectionBreak.prototype.make_row=function(){this.row=this.frm.layout.addrow();}
SectionBreak.prototype.make_simple_section=function(static){var head=$a(this.row.header,'div','',{margin:'4px 8px 0px 8px'});var me=this;var has_col=false;if(this.df.colour){has_col=true;var col=this.df.colour.split(':')[1];if(col!='FFF'){$y(this.row.sub_wrapper,{margin:'8px',padding:'0px',border:('1px solid #'+get_darker_shade(col,0.75)),backgroundColor:('#'+col)});}}
if(static){this.label=$a(head,'div','sectionHeading',{margin:'8px 0px'});this.label.innerHTML=this.df.label?this.df.label:'';return;}
if(this.df.label){var t=make_table($a(head,'div'),1,2,'100%',['20px',null],{verticalAlign:'middle'});$y(t,{borderCollapse:'collapse'});this.label=$a($td(t,0,1),'div','sectionHeading');this.label.innerHTML=this.df.label?this.df.label:'';this.exp_icon=$a($td(t,0,0),'img','',{cursor:'pointer'});this.exp_icon.src=min_icon;this.exp_icon.onclick=function(){if(me.row.body.style.display.toLowerCase()=='none')me.exp_icon.expand();else me.exp_icon.collapse();}
this.exp_icon.expand=function(){$ds(me.row.body);me.exp_icon.src=min_icon;}
this.exp_icon.collapse=function(){$dh(me.row.body);me.exp_icon.src=exp_icon;}
$y(head,{padding:'2px',borderBottom:'1px solid #ccc',margin:'8px'});this.collapse=this.exp_icon.collapse;this.expand=this.exp_icon.expand;}else if(!has_col){$y(head,{margin:'8px',borderBottom:'2px solid #445'});}}
var cur_sec_header;SectionBreak.prototype.make_body=function(){this.fields=[];if((!this.perm[this.df.permlevel])||(!this.perm[this.df.permlevel][READ])||this.df.hidden){return;}
var me=this;if(this.frm.meta.section_style=='Tabbed'){if(this.df.options!='Simple'){this.sec_id=this.frm.sections.length;this.frm.sections[this.sec_id]=this;this.mytab=this.frm.tabs.add_tab(me.df.label,function(){me.frm.set_section(me.sec_id);});this.hide=function(){this.row.hide();me.mytab.hide();}
this.show=function(){this.row.show();me.mytab.set_selected();if(me.df.label&&me.df.trigger=='Client'&&(!me.in_filter))
cur_frm.runclientscript(me.df.label,me.doctype,me.docname);}
this.make_row();this.make_simple_section(1);if(!isIE)this.hide();}else{this.row=this.frm.layout.addsubrow();this.make_simple_section();}}else if(this.frm.meta.section_style=='Tray'){if(this.df.options!='Simple'){this.sec_id=this.frm.sections.length;this.frm.sections[this.sec_id]=this;var w=$a(this.frm.tray_area,'div');this.header=$a(w,'div','sec_tray_tab');this.header.bottom=$a(w,'div','sec_tray_tab_bottom');this.header.innerHTML=me.df.label;this.header.onclick=function(){me.frm.set_section(me.sec_id);}
this.header.onmouseover=function(){if(isIE)return;if(cur_sec_header!=this){this.className='sec_tray_tab tray_tab_mo';this.bottom.className='sec_tray_tab_bottom tray_tab_mo_bottom';}}
this.header.onmouseout=function(){if(isIE)return;if(cur_sec_header!=this){this.className='sec_tray_tab';this.bottom.className='sec_tray_tab_bottom';}}
this.hide=function(){this.row.hide();this.header.className='sec_tray_tab';this.header.bottom.className='sec_tray_tab_bottom';}
this.show=function(){this.row.show();this.header.className='sec_tray_tab tray_tab_sel';this.header.bottom.className='sec_tray_tab_bottom tray_tab_sel_bottom';cur_sec_header=this.header;if(me.df.label&&me.df.trigger=='Client'&&(!me.in_filter))
cur_frm.runclientscript(me.df.label,me.doctype,me.docname);if(!isIE)set_frame_dims();}
this.make_row();this.make_simple_section(1);if(!isIE)this.hide();}else{this.row=this.frm.layout.addsubrow();this.make_simple_section();}}else if(this.df){this.row=this.frm.layout.addrow();this.make_simple_section();}}
SectionBreak.prototype.refresh=function(layout){var fn=this.df.fieldname?this.df.fieldname:this.df.label;if(fn)
this.df=get_field(this.doctype,fn,this.docname);if((this.frm.meta.section_style!='Tray')&&(this.frm.meta.section_style!='Tabbed')&&this.set_hidden!=this.df.hidden){if(this.df.hidden){if(this.header)this.header.hide();if(this.row)this.row.hide();}else{if(this.header)this.header.show();if(this.expanded)
this.row.show();}
this.set_hidden=this.df.hidden;}}
function Field(){}
Field.prototype.make_body=function(){if(this.parent)
this.wrapper=$a(this.parent,'div');else
this.wrapper=document.createElement('div');if(!this.with_label){this.label_area=$a(this.wrapper,'div');$dh(this.label_area);this.comment_area=$a(this.wrapper,'div','comment');$dh(this.comment_area);this.input_area=$a(this.wrapper,'div');this.disp_area=$a(this.wrapper,'div');}else{var t=$a(this.wrapper,'table','frm_field_table');var r=t.insertRow(0);this.r=r;var lc=r.insertCell(0);this.input_cell=r.insertCell(1);lc.className='datalabelcell';this.input_cell.className='datainputcell';var lt=make_table($a(lc,'div'),1,2,'100%',[null,'20px']);this.label_icon=$a($td(lt,0,1),'img');$dh(this.label_icon);this.label_icon.src='images/icons/error.gif';this.label_cell=$td(lt,0,0)
this.input_area=$a(this.input_cell,'div','input_area');this.disp_area=$a(this.input_cell,'div');this.comment_area=$a(this.input_cell,'div','comment');}
if(this.onmake)this.onmake();}
Field.prototype.onresize=function(){}
Field.prototype.set_label=function(){if(this.label_cell&&this.label!=this.df.label){this.label_cell.innerHTML=this.df.label;this.label=this.df.label;}
if(this.df.description){this.comment_area.innerHTML=replace_newlines(this.df.description);$ds(this.comment_area);}else{this.comment_area.innerHTML='';$dh(this.comment_area);}}
Field.prototype.get_status=function(){if(this.in_filter){return'Write';}
var fn=this.df.fieldname?this.df.fieldname:this.df.label;this.df=get_field(this.doctype,fn,this.docname);var p=this.perm[this.df.permlevel];var ret;if(cur_frm.editable&&p&&p[WRITE])ret='Write';else if(p&&p[READ])ret='Read';else ret='None';if(this.df.fieldtype=='Binary')
ret='None';if(cint(this.df.hidden))
ret='None';if(ret=='Write'&&cint(cur_frm.doc.docstatus)>0)ret='Read';var a_o_s=this.df.allow_on_submit;if(a_o_s&&(this.in_grid||(this.frm&&this.frm.in_dialog))){a_o_s=null;if(this.in_grid)a_o_s=this.grid.field.df.allow_on_submit;if(this.frm&&this.frm.in_dialog){a_o_s=cur_grid.field.df.allow_on_submit;}}
if(cur_frm.editable&&a_o_s&&cint(cur_frm.doc.docstatus)>0&&!this.df.hidden){tmp_perm=get_perm(cur_frm.doctype,cur_frm.docname,1);if(tmp_perm[this.df.permlevel]&&tmp_perm[this.df.permlevel][WRITE])ret='Write';}
return ret;}
Field.prototype.activate=function(docname){this.docname=docname;this.refresh();if(this.input){this.input.isactive=true;var v=get_value(this.doctype,this.docname,this.df.fieldname);this.last_value=v;if(this.input.onchange&&this.input.value!=v){if(this.validate)
this.input.value=this.validate(v);else
this.input.value=(v==null)?'':v;if(this.format_input)this.format_input();}
if(this.input.focus){try{this.input.focus();}catch(e){}}}
if(this.txt){try{this.txt.focus();}catch(e){}
this.txt.isactive=true;this.btn.isactive=true;}}
Field.prototype.refresh_mandatory=function(){if(this.in_filter)return;if(this.label_cell){if(this.df.reqd){this.label_cell.style.color="#d22";if(this.txt)$bg(this.txt,"#FFFED7");else if(this.input)$bg(this.input,"#FFFED7");}else{this.label_cell.style.color="#222";if(this.txt)$bg(this.txt,"#FFF");else if(this.input)$bg(this.input,"#FFF");}}
this.set_reqd=this.df.reqd;}
Field.prototype.refresh_display=function(){if(this.set_status!=this.disp_status){if(this.disp_status=='Write'){if(this.make_input&&(!this.input)){this.make_input();}
$ds(this.wrapper);if(this.input){$ds(this.input_area);$dh(this.disp_area);if(this.input.refresh)this.input.refresh();}else{$dh(this.input_area);$ds(this.disp_area);}}else if(this.disp_status=='Read'){$ds(this.wrapper);$dh(this.input_area);$ds(this.disp_area);}else{$dh(this.wrapper);}
this.set_status=this.disp_status;}}
Field.prototype.refresh=function(){this.disp_status=this.get_status();if(this.in_grid&&this.table_refresh&&this.disp_status=='Write')
{this.table_refresh();return;}
this.set_label();this.refresh_display();this.refresh_mandatory();this.refresh_label_icon();if(this.onrefresh)this.onrefresh();if(this.input&&this.input.refresh)this.input.refresh(this.df);if(!this.in_filter)
this.set_input(get_value(this.doctype,this.docname,this.df.fieldname));}
Field.prototype.refresh_label_icon=function(){if(this.in_filter)return;if(this.label_icon&&this.df.reqd){var v=get_value(this.doctype,this.docname,this.df.fieldname);if(is_null(v))
$di(this.label_icon);else
$dh(this.label_icon);}else{$dh(this.label_icon)}}
Field.prototype.set=function(val){if(this.in_filter)
return;if((!this.docname)&&this.grid){this.docname=this.grid.add_newrow();}
if(in_list(['Data','Text','Small Text','Code'],this.df.fieldtype))
val=clean_smart_quotes(val);var set_val=val;if(this.validate)set_val=this.validate(val);set_value(this.doctype,this.docname,this.df.fieldname,set_val);this.value=val;}
Field.prototype.set_input=function(val){this.value=val;if(this.input&&this.input.set_input){if(val==null)this.input.set_input('');else this.input.set_input(val);}
var disp_val=val;if(val==null)disp_val='';this.set_disp(disp_val);}
Field.prototype.run_trigger=function(){if(this.in_filter){if(this.report)
this.report.run();return;}
if(this.df.trigger=='Client')
cur_frm.runclientscript(this.df.fieldname,this.doctype,this.docname);refresh_dependency(cur_frm);this.refresh_label_icon();}
Field.prototype.set_disp_html=function(t){if(this.disp_area){this.disp_area.innerHTML=(t==null?'':t);if(t)this.disp_area.className='disp_area';if(!t)this.disp_area.className='disp_area_no_val';}}
Field.prototype.set_disp=function(val){this.set_disp_html(val);}
function DataField(){}DataField.prototype=new Field();DataField.prototype.with_label=1;DataField.prototype.make_input=function(){var me=this;this.input=$a(this.input_area,'input');if(this.df.fieldtype=='Password'){if(isIE){this.input_area.innerHTML='<input type="password">';this.input=this.input_area.childNodes[0];}else{this.input.setAttribute('type','password');}}
this.get_value=function(){var v=this.input.value;if(this.validate)v=this.validate(v);return v;}
this.input.name=this.df.fieldname;this.input.onchange=function(){if(!me.last_value)me.last_value='';if(me.validate)
me.input.value=me.validate(me.input.value);me.set(me.input.value);if(me.format_input)
me.format_input();if(in_list(['Currency','Float','Int'],me.df.fieldtype)){if(flt(me.last_value)==flt(me.input.value)){me.last_value=me.input.value;return;}}
me.last_value=me.input.value;me.run_trigger();}
this.input.set_input=function(val){if(val==null)val='';me.input.value=val;if(me.format_input)me.format_input();}}
DataField.prototype.onrefresh=function(){if(this.input&&this.df.colour){var col='#'+this.df.colour.split(':')[1];$bg(this.input,col);}}
function ReadOnlyField(){}ReadOnlyField.prototype=new Field();ReadOnlyField.prototype.with_label=1;function HTMLField(){}HTMLField.prototype=new Field();HTMLField.prototype.set_disp=function(val){this.disp_area.innerHTML=val;}
HTMLField.prototype.set_input=function(val){if(val)this.set_disp(val);}
HTMLField.prototype.onrefresh=function(){this.set_disp(this.df.options?this.df.options:'');}
function get_image_src(doc){if(doc.file_list){file=doc.file_list.split(',');extn=file[0].split('.');extn=extn[extn.length-1].toLowerCase();var img_extn_list=['gif','jpg','bmp','jpeg','jp2','cgm','ief','jpm','jpx','png','tiff','jpe','tif'];if(in_list(img_extn_list,extn)){var src=outUrl+"?cmd=downloadfile&file_id="+file[1]+"&__account="+account_id+(__sid150?("&sid150="+__sid150):'');}}else{var src="";}
return src;}
function ImageField(){this.images={};}
ImageField.prototype=new Field();ImageField.prototype.onmake=function(){this.no_img=$a(this.wrapper,'div','no_img');this.no_img.innerHTML="No Image";$dh(this.no_img);}
ImageField.prototype.onrefresh=function(){var me=this;if(!this.images[this.docname])this.images[this.docname]=$a(this.wrapper,'img');else $di(this.images[this.docname]);var img=this.images[this.docname]
for(var dn in this.images)if(dn!=this.docname)$dh(this.images[dn]);var doc=locals[this.frm.doctype][this.frm.docname];if(!this.df.options)var src=get_image_src(doc);else var src=outUrl+'?cmd=get_file&fname='+this.df.options+"&__account="+account_id+(__sid150?("&sid150="+__sid150):'');if(src){$dh(this.no_img);if(img.getAttribute('src')!=src)img.setAttribute('src',src);canvas=this.wrapper;canvas.img=this.images[this.docname];canvas.style.overflow="auto";$w(canvas,"100%");if(!this.col_break_width)this.col_break_width='100%';var allow_width=cint(pagewidth*(cint(this.col_break_width)-10)/100);if((!img.naturalWidth)||cint(img.naturalWidth)>allow_width)
$w(img,allow_width+'px');}else{$ds(this.no_img);}}
ImageField.prototype.set_disp=function(val){}
ImageField.prototype.set=function(val){}
function DateField(){}DateField.prototype=new Field();DateField.prototype.with_label=1;DateField.prototype.make_input=function(){this.user_fmt=locals['Control Panel']['Control Panel'].date_format;if(!this.user_fmt)this.user_fmt='dd-mm-yyyy';makeinput_popup(this,'images/icons/calendar.gif');var me=this;me.btn.onclick=function(){hide_selects();var user_fmt=me.user_fmt.replace('mm','MM');if(!cal)cal=new CalendarPopup('caldiv');cal.select(me.txt,me.txt.getAttribute('id'),user_fmt);if(isIE){window.event.cancelBubble=true;window.event.returnValue=false;}}
me.txt.onchange=function(){me.set(dateutil.str_to_user(me.txt.value));me.run_trigger();}
me.input.set_input=function(val){val=dateutil.str_to_user(val);if(val==null)val='';me.txt.value=val;}
me.get_value=function(){return dateutil.str_to_user(me.txt.value);}}
DateField.prototype.set_disp=function(val){var v=dateutil.str_to_user(val);if(v==null)v='';this.set_disp_html(v);}
DateField.prototype.validate=function(v){if(!v)return;var me=this;this.clear=function(){msgprint("Date must be in format "+this.user_fmt);me.input.set_input('');return'';}
var t=v.split('-');if(t.length!=3){return this.clear();}
else if(cint(t[1])>12||cint(t[1])<1){return this.clear();}
else if(cint(t[2])>31||cint(t[2])<1){return this.clear();}
return v;};function LinkField(){}LinkField.prototype=new Field();LinkField.prototype.with_label=1;LinkField.prototype.make_input=function(){makeinput_popup(this,'images/icons/magnifier.gif','images/icons/arrow_right.gif');var me=this;me.btn.onclick=function(){selector.set(me,me.df.options,me.df.label);selector.show(me.txt);}
if(me.btn1)me.btn1.onclick=function(){if(me.txt.value&&me.df.options){loaddoc(me.df.options,me.txt.value);}}
me.txt.onchange=function(){me.set(me.txt.value);me.run_trigger();}
me.input.set_input=function(val){if(val==undefined)val='';me.txt.value=val;}
me.get_value=function(){return me.txt.value;}
if((!me.in_filter)&&in_list(session.nt,me.df.options)){me.new_link_area=$a(me.input_area,'div','',{display:'none',textAlign:'right',width:'81%'});var sp=$a(me.new_link_area,'span','link_type',{fontSize:'11px'});sp.innerHTML='New '+me.df.options;sp.onclick=function(){new_doc(me.df.options);}}
me.onrefresh=function(){if(me.new_link_area){if(cur_frm.doc.docstatus==0)$ds(me.new_link_area);else $dh(me.new_link_area);}}
var opts={script:'',json:true,maxresults:10,link_field:me};var as=new bsn.AutoSuggest(me.txt.id,opts);}
LinkField.prototype.set_get_query=function(){if(this.get_query)return;if(dialog_record&&dialog_record.display){var gl=cur_frm.grids;for(var i=0;i<gl.length;i++){if(gl[i].grid.doctype=this.df.parent){var f=gl[i].grid.get_field(this.df.fieldname);if(f.get_query)this.get_query=f.get_query;break;}}}}
LinkField.prototype.set_disp=function(val){var t=null;if(val)t="<a href=\'javascript:loaddoc(\""+this.df.options+"\", \""+val+"\")\'>"+val+"</a>";this.set_disp_html(t);}
function IntField(){}IntField.prototype=new DataField();IntField.prototype.validate=function(v){var v=parseInt(v);if(isNaN(v))return null;return v;};IntField.prototype.format_input=function(){if(this.input.value==null)this.input.value='';}
function FloatField(){}FloatField.prototype=new DataField();FloatField.prototype.validate=function(v){var v=parseFloat(v);if(isNaN(v))return null;return v;};FloatField.prototype.format_input=function(){if(this.input.value==null)this.input.value='';}
function CurrencyField(){}CurrencyField.prototype=new DataField();CurrencyField.prototype.format_input=function(){var v=fmt_money(this.input.value);if(!flt(this.input.value))v='';this.input.value=v;}
CurrencyField.prototype.validate=function(v){if(v==null||v=='')return 0;return flt(v,2);}
CurrencyField.prototype.set_disp=function(val){var v=fmt_money(val);this.set_disp_html(v);}
CurrencyField.prototype.onmake=function(){if(this.input)this.input.onfocus=function(){if(flt(this.value)==0)this.value='';}}
function CheckField(){}CheckField.prototype=new Field();CheckField.prototype.with_label=1;CheckField.prototype.validate=function(v){var v=parseInt(v);if(isNaN(v))return 0;return v;};CheckField.prototype.onmake=function(){this.checkimg=$a(this.disp_area,'div');var img=$a(this.checkimg,'img');img.src='images/ui/tick.gif';$dh(this.checkimg);}
CheckField.prototype.make_input=function(){var me=this;this.input=$a_input(this.input_area,'checkbox');$y(this.input,{width:"16px",border:'0px',margin:'2px'});this.input.onchange=function(){me.set(this.checked?1:0);me.run_trigger();}
if(isIE)this.input.onclick=this.input.onchange;this.input.set_input=function(v){v=parseInt(v);if(isNaN(v))v=0;if(v)me.input.checked=true;else me.input.checked=false;}
this.get_value=function(){return this.input.checked?1:0;}}
CheckField.prototype.set_disp=function(val){if(val){$ds(this.checkimg);}
else{$dh(this.checkimg);}}
function ButtonField(){}ButtonField.prototype=new Field();ButtonField.prototype.make_input=function(){var me=this;$y(this.input_area,{height:'30px',marginTop:'4px',marginBottom:'4px'});this.input=$a(this.input_area,'button');this.input.label=$a(this.input,'span');this.input.label.innerHTML=me.df.label;this.input.onclick=function(){this.disabled=true;if(me.df.trigger=='Client'&&(!me.in_filter)){cur_frm.runclientscript(me.df.label,me.doctype,me.docname);this.disabled=false;}else
cur_frm.runscript(me.df.options,me);}}
ButtonField.prototype.set=function(v){};ButtonField.prototype.set_disp=function(val){}
var codeid=0;var code_editors={};var tinymce_loaded;function CodeField(){}CodeField.prototype=new Field();CodeField.prototype.make_input=function(){var me=this;$ds(this.label_area);this.label_area.innerHTML=this.df.label;this.input=$a(this.input_area,'textarea','code_text');this.myid='code-'+codeid;this.input.setAttribute('id',this.myid);codeid++;this.input.setAttribute('wrap','off');this.input.set_input=function(v){if(me.editor){me.editor.setContent(v);}else{me.input.value=v;me.input.innerHTML=v;}}
this.input.onchange=function(){if(me.editor){me.set(me.editor.getContent());}else{me.set(me.input.value);}
me.run_trigger();}
this.get_value=function(){if(me.editor){return me.editor.getContent();}else{return this.input.value;}}
if(this.df.fieldtype=='Text Editor'){if(!tinymce_loaded){tinymce_loaded=1;tinyMCE_GZ.init({themes:"advanced",plugins:"style,table",languages:"en",disk_cache:true},function(){me.setup_editor()});}else{this.setup_editor();}}}
CodeField.prototype.set_disp=function(val){$y(this.disp_area,{width:'90%'})
this.disp_area.innerHTML='<textarea class="code_text" readonly=1>'+val+'</textarea>';}
CodeField.prototype.setup_editor=function(){var me=this;code_editors[me.df.fieldname]=me.input;tinyMCE.init({theme:"advanced",mode:"exact",elements:this.myid,plugins:"table,style",theme_advanced_toolbar_location:"top",theme_advanced_toolbar_align:"left",theme_advanced_statusbar_location:"bottom",extended_valid_elements:"div[id|dir|class|align|style]",width:'100%',height:'360px',theme_advanced_buttons1:"save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect",theme_advanced_buttons2:"cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,image,unlink,cleanup,help,code,|,forecolor,backcolor",theme_advanced_buttons3:"tablecontrols,styleprops,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,ltr,rtl",init_instance_callback:"code_editors."+this.df.fieldname+".editor_init_callback",onchange_callback:"code_editors."+this.df.fieldname+".onchange"});this.input.editor_init_callback=function(){if(cur_frm)
cur_frm.fields_dict[me.df.fieldname].editor=tinyMCE.get(me.myid);}}
function TextField(){}TextField.prototype=new Field();TextField.prototype.with_label=1;TextField.prototype.set_disp=function(val){this.disp_area.innerHTML=replace_newlines(val);}
TextField.prototype.make_input=function(){var me=this;if(this.in_grid)
return;this.input=$a(this.input_area,'textarea');this.input.wrap='off';if(this.df.fieldtype=='Small Text')
this.input.style.height="80px";this.input.set_input=function(v){me.input.value=v;}
this.input.onchange=function(){me.set(me.input.value);me.run_trigger();}
this.get_value=function(){return this.input.value;}}
function make_text_dialog(){var d=new Dialog(520,410);d.make_body([['Text','Enter Text'],['Button','Update']]);d.widgets['Update'].onclick=function(){var t=this.dialog;t.field.set(t.widgets['Enter Text'].value);t.hide();}
d.onshow=function(){this.widgets['Enter Text'].style.height='300px';var v=get_value(this.field.doctype,this.field.docname,this.field.df.fieldname);this.widgets['Enter Text'].value=v==null?'':v;this.widgets['Enter Text'].focus();}
d.onhide=function(){if(grid_selected_cell)
grid_selected_cell.grid.cell_deselect();}
text_dialog=d;}
TextField.prototype.table_refresh=function(){text_dialog.title_text.data='Enter text for "'+this.df.label+'"';text_dialog.field=this;text_dialog.show();}
function TableField(){}TableField.prototype=new Field();TableField.prototype.make_body=function(){if(this.perm[this.df.permlevel]&&this.perm[this.df.permlevel][READ]){this.grid=new FormGrid(this);if(this.frm)this.frm.grids[this.frm.grids.length]=this;this.grid.make_buttons();}}
TableField.prototype.refresh=function(){if(!this.grid)return;var st=this.get_status();if(!this.df['default'])
this.df['default']='';this.grid.can_add_rows=false;this.grid.can_edit=false
if(st=='Write'){if(cur_frm.editable&&this.perm[this.df.permlevel]&&this.perm[this.df.permlevel][WRITE]){this.grid.can_edit=true;if(this.df['default'].toLowerCase()!='no toolbar')
this.grid.can_add_rows=true;}
if(cur_frm.editable&&this.df.allow_on_submit&&cur_frm.doc.docstatus==1&&this.df['default'].toLowerCase()!='no toolbar'){this.grid.can_add_rows=true;this.grid.can_edit=true;}}
if(this.old_status!=st){if(st=='Write'){this.grid.show();}else if(st=='Read'){this.grid.show();}else{this.grid.hide();}
this.old_status=st;}
this.grid.refresh();}
TableField.prototype.set=function(v){};TableField.prototype.set_input=function(v){};function SelectField(){}SelectField.prototype=new Field();SelectField.prototype.with_label=1;SelectField.prototype.make_input=function(){var me=this;this.input=$a(this.input_area,'select');if(isIE6||isIE7)$y(this.input,{margin:'1px'});select_register[select_register.length]=this.input;var opt=[];if(this.in_filter&&(!this.df.single_select)){this.input.multiple=true;this.input.style.height='4em';var lab=$a(this.input_area,'div');lab.innerHTML='(Use Ctrl+Click to select multiple or de-select)'
lab.style.fontSize='9px';lab.style.color='#999';}
this.input.onchange=function(){if(!me.in_filter){if(me.validate)
me.validate();me.set(me.input.options[me.input.selectedIndex].value);}
me.run_trigger();}
this.refresh_options=function(options){if(options)
me.df.options=options;if(this.set_options==me.df.options)return;var opt=me.df.options?me.df.options.split('\n'):[];var selectedflag=false;empty_select(this.input);for(var i=0;i<opt.length;i++){var cur_sel=false;me.input.options[me.input.options.length]=new Option(opt[i],opt[i],false,cur_sel);}
this.set_options=me.df.options;}
this.onrefresh=function(){this.refresh_options();if(this.in_filter){if(isIE){this.input.selectedIndex=-1;}
return;}
var v=get_value(this.doctype,this.docname,this.df.fieldname);this.input.set_input(v);}
this.in_options=function(v){var opt=me.df.options?me.df.options.split('\n'):[];if(in_list(opt,v))
return 1;else
return 0;}
this.input.set_input=function(v){if(!v){if(!me.in_filter){if(me.docname){me.input.selectedIndex=0;me.set(sel_val(me.input));}}}else{if(me.in_options(v))
me.input.value=v;else{if(!me.df.options){me.df.options='\n'+v;me.refresh_options();}
me.input.value=v;}}}
this.get_value=function(){if(me.in_filter){var l=[];for(var i=0;i<me.input.options.length;i++){if(me.input.options[i].selected)l[l.length]=me.input.options[i].value;}
return l;}else{return sel_val(me.input);}}
this.refresh();}
function TimeField(){}TimeField.prototype=new Field();TimeField.prototype.with_label=1;TimeField.prototype.get_time=function(){return time_to_hhmm(sel_val(this.input_hr),sel_val(this.input_mn),sel_val(this.input_am));}
TimeField.prototype.set_time=function(v){ret=time_to_ampm(v);this.input_hr.value=ret[0];this.input_mn.value=ret[1];this.input_am.value=ret[2];}
TimeField.prototype.make_input=function(){var me=this;this.input=$a(this.input_area,'div','time_field');this.input_hr=$a(this.input,'select');this.input_mn=$a(this.input,'select');this.input_am=$a(this.input,'select');this.input_hr.isactive=1;this.input_mn.isactive=1;this.input_am.isactive=1;select_register[select_register.length]=this.input_hr;select_register[select_register.length]=this.input_mn;select_register[select_register.length]=this.input_am;var opt_hr=['1','2','3','4','5','6','7','8','9','10','11','12'];var opt_mn=['00','05','10','15','20','25','30','35','40','45','50','55'];var opt_am=['AM','PM'];add_sel_options(this.input_hr,opt_hr);add_sel_options(this.input_mn,opt_mn);add_sel_options(this.input_am,opt_am);var onchange_fn=function(){me.set(me.get_time());me.run_trigger();}
this.input_hr.onchange=onchange_fn;this.input_mn.onchange=onchange_fn;this.input_am.onchange=onchange_fn;this.onrefresh=function(){var v=get_value(me.doctype,me.docname,me.df.fieldname);me.set_time(v);if(!v)
me.set(me.get_time());}
this.input.set_input=function(v){if(v==null)v='';me.set_time(v);}
this.get_value=function(){return this.get_time();}
this.refresh();}
TimeField.prototype.set_disp=function(v){var t=time_to_ampm(v);var t=t[0]+':'+t[1]+' '+t[2];this.set_disp_html(t);}
function make_field(docfield,doctype,parent,frm,in_grid,hide_label){switch(docfield.fieldtype.toLowerCase()){case'data':var f=new DataField();break;case'password':var f=new DataField();break;case'int':var f=new IntField();break;case'float':var f=new FloatField();break;case'currency':var f=new CurrencyField();break;case'read only':var f=new ReadOnlyField();break;case'link':var f=new LinkField();break;case'date':var f=new DateField();break;case'time':var f=new TimeField();break;case'html':var f=new HTMLField();break;case'check':var f=new CheckField();break;case'button':var f=new ButtonField();break;case'text':var f=new TextField();break;case'small text':var f=new TextField();break;case'code':var f=new CodeField();break;case'text editor':var f=new CodeField();break;case'select':var f=new SelectField();break;case'table':var f=new TableField();break;case'section break':var f=new SectionBreak();break;case'column break':var f=new ColumnBreak();break;case'image':var f=new ImageField();break;}
f.parent=parent;f.doctype=doctype;f.df=docfield;f.perm=frm.perm;f.col_break_width=cur_col_break_width;if(in_grid){f.in_grid=true;f.with_label=0;}
if(hide_label){f.with_label=0;}
if(frm)
f.frm=frm;f.make_body();return f;}
function get_value(dt,dn,fn){if(locals[dt]&&locals[dt][dn])
return locals[dt][dn][fn];}
function set_value(dt,dn,fn,v){var d=locals[dt][dn];if(!d)
show_alert('Trying to set a value for "'+dt+','+dn+'" which is not found');if(d[fn]!=v){d[fn]=v;d.__unsaved=1;var frm=frms[d.doctype];try{if(d.parent&&d.parenttype){locals[d.parenttype][d.parent].__unsaved=1;frm=frms[d.parenttype];}}catch(e){if(d.parent&&d.parenttype)
errprint('Setting __unsaved error:'+d.name+','+d.parent+','+d.parenttype);}
if(frm&&frm==cur_frm){frm.set_heading();}}}
function makeinput_popup(me,iconsrc,iconsrc1){me.input=$a(me.input_area,'div');me.input.onchange=function(){}
var tab=$a(me.input,'table');$w(tab,'100%');tab.style.borderCollapse='collapse';var c0=tab.insertRow(0).insertCell(0);var c1=tab.rows[0].insertCell(1);me.txt=$a(c0,'input');$w(me.txt,isIE?'92%':'100%');c0.style.verticalAlign='top';$w(c0,"80%");me.btn=$a(c1,'img','btn-img');me.btn.src=iconsrc;if(iconsrc1)
me.btn.setAttribute('title','Search');else
me.btn.setAttribute('title','Select Date');me.btn.style.margin='4px 2px 2px 8px';if(iconsrc1){$w(c1,'18px');me.btn1=$a(tab.rows[0].insertCell(2),'img','btn-img');me.btn1.src=iconsrc1;me.btn1.setAttribute('title','Open Link');me.btn1.style.margin='4px 2px 2px 0px';}
if(me.df.colour)
me.txt.style.background='#'+me.df.colour.split(':')[1];me.txt.name=me.df.fieldname;tmpid++;me.txt.setAttribute('id','idx'+tmpid);me.txt.id='idx'+tmpid;me.setdisabled=function(tf){me.txt.disabled=tf;}}
var tmpid=0;function FormGrid(field){this.field=field;this.doctype=field.df.options;if(!this.doctype){show_alert('No Options for table '+field.df.label);}
this.col_break_width=cint(this.field.col_break_width);if(!this.col_break_width)this.col_break_width=100;this.is_scrolltype=true;if(field.df['default']&&field.df['default'].toLowerCase()=='simple')this.is_scrolltype=false;this.init(field.parent,field.df.width);this.setup();}
FormGrid.prototype=new Grid();FormGrid.prototype.setup=function(){this.make_columns();}
FormGrid.prototype.make_buttons=function(){var me=this;if(this.is_scrolltype){this.tbar_btns={};this.tbar_btns['Del']=make_tbar_link($td(this.tbar_tab,0,0),'Del',function(){me.delete_row();},'table_row_delete.gif',1);this.tbar_btns['Ins']=make_tbar_link($td(this.tbar_tab,0,1),'Ins',function(){me.insert_row();},'table_row_insert.gif',1);this.tbar_btns['Up']=make_tbar_link($td(this.tbar_tab,0,2),'Up',function(){me.move_row(true);},'arrow_up.gif',1);this.tbar_btns['Dn']=make_tbar_link($td(this.tbar_tab,0,3),'Dn',function(){me.move_row(false);},'arrow_down.gif',1);for(var i in this.btns)
this.btns[i].isactive=true;}else{this.btn_area.onclick=function(){me.make_newrow(1);var dn=me.add_newrow();cur_grid=me;cur_grid_ridx=me.tab.rows.length-1;edit_record(me.doctype,dn);}}}
FormGrid.prototype.make_columns=function(){var gl=fields_list[this.field.df.options];if(!gl){alert('Table details not found "'+this.field.df.options+'"');}
var p=this.field.perm;for(var i=0;i<gl.length;i++){if(p[this.field.df.permlevel]&&p[this.field.df.permlevel][READ]&&(!gl[i].hidden)){this.insert_column(this.field.df.options,gl[i].fieldname,gl[i].fieldtype,gl[i].label,gl[i].width,gl[i].options,this.field.perm,gl[i].reqd);}}
if(!this.is_scrolltype){for(var i=0;i<this.head_row.cells.length;i++){var c=this.head_row.cells[i];$w(c,cint(cint(c.style.width)/this.total_width*100)+'%')}}}
FormGrid.prototype.set_column_label=function(fieldname,label){for(var i=0;i<this.head_row.cells.length;i++){var c=this.head_row.cells[i];if(c.fieldname==fieldname){c.innerHTML='<div class="grid_head_div">'+label+'</div>';c.cur_label=label;break;}}}
FormGrid.prototype.refresh=function(){var docset=getchildren(this.doctype,this.field.frm.docname,this.field.df.fieldname,this.field.frm.doctype);var data=[];for(var i=0;i<docset.length;i++){locals[this.doctype][docset[i].name].idx=i+1;data[data.length]=docset[i].name;}
this.set_data(data);}
FormGrid.prototype.set_unsaved=function(){locals[cur_frm.doctype][cur_frm.docname].__unsaved=1;cur_frm.set_heading();}
FormGrid.prototype.insert_row=function(){var d=this.new_row_doc();var ci=grid_selected_cell.cellIndex;var row_idx=grid_selected_cell.row.rowIndex;d.idx=row_idx+1;for(var ri=row_idx;ri<this.tab.rows.length;ri++){var r=this.tab.rows[ri];if(r.docname)
locals[this.doctype][r.docname].idx++;}
this.refresh();this.cell_select('',row_idx,ci);this.set_unsaved();}
FormGrid.prototype.new_row_doc=function(){var n=LocalDB.create(this.doctype);var d=locals[this.doctype][n];d.parent=this.field.frm.docname;d.parentfield=this.field.df.fieldname;d.parenttype=this.field.frm.doctype;return d;}
FormGrid.prototype.add_newrow=function(){var r=this.tab.rows[this.tab.rows.length-1];if(!r.is_newrow)
show_alert('fn: add_newrow: Adding a row which is not flagged as new');var d=this.new_row_doc();d.idx=r.rowIndex+1;r.docname=d.name;r.is_newrow=false;this.set_cell_value(r.cells[0]);this.make_newrow();this.refresh_row(r.rowIndex,d.name);if(this.onrowadd)this.onrowadd(cur_frm.doc,d.doctype,d.name);return d.name;}
FormGrid.prototype.make_newrow=function(from_add_btn){if(!this.can_add_rows)
return;if((!from_add_btn)&&(this.field.df['default'].toLowerCase()=='simple'))return;if(this.tab.rows.length){var r=this.tab.rows[this.tab.rows.length-1];if(r.is_newrow)
return;}
var r=this.append_row();r.cells[0].div.innerHTML='<b style="font-size: 18px;">*</b>';r.is_newrow=true;}
FormGrid.prototype.check_selected=function(){if(!grid_selected_cell){show_alert('Select a cell first');return false;}
if(grid_selected_cell.grid!=this){show_alert('Select a cell first');return false;}
return true;}
function delete_local(dt,dn){var d=locals[dt][dn];if(!d.__islocal)
d.__oldparent=d.parent;d.parent='old_parent:'+d.parent;d.docstatus=2;d.__deleted=1;}
FormGrid.prototype.delete_row=function(dt,dn){if(dt&&dn){delete_local(dt,dn);this.refresh();}else{if(!this.check_selected())return;var r=grid_selected_cell.row;if(r.is_newrow)return;var ci=grid_selected_cell.cellIndex;var ri=grid_selected_cell.row.rowIndex;delete_local(this.doctype,r.docname);this.refresh();if(ri<(this.tab.rows.length-2))
this.cell_select(null,ri,ci);else grid_selected_cell=null;}
this.set_unsaved();}
FormGrid.prototype.move_row=function(up){if(!this.check_selected())return;var r=grid_selected_cell.row;if(r.is_newrow)return;if(up&&r.rowIndex>0){var swap_row=this.tab.rows[r.rowIndex-1];}else if(!up){var len=this.tab.rows.length;if(this.tab.rows[len-1].is_newrow)
len=len-1;if(r.rowIndex<(len-1))
var swap_row=this.tab.rows[r.rowIndex+1];}
if(swap_row){var cidx=grid_selected_cell.cellIndex;this.cell_deselect();var aidx=locals[this.doctype][r.docname].idx;locals[this.doctype][r.docname].idx=locals[this.doctype][swap_row.docname].idx;locals[this.doctype][swap_row.docname].idx=aidx;var adocname=swap_row.docname;this.refresh_row(swap_row.rowIndex,r.docname);this.refresh_row(r.rowIndex,adocname);this.cell_select(this.tab.rows[swap_row.rowIndex].cells[cidx]);this.set_unsaved();}}
function print_make_field_tab(layout_cell){var t=$a(layout_cell,'table');$w(t,'100%');var r=t.insertRow(0);this.r=r;r.insertCell(0);r.insertCell(1);r.cells[0].className='datalabelcell';r.cells[1].className='datainputcell';return r}
function print_std(){var dn=cur_frm.docname;var dt=cur_frm.doctype;var pf_list=[];function add_layout(){var l=new Layout();if(locals['DocType'][dt].print_outline=='Yes')l.with_border=1;pf_list[pf_list.length]=l;return l;}
var layout=add_layout();var cp=locals['Control Panel']['Control Panel'];pf_list[pf_list.length-1].addrow();if(cp.letter_head){pf_list[pf_list.length-1].cur_row.header.innerHTML=cp.letter_head;}
layout.cur_row.header.innerHTML+='<div style="font-size: 18px; font-weight: bold; margin: 8px;">'+dt+' : '+dn+'</div>';var fl=getchildren('DocField',dt,'fields','DocType');if(fl[0]&&fl[0].fieldtype!="Section Break"){layout.addrow();if(fl[0].fieldtype!="Column Break")
layout.addcell();}
for(var i=0;i<fl.length;i++){var fn=fl[i].fieldname?fl[i].fieldname:fl[i].label;if(fn)
var f=get_field(dt,fn,dn);else
var f=fl[i];if(!f.print_hide){switch(f.fieldtype){case'Section Break':layout.addrow();if(fl[i+1]&&(fl[i+1].fieldtype!='Column Break')){layout.addcell();}
if(f.label)
layout.cur_row.header.innerHTML='<div class="sectionHeading">'+f.label+'</div>';break;case'Column Break':layout.addcell(f.width,f.label);if(f.label)
layout.cur_cell.header.innerHTML='<div class="columnHeading">'+f.label+'</div>';break;case'Table':var t=print_table(dt,dn,f.fieldname,f.options,null,null,null,null);if(t.appendChild){layout.cur_cell.appendChild(t);}else{for(var ti=0;ti<t.length-1;ti++){layout.cur_cell.appendChild(t[ti]);layout.close_borders();pf_list[pf_list.length]='<div style="page-break-after: always;"></div>';layout=add_layout();layout.addrow();layout.addcell();var div=$a(layout.cur_cell,'div');div.innerHTML='Continued from previous page...';div.style.padding='4px';}
layout.cur_cell.appendChild(t[t.length-1]);}
break;case'HTML':var tmp=$a(layout.cur_cell,'div');tmp.innerHTML=f.options;if(datatables[f.label])
tmp.innerHTML=datatables[f.label].get_html();break;case'Code':var tmp=$a(layout.cur_cell,'div');var v=get_value(dt,dn,f.fieldname);tmp.innerHTML='<div>'+f.label+': </div>'
+'<pre style="font-family: Courier, Fixed;">'+(v?v:'')+'</pre>';break;default:if(f.fieldtype!="Button"){r=print_make_field_tab(layout.cur_cell)
r.cells[0].innerHTML=f.label?f.label:f.fieldname;$s(r.cells[1],get_value(dt,dn,f.fieldname),f.fieldtype);}}}}
layout.close_borders();var html='';for(var i=0;i<pf_list.length;i++){if(pf_list[i].wrapper){html+=pf_list[i].wrapper.innerHTML;}else if(pf_list[i].innerHTML){html+=pf_list[i].innerHTML;}else{html+=pf_list[i];}}
pf_list=[];return html;}
var print_style=".datalabelcell {padding: 2px;width: 38%;vertical-align:top; }"
+".datainputcell { padding: 2px; width: 62%; text-align:left; }"
+".sectionHeading { font-size: 16px; font-weight: bold; margin: 8px; }"
+".columnHeading { font-size: 14px; font-weight: bold; margin: 8px 0px; }"
+".sectionCell {padding: 3px; vertical-align: top; }"
+".pagehead { font-size: 16px; font-weight: bold; font-family: verdana; padding: 2px 10px 10px 0px; }"
+".pagesubhead { font-size: 12px; font-weight: bold; font-family: verdana; padding: 2px 10px 10px 0px; }";var def_print_style="html, body{ font-family: Arial, Helvetica; font-size: 12px; }"
+"\nbody { margin: 12px; }"
+"td {padding: 2px;}"
+"\npre { margin:0; padding:0;}"
+"\n.simpletable, .noborder { border-collapse: collapse; margin-bottom: 10px;}"
+"\n.simpletable td {border: 1pt solid #000; vertical-align: top; }"
+"\n.noborder td { vertical-align: top; }"
var print_formats={}
function print_format(fmtname,onload){if(!cur_frm){alert('No Document Selected');return;}
var doc=locals[cur_frm.doctype][cur_frm.docname];if(fmtname=='Standard'){onload(print_makepage(print_std(),print_style,doc,doc.name));}else{if(!print_formats[fmtname])
$c('get_print_format',{'name':fmtname},function(r,t){print_formats[fmtname]=r.message;onload(print_makepage(print_formats[fmtname],'',doc,doc.name));});else
onload(print_makepage(print_formats[fmtname],'',doc,doc.name));}}
function print_makepage(body,style,doc,title){var block=document.createElement('div');var tmp_html='';block.innerHTML=body;if(doc&&cint(doc.docstatus)==0&&cur_frm.perm[0][SUBMIT]){var tmp_html='<div style="text-align: center; padding: 4px; border: 1px solid #000"><div style="font-size: 20px;">Temporary</div>This box will go away after the document is submitted.</div>';}
style=def_print_style+style;var jslist=block.getElementsByTagName('script');while(jslist.length>0){for(var i=0;i<jslist.length;i++){var code=jslist[i].innerHTML;var p=jslist[i].parentNode;var sp=$a(p,'span');p.replaceChild(sp,jslist[i]);var h=eval(code);if(!h)h='';sp.innerHTML=h;}
jslist=block.getElementsByTagName('script');}
return'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n'
+'<html><head>'
+'<title>'+title+'</title>'
+'<style>'+style+'</style>'
+'</head><body>'
+tmp_html
+block.innerHTML
+'</body></html>';}
function print_go(html){var w=window.open('');w.document.write(html);w.document.close();}
function print_table(dt,dn,fieldname,tabletype,cols,head_labels,widths,condition,cssClass){var fl=fields_list[tabletype];var ds=getchildren(tabletype,dn,fieldname,dt);var tl=[];var make_table=function(fl){var w=document.createElement('div');var t=$a(w,'table',(cssClass?cssClass:'simpletable'));t.wrapper=w;$w(t,'100%');t.insertRow(0);var c_start=0;if(fl[0]=='SR'){t.rows[0].insertCell(0).innerHTML=head_labels?head_labels[0]:' ';$w(t.rows[0].cells[0],'30px');c_start=1;}
for(var c=c_start;c<fl.length;c++){var cell=t.rows[0].insertCell(c);if(head_labels)
cell.innerHTML=head_labels[c];else
cell.innerHTML=fl[c].label;if(fl[c].width)
$w(cell,fl[c].width);if(widths)
$w(cell,widths[c]);cell.style.fontWeight='bold';}
return t;}
if(!ds.length)return document.createElement('div');var newfl=[];if(cols&&cols.length){if(cols[0]=='SR')newfl[0]='SR';for(var i=0;i<cols.length;i++){for(var j=0;j<fl.length;j++){if(fl[j].fieldname==cols[i]){newfl[newfl.length]=fl[j];break;}}}}else{newfl=['SR']
for(var j=0;j<fl.length;j++){if(!fl[j].print_hide){newfl[newfl.length]=fl[j];}}}
fl=newfl;var t=make_table(fl);tl.push(t.wrapper);var c_start=0;if(fl[0]=='SR'){c_start=1;}
var sr=0;for(var r=0;r<ds.length;r++){if((!condition)||(condition(ds[r]))){if(ds[r].page_break){var t=make_table(fl);tl.push(t.wrapper);}
var rowidx=t.rows.length;sr++
var row=t.insertRow(rowidx);if(c_start){row.insertCell(0).innerHTML=sr;}
for(var c=c_start;c<fl.length;c++){var cell=row.insertCell(c);$s(cell,ds[r][fl[c].fieldname],fl[c].fieldtype);if(fl[c].fieldtype=='Currency')
cell.style.textAlign='right';}}}
if(tl.length>1)return tl;else return tl[0];}
function set_default_values(doc){var doctype=doc.doctype;var docfields=fields_list[doctype];if(!docfields){return;}
for(var fid=0;fid<docfields.length;fid++){var f=docfields[fid];if(!in_list(no_value_fields,f.fieldtype)&&doc[f.fieldname]==null){var v=LocalDB.get_default_value(f.fieldname,f.fieldtype,f['default']);if(v)doc[f.fieldname]=v;}}}
function get_today(){var today=new Date();var m=(today.getMonth()+1)+'';if(m.length==1)m='0'+m;var d=today.getDate()+'';if(d.length==1)d='0'+d;return today.getFullYear()+'-'+m+'-'+d;}
function copy_doc(onload,from_amend){if(!cur_frm)return;if(!cur_frm.perm[0][CREATE]){msgprint('You are not allowed to create '+cur_frm.meta.name);return;}
var dn=cur_frm.docname;var newdoc=LocalDB.copy(cur_frm.doctype,dn,from_amend);if(cur_frm.meta.allow_attach&&newdoc.file_list)
newdoc.file_list=null;var dl=make_doclist(cur_frm.doctype,dn);var tf_dict={};for(var d in dl){d1=dl[d];if(!tf_dict[d1.parentfield]){tf_dict[d1.parentfield]=get_field(d1.parenttype,d1.parentfield);}
if(d1.parent==dn&&cint(tf_dict[d1.parentfield].no_copy)!=1){var ch=LocalDB.copy(d1.doctype,d1.name,from_amend);ch.parent=newdoc.name;ch.docstatus=0;ch.owner=user;ch.creation='';ch.modified_by=user;ch.modified='';}}
newdoc.__islocal=1;newdoc.docstatus=0;newdoc.owner=user;newdoc.creation='';newdoc.modified_by=user;newdoc.modified='';if(onload)onload(newdoc);loaddoc(newdoc.doctype,newdoc.name);}
function is_null(v){if(v==null){return 1}else if(v==0){if((v+'').length==1)return 0;else return 1;}else{return 0}}
function check_required(dt,dn){var doc=locals[dt][dn];if(doc.docstatus>1)return true;var fl=fields_list[dt];if(!fl)return true;var all_clear=true;var errfld=[];for(var i=0;i<fl.length;i++){var key=fl[i].fieldname;var v=doc[key];if(fl[i].reqd&&is_null(v)){errfld[errfld.length]=fl[i].label;if(all_clear)all_clear=false;}}
if(errfld.length)msgprint('<b>Following fields are required:</b>\n'+errfld.join('\n'));return all_clear;}
function savedoc(dt,dn,save_action,onsave,onerr){var doc=locals[dt][dn];var doctype=locals['DocType'][dt];var tmplist=[];var doclist=make_doclist(dt,dn,1);var all_clear=true;if(save_action!='Cancel'){for(var n in doclist){var tmp=check_required(doclist[n].doctype,doclist[n].name);if(doclist[n].docstatus+''!='2'&&all_clear)
all_clear=tmp;}}
var f=frms[dt];if(!all_clear){if(f)f.savingflag=false;return'Error';}
var _save=function(){var out=compress_doclist(doclist);$c('savedocs',{'docs':out,'docname':dn,'action':save_action,'user':user},function(r,rtxt){if(f){f.savingflag=false;}
if(r.saved){if(onsave)onsave(r);}else{if(onerr)onerr(r);}},function(){if(f){f.savingflag=false;}},0,(f?'Saving...':''));}
if(doc.__islocal&&(doctype&&doctype.autoname&&doctype.autoname.toLowerCase()=='prompt')){var newname=prompt('Enter the name of the new '+dt,'');if(newname){doc.__newname=strip(newname);_save();}else{msgprint('Not Saved');onerr();}}else{_save();}}
function amend_doc(){if(!cur_frm.fields_dict['amended_from']){alert('"amended_from" field must be present to do an amendment.');return;}
var fn=function(newdoc){newdoc.amended_from=cur_frm.docname;if(cur_frm.fields_dict['amendment_date'])
newdoc.amendment_date=dateutil.obj_to_str(new Date());}
copy_doc(fn,1);}
function savesubmit(){var answer=confirm("Permanently Submit "+cur_frm.docname+"?");if(answer)save_doc('Submit');}
function savecancel(){var answer=confirm("Permanently Cancel "+cur_frm.docname+"?");if(answer)save_doc('Cancel');}
function save_doc(save_action){if(!cur_frm)return;if(!save_action)save_action='Save';if(cur_frm.cscript.server_validate){cur_frm.cscript.server_validate(locals[cur_frm.doctype][cur_frm.name],save_action);}else{cur_frm.save(save_action);}}
function Grid(parent){}
Grid.prototype.init=function(parent,row_height){this.alt_row_bg='#F2F2FF';this.row_height=row_height;if(this.is_scrolltype){if(!row_height)this.row_height='26px';this.make_ui(parent);}else{this.make_ui_simple(parent);}
this.insert_column('','','Int','Sr','50px','',[1,0,0]);this.total_width=50;if(this.oninit)this.oninit();}
Grid.prototype.make_ui=function(parent){var ht=make_table($a(parent,'div'),1,2,'100%',['60%','40%']);this.main_title=$td(ht,0,0);this.main_title.className='columnHeading';$td(ht,0,1).style.textAlign='right';this.tbar_div=$a($td(ht,0,1),'div','grid_tbarlinks');this.tbar_tab=make_table(this.tbar_div,1,4,'100%',['25%','25%','25%','25%']);this.wrapper=$a(parent,'div','grid_wrapper');$h(this.wrapper,cint(pagewidth*0.5)+'px');this.head_wrapper=$a(this.wrapper,'div','grid_head_wrapper');this.head_tab=$a(this.head_wrapper,'table','grid_head_table');this.head_row=this.head_tab.insertRow(0);this.tab_wrapper=$a(this.wrapper,'div','grid_tab_wrapper');this.tab=$a(this.tab_wrapper,'table','grid_table');var me=this;this.wrapper.onscroll=function(){me.head_wrapper.style.top=me.wrapper.scrollTop+'px';}}
Grid.prototype.make_ui_simple=function(parent){var ht=make_table($a(parent,'div'),1,2,'100px',['60%','40%']);this.main_title=$td(ht,0,0);this.main_title.className='columnHeading';$td(ht,0,1).style.textAlign='right';this.btn_area=$a(parent,'button','',{marginBottom:'8px',fontWeight:'bold'});this.btn_area.innerHTML='+ Add Row';this.wrapper=$a(parent,'div','grid_wrapper_simple');this.head_wrapper=$a(this.wrapper,'div','grid_head_wrapper_simple');this.head_tab=$a(this.head_wrapper,'table','grid_head_table');this.head_row=this.head_tab.insertRow(0);this.tab_wrapper=$a(this.wrapper,'div','grid_tab_wrapper_simple');this.tab=$a(this.tab_wrapper,'table','grid_table');var me=this;}
Grid.prototype.show=function(){$ds(this.wrapper);if(this.can_add_rows){if(this.is_scrolltype)$ds(this.tbar_div);else $ds(this.btn_area);}else{if(this.is_scrolltype)$dh(this.tbar_div);else $dh(this.btn_area);}}
Grid.prototype.hide=function(){$dh(this.wrapper);$dh(this.tbar_div);}
Grid.prototype.insert_column=function(doctype,fieldname,fieldtype,label,width,options,perm,reqd){var idx=this.head_row.cells.length;if(!width)width='100px';var col=this.head_row.insertCell(idx);if(!this.is_scrolltype){col.style.padding='2px';col.style.borderRight='1px solid #AA9';}
col.doctype=doctype;col.fieldname=fieldname;col.fieldtype=fieldtype;col.innerHTML='<div>'+label+'</div>';col.label=label;if(reqd)
col.childNodes[0].style.color="#D22";this.total_width+=cint(width);$w(col,width);col.orig_width=col.style.width;col.options=options;col.perm=perm;}
Grid.prototype.set_column_disp=function(label,show){for(var i=0;i<this.head_row.cells.length;i++){var c=this.head_row.cells[i];if(label&&(c.label==label||c.cur_label==label)){if(show){var w=c.orig_width;this.head_tab.style.width=(this.total_width+cint(w))+'px';this.tab.style.width=(this.total_width+cint(w))+'px';}else{var w='0px';this.head_tab.style.width=(this.total_width-cint(c.orig_width))+'px';this.tab.style.width=(this.total_width-cint(c.orig_width))+'px';}
$w(c,w);if(this.tab){for(var j=0;j<this.tab.rows.length;j++){var cell=this.tab.rows[j].cells[i];$w(cell,w);if(show){$ds(cell.div);cell.div.style.padding='2px';}
else{$dh(cell.div);cell.div.style.padding='0px';}}}
break;}}}
Grid.prototype.append_row=function(idx,docname){if(!idx)idx=this.tab.rows.length;var row=this.tab.insertRow(idx);row.docname=docname;if(idx%2)var odd=true;else var odd=false;var me=this;for(var i=0;i<this.head_row.cells.length;i++){var cell=row.insertCell(i);var hc=this.head_row.cells[i];$w(cell,hc.style.width);cell.row=row;cell.grid=this;if(this.is_scrolltype)cell.className='grid_cell';else cell.className='grid_cell_simple';cell.div=$a(cell,'div','grid_cell_div');if(this.row_height){cell.div.style.height=this.row_height;}
cell.div.cell=cell;cell.div.onclick=function(e){me.cell_click(this.cell,e);}
if(odd){$bg(cell,this.alt_row_bg);cell.is_odd=1;cell.div.style.border='2px solid '+this.alt_row_bg;}else $bg(cell,'#FFF');if(!hc.fieldname)cell.div.style.cursor='default';}
if(this.is_scrolltype)this.set_ht();return row;}
Grid.prototype.refresh_cell=function(docname,fieldname){for(var r=0;r<this.tab.rows.length;r++){if(this.tab.rows[r].docname==docname){for(var c=0;c<this.head_row.cells.length;c++){var hc=this.head_row.cells[c];if(hc.fieldname==fieldname){this.set_cell_value(this.tab.rows[r].cells[c]);}}}}}
var cur_grid;var cur_grid_ridx;Grid.prototype.set_cell_value=function(cell){if(cell.row.is_newrow)return;var hc=this.head_row.cells[cell.cellIndex];if(hc.fieldname){var v=locals[hc.doctype][cell.row.docname][hc.fieldname];}else{var v=(cell.row.rowIndex+1);}
if(v==null){v='';}
var me=this;if(cell.cellIndex){var ft=hc.fieldtype;if(ft=='Link'&&cur_frm.doc.docstatus<1)ft='Data';$s(cell.div,v,ft,hc.options);}else{cell.div.style.padding='2px';cell.div.style.textAlign='left';cell.innerHTML='';var t=make_table(cell,1,3,'60px',['20px','20px','20px'],{verticalAlign:'middle',padding:'2px'});$y($td(t,0,0),{paddingLeft:'4px'});$td(t,0,0).innerHTML=cell.row.rowIndex+1;if(cur_frm.editable&&this.can_edit){var ed=$a($td(t,0,1),'img','',{cursor:'pointer'});ed.cell=cell;ed.title='Edit Row';ed.src='images/icons/page.gif';ed.onclick=function(){cur_grid=me;cur_grid_ridx=this.cell.row.rowIndex;edit_record(me.doctype,this.cell.row.docname);}
if(!me.is_scrolltype){var ca=$a($td(t,0,2),'img','',{cursor:'pointer'});ca.cell=cell;ca.title='Delete Row';ca.src='images/icons/cancel.gif';ca.onclick=function(){me.delete_row(me.doctype,this.cell.row.docname);}}}else{cell.div.innerHTML=(cell.row.rowIndex+1);cell.div.style.cursor='default';cell.div.onclick=function(){}}}}
Grid.prototype.cell_click=function(cell,e){if(grid_selected_cell==cell)
return;this.cell_select(cell);if(cur_frm.editable){if(isIE){window.event.cancelBubble=true;window.event.returnValue=false;}else{e.preventDefault();}}}
function grid_click_event(e,target){if(grid_selected_cell&&!target.isactive){if(!text_dialog.display&&!selector.display){grid_selected_cell.grid.cell_deselect();}}}
Grid.prototype.cell_deselect=function(){if(grid_selected_cell){var c=grid_selected_cell;c.grid.remove_template(c);c.div.className='grid_cell_div';if(c.is_odd)c.div.style.border='2px solid '+c.grid.alt_row_bg;else c.div.style.border='2px solid #FFF';grid_selected_cell=null;cur_grid=null;this.isactive=false;}}
Grid.prototype.cell_select=function(cell,ri,ci){if(ri!=null&&ci!=null)
cell=this.tab.rows[ri].cells[ci];var hc=this.head_row.cells[cell.cellIndex];if(!hc.template){this.make_template(hc);}
hc.template.perm=this.field?this.field.perm:hc.perm;if(hc.fieldname&&hc.template.get_status()=='Write'){this.cell_deselect();cell.div.style.border='2px solid #88F';grid_selected_cell=cell;this.add_template(cell);this.isactive=true;}}
Grid.prototype.add_template=function(cell){if(!cell.row.docname&&this.add_newrow){this.add_newrow();this.cell_select(cell);}else{var hc=this.head_row.cells[cell.cellIndex];cell.div.innerHTML='';cell.div.appendChild(hc.template.wrapper);hc.template.activate(cell.row.docname);hc.template.activated=1;}}
Grid.prototype.get_field=function(fieldname){for(var i=0;i<this.head_row.cells.length;i++){var hc=this.head_row.cells[i];if(hc.fieldname==fieldname){if(!hc.template){this.make_template(hc);}
return hc.template;}}
return{}}
grid_date_cell='';function grid_refresh_date(){grid_date_cell.grid.set_cell_value(grid_date_cell);}
function grid_refresh_field(temp,input){if(input.value!=get_value(temp.doctype,temp.docname,temp.df.fieldname))
if(input.onchange)input.onchange();}
Grid.prototype.remove_template=function(cell){var hc=this.head_row.cells[cell.cellIndex];if(!hc.template)return;if(!hc.template.activated)return;if(hc.template.txt){if(hc.template.df.fieldtype=='Date'){grid_date_cell=cell;setTimeout('grid_refresh_date()',100);}
if(hc.template.txt.value)
grid_refresh_field(hc.template,hc.template.txt);}else if(hc.template.input){grid_refresh_field(hc.template,hc.template.input);}
if(hc.template&&hc.template.wrapper.parentNode)
cell.div.removeChild(hc.template.wrapper);this.set_cell_value(cell);hc.template.activated=0;}
Grid.prototype.cell_keypress=function(e,keycode){if(keycode>=37&&keycode<=40&&e.shiftKey){if(text_dialog&&text_dialog.display){return;}}else
return;if(!grid_selected_cell)return;var ri=grid_selected_cell.row.rowIndex;var ci=grid_selected_cell.cellIndex;switch(keycode){case 38:if(ri>0){this.cell_select('',ri-1,ci);}break;case 40:if(ri<(this.tab.rows.length-1)){this.cell_select('',ri+1,ci);}break;case 39:if(ci<(this.head_row.cells.length-1)){this.cell_select('',ri,ci+1);}break;case 37:if(ci>1){this.cell_select('',ri,ci-1);}break;}}
Grid.prototype.make_template=function(hc){hc.template=make_field(get_field(hc.doctype,hc.fieldname),hc.doctype,'','',true);hc.template.grid=this;}
Grid.prototype.append_rows=function(n){for(var i=0;i<n;i++)this.append_row();}
Grid.prototype.truncate_rows=function(n){for(var i=0;i<n;i++)this.tab.deleteRow(this.tab.rows.length-1);}
Grid.prototype.set_data=function(data){this.cell_deselect();if(this.is_scrolltype){this.tab.style.width=this.total_width+'px';this.head_tab.style.width=this.total_width+'px';}else{this.tab.style.width='100%';this.head_tab.style.width='100%';}
if(data.length>this.tab.rows.length)
this.append_rows(data.length-this.tab.rows.length);if(data.length<this.tab.rows.length)
this.truncate_rows(this.tab.rows.length-data.length);for(var ridx=0;ridx<data.length;ridx++){this.refresh_row(ridx,data[ridx]);}
if(this.can_add_rows&&this.make_newrow){this.make_newrow();}
if(this.is_scrolltype)this.set_ht();if(this.wrapper.onscroll)this.wrapper.onscroll();}
Grid.prototype.set_ht=function(ridx,docname){var ht=((cint(this.row_height)+10)*(((this.tab&&this.tab.rows)?this.tab.rows.length:0)+1));if(ht<100)ht=100;if(ht>cint(0.3*pagewidth))ht=cint(0.3*pagewidth);ht+=4;$y(this.wrapper,{height:ht+'px'});}
Grid.prototype.refresh_row=function(ridx,docname){var row=this.tab.rows[ridx];row.docname=docname;row.is_newrow=false;for(var cidx=0;cidx<row.cells.length;cidx++){this.set_cell_value(row.cells[cidx]);}}
function refresh_scroll_heads(){for(var i=0;i<scroll_list.length;i++){if(scroll_list[i].frm==cur_frm){ie_refresh(scroll_list[i]);if(scroll_list[i].check_disp)
scroll_list[i].check_disp();}
if(scroll_list[i].cs==_cs){ie_refresh(scroll_list[i]);}}}
var popup_list=[];var cal_displayed=0;var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');var DAY_NAMES=new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat');function LZ(x){return(x<0||x>9?"":"0")+x}
function isDate(val,format){var date=getDateFromFormat(val,format);if(date==0){return false;}
return true;}
function compareDates(date1,dateformat1,date2,dateformat2){var d1=getDateFromFormat(date1,dateformat1);var d2=getDateFromFormat(date2,dateformat2);if(d1==0||d2==0)return-1;else if(d1>d2)return 1;return 0;}
function formatDate(date,format){format=format+"";var result="";var i_format=0;var c="";var token="";var y=date.getYear()+"";var M=date.getMonth()+1;var d=date.getDate();var E=date.getDay();var H=date.getHours();var m=date.getMinutes();var s=date.getSeconds();var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;var value=new Object();if(y.length<4){y=""+(y-0+1900);}
value["y"]=""+y;value["yyyy"]=y;value["yy"]=y.substring(2,4);value["M"]=M;value["MM"]=LZ(M);value["MMM"]=MONTH_NAMES[M-1];value["NNN"]=MONTH_NAMES[M+11];value["d"]=d;value["dd"]=LZ(d);while(i_format<format.length){c=format.charAt(i_format);token="";while((format.charAt(i_format)==c)&&(i_format<format.length)){token+=format.charAt(i_format++);}
if(value[token]!=null){result=result+value[token];}
else{result=result+token;}}
return result;}
function _isInteger(val){var digits="1234567890";for(var i=0;i<val.length;i++){if(digits.indexOf(val.charAt(i))==-1){return false;}}
return true;}
function _getInt(str,i,minlength,maxlength){for(var x=maxlength;x>=minlength;x--){var token=str.substring(i,i+x);if(token.length<minlength){return null;}
if(_isInteger(token)){return token;}}
return null;}
function getDateFromFormat(val,format){val=val+"";format=format+"";var i_val=0;var i_format=0;var c="";var token="";var token2="";var x,y;var now=new Date();var year=now.getYear();var month=now.getMonth()+1;var date=1;var hh=now.getHours();var mm=now.getMinutes();var ss=now.getSeconds();var ampm="";while(i_format<format.length){c=format.charAt(i_format);token="";while((format.charAt(i_format)==c)&&(i_format<format.length)){token+=format.charAt(i_format++);}
if(token=="yyyy"||token=="yy"||token=="y"){if(token=="yyyy"){x=4;y=4;}
if(token=="yy"){x=2;y=2;}
if(token=="y"){x=2;y=4;}
year=_getInt(val,i_val,x,y);if(year==null){return 0;}
i_val+=year.length;if(year.length==2){if(year>70){year=1900+(year-0);}
else{year=2000+(year-0);}}}
else if(token=="MM"||token=="M"){month=_getInt(val,i_val,token.length,2);if(month==null||(month<1)||(month>12)){return 0;}
i_val+=month.length;}
else if(token=="dd"||token=="d"){date=_getInt(val,i_val,token.length,2);if(date==null||(date<1)||(date>31)){return 0;}
i_val+=date.length;}
else if(token=="mm"||token=="m"){mm=_getInt(val,i_val,token.length,2);if(mm==null||(mm<0)||(mm>59)){return 0;}
i_val+=mm.length;}
else{if(val.substring(i_val,i_val+token.length)!=token){return 0;}
else{i_val+=token.length;}}}
if(i_val!=val.length){return 0;}
if(month==2){if(((year%4==0)&&(year%100!=0))||(year%400==0)){if(date>29){return 0;}}
else{if(date>28){return 0;}}}
if((month==4)||(month==6)||(month==9)||(month==11)){if(date>30){return 0;}}
if(hh<12&&ampm=="PM"){hh=hh-0+12;}
else if(hh>11&&ampm=="AM"){hh-=12;}
var newdate=new Date(year,month-1,date,hh,mm,ss);return newdate.getTime();}
function parseDate(val){var preferEuro=(arguments.length==2)?arguments[1]:false;generalFormats=new Array('y-M-d','MMM d, y','MMM d,y','y-MMM-d','d-MMM-y','MMM d');monthFirst=new Array('M/d/y','M-d-y','M.d.y','MMM-d','M/d','M-d');dateFirst=new Array('d/M/y','d-M-y','d.M.y','d-MMM','d/M','d-M');var checkList=new Array('generalFormats',preferEuro?'dateFirst':'monthFirst',preferEuro?'monthFirst':'dateFirst');var d=null;for(var i=0;i<checkList.length;i++){var l=window[checkList[i]];for(var j=0;j<l.length;j++){d=getDateFromFormat(val,l[j]);if(d!=0){return new Date(d);}}}
return null;}
function PopupWindow_getXYPosition(anchorname){var coordinates=objpos(anchorname);this.x=coordinates.x;this.y=coordinates.y;}
function PopupWindow_setSize(width,height){this.width=width;this.height=height;}
function PopupWindow_populate(contents){this.contents=contents;this.populated=false;}
function PopupWindow_setUrl(url){this.url=url;}
function PopupWindow_refresh(){if(this.divName)
$i(this.divName).innerHTML=this.contents;$i(this.divName).style.visibility="visible";cal_displayed=1;}
function PopupWindow_showPopup(anchorname,inputobj){this.getXYPosition(inputobj);this.x+=this.offsetX;this.y+=this.offsetY;if(!this.populated&&(this.contents!="")){this.populated=true;this.refresh();}
if(this.divName!=null){$i(this.divName).style.left=this.x+"px";$i(this.divName).style.top=this.y+"px";$i(this.divName).style.visibility="visible";cal_displayed=1;}}
function PopupWindow_hidePopup(){if(this.divName&&$i(this.divName)){$i(this.divName).style.visibility="hidden";cal_displayed=0;}
else{if(this.popupWindow&&!this.popupWindow.closed){this.popupWindow.close();this.popupWindow=null;cal_displayed=0;}}}
function PopupWindow_hideIfNotClicked(e){this.hidePopup();}
function PopupWindow(){this.index=popup_list.length;popup_list[popup_list.length]=this;this.divName=null;this.popupWindow=null;this.width=0;this.height=0;this.populated=false;this.visible=false;this.contents="";this.url="";if(arguments.length>0){this.type="DIV";this.divName=arguments[0];}
else{this.type="WINDOW";}
this.use_byId=true;this.use_css=false;this.use_layers=false;this.offsetX=0;this.offsetY=0;this.getXYPosition=PopupWindow_getXYPosition;this.populate=PopupWindow_populate;this.setUrl=PopupWindow_setUrl;this.refresh=PopupWindow_refresh;this.showPopup=PopupWindow_showPopup;this.hidePopup=PopupWindow_hidePopup;this.setSize=PopupWindow_setSize;this.hideIfNotClicked=PopupWindow_hideIfNotClicked;}
function CalendarPopup(){var c;if(arguments.length>0){c=new PopupWindow(arguments[0]);}
else{c=new PopupWindow();c.setSize(150,175);}
c.offsetX=0;c.offsetY=25;c.monthNames=new Array("January","February","March","April","May","June","July","August","September","October","November","December");c.monthAbbreviations=new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");c.dayHeaders=new Array("S","M","T","W","T","F","S");c.returnFunction="CP_tmpReturnFunction";c.returnMonthFunction="CP_tmpReturnMonthFunction";c.returnQuarterFunction="CP_tmpReturnQuarterFunction";c.returnYearFunction="CP_tmpReturnYearFunction";c.weekStartDay=0;c.isShowYearNavigation=false;c.displayType="date";c.disabledDatesExpression="";c.yearSelectStartOffset=2;c.currentDate=null;c.todayText="Today";c.cssPrefix="";window.CP_calendarObject=null;window.CP_targetInput=null;window.CP_dateFormat="MM/dd/yyyy";c.copyMonthNamesToWindow=CP_copyMonthNamesToWindow;c.setReturnFunction=CP_setReturnFunction;c.setReturnMonthFunction=CP_setReturnMonthFunction;c.setReturnQuarterFunction=CP_setReturnQuarterFunction;c.setReturnYearFunction=CP_setReturnYearFunction;c.setMonthNames=CP_setMonthNames;c.setMonthAbbreviations=CP_setMonthAbbreviations;c.setDayHeaders=CP_setDayHeaders;c.setWeekStartDay=CP_setWeekStartDay;c.setDisplayType=CP_setDisplayType;c.setYearSelectStartOffset=CP_setYearSelectStartOffset;c.setTodayText=CP_setTodayText;c.showYearNavigation=CP_showYearNavigation;c.showCalendar=CP_showCalendar;c.hideCalendar=CP_hideCalendar;c.refreshCalendar=CP_refreshCalendar;c.getCalendar=CP_getCalendar;c.select=CP_select;c.setCssPrefix=CP_setCssPrefix;c.copyMonthNamesToWindow();return c;}
function CP_copyMonthNamesToWindow(){if(typeof(window.MONTH_NAMES)!="undefined"&&window.MONTH_NAMES!=null){window.MONTH_NAMES=new Array();for(var i=0;i<this.monthNames.length;i++){window.MONTH_NAMES[window.MONTH_NAMES.length]=this.monthNames[i];}
for(var i=0;i<this.monthAbbreviations.length;i++){window.MONTH_NAMES[window.MONTH_NAMES.length]=this.monthAbbreviations[i];}}}
var cal_clicked=0;function CP_tmpReturnFunction(y,m,d){cal_clicked=1;if(window.CP_targetInput!=null){var dt=new Date(y,m-1,d,0,0,0);if(window.CP_calendarObject!=null){window.CP_calendarObject.copyMonthNamesToWindow();}
window.CP_targetInput.value=formatDate(dt,window.CP_dateFormat);window.CP_targetInput.onchange()}}
function CP_setReturnFunction(name){this.returnFunction=name;}
function CP_setReturnMonthFunction(name){this.returnMonthFunction=name;}
function CP_setReturnQuarterFunction(name){this.returnQuarterFunction=name;}
function CP_setReturnYearFunction(name){this.returnYearFunction=name;}
function CP_setMonthNames(){for(var i=0;i<arguments.length;i++){this.monthNames[i]=arguments[i];}
this.copyMonthNamesToWindow();}
function CP_setMonthAbbreviations(){for(var i=0;i<arguments.length;i++){this.monthAbbreviations[i]=arguments[i];}
this.copyMonthNamesToWindow();}
function CP_setDayHeaders(){for(var i=0;i<arguments.length;i++){this.dayHeaders[i]=arguments[i];}}
function CP_setWeekStartDay(day){this.weekStartDay=day;}
function CP_showYearNavigation(){this.isShowYearNavigation=(arguments.length>0)?arguments[0]:true;}
function CP_setDisplayType(type){if(type!="date"&&type!="week-end"&&type!="month"&&type!="quarter"&&type!="year"){alert("Invalid display type! Must be one of: date,week-end,month,quarter,year");return false;}
this.displayType=type;}
function CP_setYearSelectStartOffset(num){this.yearSelectStartOffset=num;}
function CP_setTodayText(text){this.todayText=text;}
function CP_setCssPrefix(val){this.cssPrefix=val;}
function CP_hideCalendar(){if(arguments.length>0){window.popup_list[arguments[0]].hidePopup();}
else{this.hidePopup();}}
function CP_refreshCalendar(index){var calObject=window.popup_list[index];if(arguments.length>1){calObject.populate(calObject.getCalendar(arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]));}
else{calObject.populate(calObject.getCalendar());}
calObject.refresh();}
function CP_showCalendar(anchorname,inputobj){this.populate(this.getCalendar());this.showPopup(anchorname,inputobj);}
function CP_select(inputobj,linkname,format){var selectedDate=(arguments.length>3)?arguments[3]:null;if(inputobj.disabled){return;}
window.CP_targetInput=inputobj;window.CP_calendarObject=this;this.currentDate=null;var time=0;if(selectedDate!=null){time=getDateFromFormat(selectedDate,format)}
else if(inputobj.value!=""){time=getDateFromFormat(inputobj.value,format);}
if(selectedDate!=null||inputobj.value!=""){if(time==0){this.currentDate=null;}
else{this.currentDate=new Date(time);}}
window.CP_dateFormat=format;this.showCalendar(linkname,inputobj);}
function CP_getCalendar(){var now=new Date();var windowref="";var result="";result+='<TABLE CLASS="cpBorder" WIDTH=144 BORDER=1 BORDERWIDTH=1 CELLSPACING=0 CELLPADDING=1>\n';result+='<TR><TD ALIGN=CENTER><CENTER>\n';if(this.displayType=="date"||this.displayType=="week-end"){if(this.currentDate==null){this.currentDate=now;}
if(arguments.length>0){var month=arguments[0];}
else{var month=this.currentDate.getMonth()+1;}
if(arguments.length>1&&arguments[1]>0&&arguments[1]-0==arguments[1]){var year=arguments[1];}
else{var year=this.currentDate.getFullYear();}
var daysinmonth=new Array(0,31,28,31,30,31,30,31,31,30,31,30,31);if(((year%4==0)&&(year%100!=0))||(year%400==0)){daysinmonth[2]=29;}
var current_month=new Date(year,month-1,1);var display_year=year;var display_month=month;var display_date=1;var weekday=current_month.getDay();var offset=0;offset=(weekday>=this.weekStartDay)?weekday-this.weekStartDay:7-this.weekStartDay+weekday;if(offset>0){display_month--;if(display_month<1){display_month=12;display_year--;}
display_date=daysinmonth[display_month]-offset+1;}
var next_month=month+1;var next_month_year=year;if(next_month>12){next_month=1;next_month_year++;}
var last_month=month-1;var last_month_year=year;if(last_month<1){last_month=12;last_month_year--;}
var date_class;result+="<TABLE WIDTH=144 BORDER=0 BORDERWIDTH=0 CELLSPACING=0 CELLPADDING=0>";result+='<TR>\n';var refresh=windowref+'CP_refreshCalendar';var refreshLink='javascript:'+refresh;result+='<TD CLASS="cpMonthNavigation" WIDTH="22"><A CLASS="cpMonthNavigation" HREF="'+refreshLink+'('+this.index+','+last_month+','+last_month_year+');">&lt;&lt;</A></TD>\n';result+='<TD CLASS="cpMonthNavigation" WIDTH="100"><SPAN CLASS="cpMonthNavigation">'+this.monthNames[month-1]+' '+year+'</SPAN></TD>\n';result+='<TD CLASS="cpMonthNavigation" WIDTH="22"><A CLASS="cpMonthNavigation" HREF="'+refreshLink+'('+this.index+','+next_month+','+next_month_year+');">&gt;&gt;</A></TD>\n';result+='</TR></TABLE>\n';result+='<TABLE style="width:120px" BORDER=0 CELLSPACING=0 CELLPADDING=1 ALIGN=CENTER>\n';result+='<TR>\n';for(var j=0;j<7;j++){result+='<TD CLASS="cpDayColumnHeader" WIDTH="14%"><SPAN CLASS="cpDayColumnHeader">'+this.dayHeaders[(this.weekStartDay+j)%7]+'</TD>\n';}
result+='</TR>\n';for(var row=1;row<=6;row++){result+='<TR>\n';for(var col=1;col<=7;col++){var disabled=false;var dateClass="";if((display_month==this.currentDate.getMonth()+1)&&(display_date==this.currentDate.getDate())&&(display_year==this.currentDate.getFullYear())){dateClass="cpCurrentDate";}
else if(display_month==month){dateClass="cpCurrentMonthDate";}
else{dateClass="cpOtherMonthDate";}
var selected_date=display_date;var selected_month=display_month;var selected_year=display_year;result+=' <TD CLASS="'+this.cssPrefix+dateClass+'"><A HREF="javascript:'+windowref+this.returnFunction+'('+selected_year+','+selected_month+','+selected_date+');'+windowref+'CP_hideCalendar(\''+this.index+'\');" CLASS="'+this.cssPrefix+dateClass+'">'+display_date+'</A></TD>\n';display_date++;if(display_date>daysinmonth[display_month]){display_date=1;display_month++;}
if(display_month>12){display_month=1;display_year++;}}
result+='</TR>';}
var current_weekday=now.getDay()-this.weekStartDay;if(current_weekday<0){current_weekday+=7;}
result+='<TR>\n<TD COLSPAN=7 ALIGN=CENTER CLASS="cpTodayText">\n<A CLASS="cpTodayText" HREF="javascript:'+windowref+this.returnFunction+'(\''+now.getFullYear()+'\',\''+(now.getMonth()+1)+'\',\''+now.getDate()+'\');'+windowref+'CP_hideCalendar(\''+this.index+'\');">'+this.todayText+'</A>\n';result+='<BR></TD></TR></TABLE></CENTER></TD></TR></TABLE>\n';}
return result;}
var FILTER_SEP='\1';function Finder(parent,doctype,onload){this.menuitems={};this.has_primary_filters=false;this.doctype=doctype;var me=this;this.fn_list=['beforetableprint','beforerowprint','afterrowprint','aftertableprint','customize_filters'];this.wrapper=$a(parent,'div','finder_wrapper');this.make_tabs();this.current_loaded=null;this.make_filters(onload);this.hide=function(){$dh(me.wrapper);}
this.show=function(my_onload){$ds(me.wrapper);if(my_onload)my_onload(me);}
this.make_save_criteria();}
Finder.prototype.make_tabs=function(){this.tab_wrapper=$a(this.wrapper,'div','finder_tab_area');this.mytabs=new TabbedPage(this.tab_wrapper);this.mytabs.body_area.className='finder_body_area';this.mytabs.add_tab('Result');this.mytabs.add_tab('More Filters');this.mytabs.add_tab('Select Columns');this.mytabs.add_tab('Graph');$dh(this.mytabs.tabs['Graph']);}
Finder.prototype.make_body=function(){search_page.main_title.innerHTML=this.doctype;this.mytabs.tabs['Result'].show();var me=this;this.pri_filter_fields_area=$a(this.mytabs.tabs['Result'].tab_body,'div','finder_filter_area');this.filter_area=$a(this.mytabs.tabs['More Filters'].tab_body,'div','finder_filter_area');this.builder_area=$a(this.mytabs.tabs['Select Columns'].tab_body,'div','finder_builder_area');this.make_graph();this.make_save_criteria();}
Finder.prototype.make_graph=function(){var me=this;this.graph_area=$a(this.mytabs.tabs['Graph'].tab_body,'div','');this.mytabs.tabs['Graph'].onshow=function(){me.show_graph();}}
Finder.prototype.clear_graph=function(){if(this.graph_div)$dh(this.graph_div);this.graph_clear=1;}
Finder.prototype.show_graph=function(){var me=this;if(isIE){$dh(me.mytabs.tabs['Graph'].tab_body);$ds(me.mytabs.tabs['Graph'].tab_body);}
var show_no_graph=function(){if(!me.no_graph){me.no_graph=$a(me.mytabs.tabs['Graph'].tab_body,'div');me.no_graph.style.margin='16px';me.no_graph.innerHTML='No Graph Defined';}
$ds(me.no_graph);return;}
if(!me.current_loaded){show_no_graph();return;}
var sc=get_local('Search Criteria',me.sc_dict[me.current_loaded]);if(!sc||!sc.graph_series){show_no_graph();return;}
var series=me.dt.get_col_data(sc.graph_series);if(series.length>100)return;for(var i=0;i<series.length;i++){if(series[i].length>14)series[i]=series[i].substr(0,14)+'...';}
var ht=(series.length*20);if(!this.graph_clear)return;if(ht<400)ht=400;if(!me.graph_div){me.graph_div=$a(me.graph_area,'div');me.graph_div.style.position='relative';me.graph_div.style.border='2px solid #AAA';me.graph_div.style.marginTop='16px';}
$ds(me.graph_div);$dh(me.no_graph);var values=me.dt.get_col_data(sc.graph_values);for(var i=0;i<values.length;i++){values[i]=flt(values[i]);}
$h(me.graph_div,ht+'px');if(!me.graphobj){me.graphobj=new GraphViewer(me.graph_div);}
var g=me.graphobj;g.clear();g.set_title('');if(series.length<16)g.set_vertical();else g.set_horizontal();g.series1_color='#AAF';g.series1_border_color='#88A';g.series2_color='#AFA';g.series2_border_color='#8A8';g.series3_color='#FAA';g.series3_border_color='#88A';if(me.graph_settings)me.graph_settings(g);$h(g.main_area,(ht-160)+'px');$h(g._y_labels,(ht-160)+'px');g._x_name.style.top=(ht-40)+'px';g._x_labels.style.top=(ht-80)+'px';g.xtitle=sc.graph_series;g.ytitle=sc.graph_values;g.xlabels=series;g.add_series(sc.graph_values,g.series1_color,values,g.series1_border_color);g.refresh();this.graph_clear=0;}
Finder.prototype.make_save_criteria=function(){var me=this;this.sc_list=[];this.sc_dict={};for(var n in locals['Search Criteria']){var d=locals['Search Criteria'][n];if(d.doc_type==this.doctype){this.sc_list[this.sc_list.length]=d.criteria_name;this.sc_dict[d.criteria_name]=n;}}}
Finder.prototype.save_criteria=function(save_as){var overwrite=0;if(this.current_loaded&&(!save_as)){var overwrite=confirm('Do you want to overwrite the saved criteria "'+this.current_loaded+'"');if(overwrite){var doc=locals['Search Criteria'][this.sc_dict[this.current_loaded]];var criteria_name=this.current_loaded;}}
if(!overwrite){var criteria_name=prompt('Select a name for the criteria:','');if(!criteria_name)
return;var dn=createLocal('Search Criteria');var doc=locals['Search Criteria'][dn];doc.criteria_name=criteria_name;doc.doc_type=this.doctype;}
var cl=[];var fl={};for(var i=0;i<this.report_fields.length;i++){var chk=this.report_fields[i];if(chk.checked){cl[cl.length]=chk.df.parent+'\1'+chk.df.label;}}
for(var i=0;i<this.filter_fields.length;i++){var t=this.filter_fields[i];var v=t.get_value?t.get_value():'';if(v)fl[t.df.parent+'\1'+t.df.label+(t.bound?('\1'+t.bound):'')]=v;}
doc.columns=cl.join(',');doc.filters=docstring(fl);doc.sort_by=sel_val(this.dt.sort_sel);doc.sort_order=this.dt.sort_order;doc.page_len=this.dt.page_len;if(this.parent_dt)
doc.parent_doc_type=this.parent_dt
var me=this;var fn=function(r){me.sc_dict[criteria_name]=r.main_doc_name;me.set_criteria_sel(criteria_name);}
if(this.current_loaded&&overwrite){msgprint('Filters and Columns Synchronized. You must also "Save" the Search Criteria to update');loaddoc('Search Criteria',this.sc_dict[this.current_loaded]);}else{savedoc(doc.doctype,doc.name,'Save',fn);}}
Finder.prototype.hide_all_filters=function(){for(var i=0;i<this.filter_fields.length;i++){this.filter_fields[i].df.filter_hide=1;}}
Finder.prototype.clear_criteria=function(){for(var i=0;i<this.report_fields.length;i++){this.report_fields[i].checked=false;}
for(var i=0;i<this.filter_fields.length;i++){this.filter_fields[i].df.filter_hide=0;this.filter_fields[i].df.ignore=0;if(this.filter_fields[i].df.custom)
this.filter_fields[i].df.filter_hide=1;this.filter_fields[i].set_input(null);}
this.set_sort_options();search_page.main_title.innerHTML=this.doctype;this.clear_graph();this.current_loaded=null;this.customized_filters=null;this.sc=null;this.has_index=1;this.has_headings=1;for(var i in this.fn_list)this[this.fn_list[i]]=null;this.refresh_filters();}
Finder.prototype.select_column=function(dt,label,value){if(value==null)value=1;if(this.report_fields_dict[dt+'\1'+label])
this.report_fields_dict[dt+'\1'+label].checked=value;}
Finder.prototype.set_filter=function(dt,label,value){if(this.filter_fields_dict[dt+'\1'+label])
this.filter_fields_dict[dt+'\1'+label].set_input(value);}
Finder.prototype.load_criteria=function(criteria_name){this.clear_criteria();if(!this.sc_dict[criteria_name]){alert(criteria_name+' could not be loaded. Please Refresh and try again');}
this.sc=locals['Search Criteria'][this.sc_dict[criteria_name]];var report=this;if(this.sc&&this.sc.report_script)eval(this.sc.report_script);this.large_report=0;if(report.customize_filters){report.customize_filters(this);}
this.refresh_filters();var cl=this.sc.columns.split(',');for(var c=0;c<cl.length;c++){var key=cl[c].split('\1');this.select_column(key[0],key[1],1);}
var fl=eval('var a='+this.sc.filters+';a');for(var n in fl){if(fl[n]){var key=n.split('\1');if(key[1]=='docstatus'){}
this.set_filter(key[0],key[1],fl[n]);}}
this.set_criteria_sel(criteria_name);}
Finder.prototype.set_criteria_sel=function(criteria_name){search_page.main_title.innerHTML=criteria_name;var sc=locals['Search Criteria'][this.sc_dict[criteria_name]];if(sc&&sc.add_col)
var acl=sc.add_col.split('\n');else
var acl=[];var new_sl=[];for(var i=0;i<acl.length;i++){var tmp=acl[i].split(' AS ');if(tmp[1]){var t=eval(tmp[1]);new_sl[new_sl.length]=[t,"`"+t+"`"];}}
this.set_sort_options(new_sl);if(sc&&sc.sort_by){this.dt.sort_sel.value=sc.sort_by;}
if(sc&&sc.sort_order){sc.sort_order=='ASC'?this.dt.set_asc():this.dt.set_desc();}
if(sc&&sc.page_len){this.dt.page_len_sel.value=sc.page_len;}
this.current_loaded=criteria_name;}
Finder.prototype.setup_filters=function(){function can_dt_be_submitted(dt){var plist=getchildren('DocPerm',dt,'permissions','DocType');for(var pidx in plist){if(plist[pidx].submit)return 1;}
return 0;}
var me=this;me.make_body();var dt=me.parent_dt?me.parent_dt:me.doctype;me.report_fields=[];me.filter_fields=[];me.report_fields_dict={};me.filter_fields_dict={};var fl=[{'fieldtype':'Data','label':'ID','fieldname':'name','search_index':1,'parent':dt},{'fieldtype':'Data','label':'Created By','fieldname':'owner','search_index':1,'parent':dt},];if(can_dt_be_submitted(dt)){fl[fl.length]={'fieldtype':'Check','label':'Saved','fieldname':'docstatus','search_index':1,'def_filter':1,'parent':dt};fl[fl.length]={'fieldtype':'Check','label':'Submitted','fieldname':'docstatus','search_index':1,'def_filter':1,'parent':dt};fl[fl.length]={'fieldtype':'Check','label':'Cancelled','fieldname':'docstatus','search_index':1,'parent':dt};}
me.make_datatable();me.select_all=$a($a(me.builder_area,'div','',{padding:'8px 0px'}),'button');me.select_all.innerHTML='Select / Unselect All';me.select_all.onclick=function(){var do_select=1;if(me.report_fields[0].checked)do_select=0;for(var i in me.report_fields){me.report_fields[i].checked=do_select};}
me.orig_sort_list=[];if(me.parent_dt){var lab=$a(me.filter_area,'div','filter_dt_head');lab.innerHTML='Filters for '+me.parent_dt;var lab=$a(me.builder_area,'div','builder_dt_head');lab.innerHTML='Select columns for '+me.parent_dt;me.make_filter_fields(fl,me.parent_dt);var fl=[];}
var lab=$a(me.filter_area,'div','filter_dt_head');lab.innerHTML='Filters for '+me.doctype;var lab=$a(me.builder_area,'div','builder_dt_head');lab.innerHTML='Select columns for '+me.doctype;me.make_filter_fields(fl,me.doctype);if(!this.has_primary_filters)$dh(this.pri_filter_fields_area);$ds(me.body);}
Finder.prototype.refresh_filters=function(){for(var i=0;i<this.filter_fields.length;i++){var f=this.filter_fields[i];if(f.df.filter_hide){$dh(f.wrapper);}
else $ds(f.wrapper);if(f.df.bold){if(f.label_cell)$y(f.label_cell,{fontWeight:'bold'})}
else{if(f.label_cell)$y(f.label_cell,{fontWeight:'normal'})}
if(f.df['report_default'])
f.set_input(f.df['report_default']);if(f.df.in_first_page){f.df.filter_cell.parentNode.removeChild(f.df.filter_cell);this.pri_filter_fields_area.appendChild(f.df.filter_cell);this.has_primary_filters=1;$ds(this.pri_filter_fields_area);}}}
Finder.prototype.add_filter=function(f){if(this.filter_fields_dict[f.parent+'\1'+f.label]){this.filter_fields_dict[f.parent+'\1'+f.label].df=f;}else{f.custom=1;this.add_field(f,f.parent);}}
Finder.prototype.add_field=function(f,dt,in_primary){var me=this;var add_field=function(f,dt,parent){var tmp=make_field(f,dt,parent,me,false);tmp.in_filter=true;tmp.refresh();me.filter_fields[me.filter_fields.length]=tmp;me.filter_fields_dict[f.parent+'\1'+f.label]=tmp;return tmp;}
if(f.in_first_page)in_primary=true;var fparent=this.filter_fields_area;if(in_primary){fparent=this.pri_filter_fields_area;this.has_primary_filters=1;}
if(f.on_top){var cell=document.createElement('div');fparent.insertBefore(cell,fparent.firstChild);$y(cell,{width:'70%'});}else if(f.insert_before){var cell=document.createElement('div');fparent.insertBefore(cell,fparent[f.df.insert_before].filter_cell);$y(cell,{width:'70%'});}
else
var cell=$a(fparent,'div','',{width:'70%'});f.filter_cell=cell;if(f.fieldtype=='Date'){var my_div=$a(cell,'div','',{});var f1=copy_dict(f);f1.label='From '+f1.label;var tmp1=add_field(f1,dt,my_div);tmp1.sql_condition='>=';tmp1.bound='lower';var f2=copy_dict(f);f2.label='To '+f2.label;var tmp2=add_field(f2,dt,my_div);tmp2.sql_condition='<=';tmp2.bound='upper';}else if(in_list(['Currency','Int','Float'],f.fieldtype)){var my_div=$a(cell,'div','',{});var f1=copy_dict(f);f1.label=f1.label+' >=';var tmp1=add_field(f1,dt,my_div);tmp1.sql_condition='>=';tmp1.bound='lower';var f2=copy_dict(f);f2.label=f2.label+' <=';var tmp2=add_field(f2,dt,my_div);tmp2.sql_condition='<=';tmp2.bound='upper';}else{var tmp=add_field(f,dt,cell);}
if(f.fieldname!='docstatus')
me.orig_sort_list[me.orig_sort_list.length]=[f.label,'`tab'+f.parent+'`.`'+f.fieldname+'`'];if(f.def_filter)
tmp.input.checked=true;}
Finder.prototype.make_filter_fields=function(fl,dt){var me=this;if(search_page.sel)search_page.sel.value=dt;var t1=$a($a(me.builder_area,'div'),'table','builder_tab');this.filter_fields_area=$a(me.filter_area,'div');var dt_fields=fields_list[dt];for(var i=0;i<dt_fields.length;i++){fl[fl.length]=dt_fields[i];}
var sf_list=locals.DocType[dt].search_fields?locals.DocType[dt].search_fields.split(','):[];for(var i in sf_list)sf_list[i]=strip(sf_list[i]);this.ftab_cidx=1;var bidx=2;for(var i=0;i<fl.length;i++){var f=fl[i];if(f&&cint(f.search_index)){me.add_field(f,dt,in_list(sf_list,f.fieldname));}
if(f&&!in_list(no_value_fields,f.fieldtype)&&f.fieldname!='docstatus'&&(!f.report_hide)){if(bidx==2){var br=t1.insertRow(t1.rows.length);br.insertCell(0);br.insertCell(1);br.insertCell(2);bidx=0;}else{bidx++;}
var div=$a(br.cells[bidx],'div','builder_field');var t2=$a(div,'table');var row=t2.insertRow(0);row.insertCell(0);row.insertCell(1);$w(row,'10%');if(isIE){row.cells[0].innerHTML='<input type="checkbox" style="border: 0px;">';var chk=row.cells[0].childNodes[0];}else{var chk=$a(row.cells[0],'input');chk.setAttribute('type','checkbox');}
chk.style.marginRight='2px';chk.df=f;if(f.search_index||f.in_search){chk.checked=true;}
me.report_fields.push(chk);me.report_fields_dict[f.parent+'\1'+f.label]=chk;row.cells[1].innerHTML=f.label;row.cells[1].style.fontSize='11px';}}
me.set_sort_options();}
Finder.prototype.set_sort_options=function(l){var sl=this.orig_sort_list;empty_select(this.dt.sort_sel);if(l)sl=add_lists(l,this.orig_sort_list)
for(var i=0;i<sl.length;i++){this.dt.add_sort_option(sl[i][0],sl[i][1]);}}
Finder.prototype.make_filters=function(onload){var me=this;if(!locals['DocType'][this.doctype]){freeze('Loading Report...');$c('getdoctype',args={'doctype':this.doctype,'with_parent':1},function(r,rt){unfreeze();if(r.parent_dt)me.parent_dt=r.parent_dt;me.setup_filters();if(onload)onload(me);});}else{for(var key in locals.DocField){var f=locals.DocField[key];if(f.fieldtype=='Table'&&f.options==this.doctype)
this.parent_dt=f.parent;}
me.setup_filters();if(onload)onload(me);}}
Finder.prototype.make_datatable=function(){var me=this;this.dt_area=$a(this.mytabs.tabs['Result'].tab_body,'div','finder_dt_area');var clear_area=$a(this.mytabs.tabs['Result'].tab_body,'div');clear_area.style.marginTop='8px';clear_area.style.textAlign='right';this.clear_btn=$a(clear_area,'button');this.clear_btn.innerHTML='Clear Settings';this.clear_btn.onclick=function(){me.clear_criteria();me.set_filter(me.doctype,'Saved',1);me.set_filter(me.doctype,'Submitted',1);me.set_filter(me.doctype,'Cancelled',0);me.select_column(me.doctype,'ID');me.select_column(me.doctype,'Owner');me.dt.clear_all();}
var div=$a(this.mytabs.tabs['Result'].tab_body,'div');div.style.marginTop='8px';var d=$a(div,'div');d.innerHTML='<input type="checkbox" style="border: 0px;"> Show Query';this.show_query=d.childNodes[0];this.show_query.checked=false;this.dt=new DataTable(this.dt_area,'');this.dt.finder=this;this.dt.make_query=function(){var report=me;if(me.current_loaded&&me.sc_dict[me.current_loaded])
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
function DataTable(html_fieldname,dt,repname,hide_toolbar){var me=this;if(html_fieldname.substr){var html_field=cur_frm.fields_dict[html_fieldname];html_field.onrefresh=function(){if(me.docname!=cur_frm.docname){me.clear_all();me.docname=cur_frm.docname;}}
var parent=html_field.wrapper;datatables[html_fieldname]=this;}else{var parent=html_fieldname;}
this.start_rec=1;this.page_len=50;this.repname=repname;this.dt=dt;this.query='';this.history=[];this.has_index=1;this.has_headings=1;this.levels=[];if(this.dt){var tw=$a(parent,'div');var t=$a(tw,'div','link_type');t.style.cssFloat='right';$h(tw,'14px');t.style.margin='2px 0px';t.style.fontSize='11px';t.onclick=function(){new_doc(me.dt);}
t.innerHTML='New '+this.dt;}
if(!hide_toolbar)this.make_toolbar(parent);this.wrapper=$a(parent,'div','report_tab');$h(this.wrapper,cint(pagewidth*0.5)+'px');this.wrapper.onscroll=function(){scroll_head(this);}
this.hwrapper=$a(this.wrapper,'div','report_head_wrapper');this.twrapper=$a(this.wrapper,'div','report_tab_wrapper');this.no_data_tag=$a(this.wrapper,'div','report_no_data');this.no_data_tag.innerHTML='No Records Found';this.fetching_tag=$a(this.wrapper,'div','',{height:'120px',background:'url("images/ui/square_loading.gif") center no-repeat',display:'none'});}
DataTable.prototype.add_icon=function(parent,imgsrc){var i=$a(parent,'img');i.style.padding='2px';i.style.cursor='pointer';i.setAttribute('src','images/icons/'+imgsrc+'.gif');return i;}
DataTable.prototype.make_toolbar=function(parent){var me=this;this.hbar=$a(parent,'div','report_hbar');var ht=make_table(this.hbar,1,2,'100%',['80%','20%'],{verticalAlign:'middle'});var t=make_table($td(ht,0,0),1,13,'',['20px','','20px','','20px','','20px','','80px','100px','20px','80px','50px'],{height:'54px',verticalAlign:'middle'});var cnt=0;var make_btn=function(label,src,onclick,bold){$w($td(t,0,cnt+1),(20+((bold?7:6)*label.length))+'px');var img=$a($td(t,0,cnt+0),'img','');img.src="images/icons/"+src+".gif";var span=$a($td(t,0,cnt+1),'span','link_type',{margin:'0px 8px 0px 4px'});if(bold)$y(span,{fontSize:'14px',fontWeight:'bold'});span.innerHTML=label;span.onclick=onclick;}
make_btn('Refresh','page_refresh',function(){me.start_rec=1;me.run();},1);cnt+=2;make_btn('Export','page_excel',function(){me.do_export();});cnt+=2;make_btn('Print','printer',function(){me.do_print();});cnt+=2;make_btn('Calc','calculator',function(){me.do_calc();});cnt+=2;$td(t,0,cnt).innerHTML='Sort By:';$y($td(t,0,cnt),{textAlign:'right',paddingRight:'4px'});this.sort_sel=$a($td(t,0,cnt+1),'select');$w(this.sort_sel,'100px');this.sort_sel.onchange=function(){me.start_rec=1;me.run();}
select_register[select_register.length]=this.sort_sel;this.sort_icon=this.add_icon($td(t,0,cnt+2),'arrow_down');this.sort_order='DESC';this.sort_icon.onclick=function(){if(me.sort_order=='ASC')me.set_desc();else me.set_asc();me.start_rec=1;me.run();}
$td(t,0,cnt+3).innerHTML='Per Page:';$y($td(t,0,cnt+3),{textAlign:'right',paddingRight:'4px'});var s=$a($td(t,0,cnt+4),'select');$w(s,'50px');s.options[s.options.length]=new Option('50','50',false,true);s.options[s.options.length]=new Option('100','100',false,false);s.options[s.options.length]=new Option('500','500',false,false);s.options[s.options.length]=new Option('1000','1000',false,false);s.onchange=function(){me.page_len=flt(sel_val(this));}
select_register[select_register.length]=s;this.page_len_sel=s;var c1=$td(ht,0,1);c1.style.textAlign='right';var ic=this.add_icon(c1,'resultset_first');ic.onclick=function(){me.start_rec=1;me.run();}
var ic=this.add_icon(c1,'resultset_previous');ic.onclick=function(){if(me.start_rec-me.page_len<=0)return;me.start_rec=me.start_rec-me.page_len;me.run();}
this.has_next=false;var ic=this.add_icon(c1,'resultset_next');ic.onclick=function(){if(!me.has_next)return;me.start_rec=me.start_rec+me.page_len;me.run();}}
DataTable.prototype.set_desc=function(){this.sort_icon.src='images/icons/arrow_down.png';this.sort_order='DESC';}
DataTable.prototype.set_asc=function(icon){this.sort_icon.src='images/icons/arrow_up.png';this.sort_order='ASC';}
DataTable.prototype.add_sort_option=function(label,val){var s=this.sort_sel;s.options[s.options.length]=new Option(label,val,false,s.options.length==0?true:false);}
DataTable.prototype.update_query=function(no_limit){if(this.search_criteria&&this.search_criteria.custom_query){}else{this.query+=NEWLINE
+' ORDER BY '+sel_val(this.sort_sel)
+' '+this.sort_order;}
if(no_limit)return;this.query+=' LIMIT '+(this.start_rec-1)+','+this.page_len;if(this.show_query)
alert(this.query);}
DataTable.prototype._get_query=function(no_limit){$dh(this.no_data_tag);this.show_query=0;if(this.make_query)this.make_query();this.update_query(no_limit);}
DataTable.prototype.run=function(){if(this.validate&&!this.validate())
return;if(search_page.cur_finder){if(search_page.cur_finder.large_report==1){msgprint("This is a very large report and cannot be shown in the browser as it is likely to make your browser very slow.<br><br>Please click on 'Export' to open in a spreadsheet");return;}
search_page.cur_finder.mytabs.tabs['Result'].show();}
var me=this;this._get_query();if(this.set_data){this.show_result(this.set_data);this.set_data=null;return;}
$ds(this.fetching_tag);if(isFF)this.clear_all();var args={'query':me.query,'report_name':'DataTable','show_deleted':1,'sc_id':me.search_criteria?me.search_criteria.name:'','filter_values':me.filter_vals?docstring(me.filter_vals):'','defaults':pack_defaults(),'roles':'["'+user_roles.join('","')+'"]'}
if(this.is_simple)args.is_simple=1;$c('runquery',args,function(r,rt){$dh(me.fetching_tag);me.show_result(r,rt);});}
DataTable.prototype.clear_all=function(){if(this.htab&&this.htab.parentNode){this.htab.parentNode.removeChild(this.htab);delete this.htab;}
if(this.tab&&this.tab.parentNode){this.tab.parentNode.removeChild(this.tab);delete this.tab;}
$dh(this.no_data_tag);if(this.finder)this.finder.clear_graph();}
DataTable.prototype.has_data=function(){if(this.htab&&this.htab.rows.length)return 1;else return 0;}
DataTable.prototype.show_result=function(r,rt){var me=this;this.clear_all();if(this.has_headings){this.htab=$a(this.hwrapper,'table');$y(this.twrapper,{top:'25px',borderTop:'0px'});}
this.tab=$a(this.twrapper,'table');this.colwidths=eval(r.colwidths);this.coltypes=eval(r.coltypes);this.coloptions=eval(r.coloptions);this.colnames=eval(r.colnames);this.rset=eval(r.values);$y(this.tab,{tableLayout:'fixed'});if(this.beforetableprint)this.beforetableprint(this);if(this.rset&&this.rset.length){if(this.has_headings)this.make_head_tab(this.colnames);var start=this.start_rec;for(var vi=0;vi<this.rset.length;vi++){var row=this.tab.insertRow(vi);if(this.has_index){var c0=row.insertCell(0);$w(c0,'30px');$a(c0,'div','',{width:'23px'}).innerHTML=start;}
start++;for(var ci=0;ci<this.rset[vi].length;ci++){this.make_data_cell(vi,ci,this.rset[vi][ci]);}
if(this.afterrowprint){row.data_cells={};row.data={};for(var ci=0;ci<this.colnames.length;ci++){row.data[this.colnames[ci]]=this.rset[vi][ci];row.data_cells[this.colnames[ci]]=row.cells[ci+1];}
this.afterrowprint(row);}}}else{$ds(this.no_data_tag);}
if(this.rset.length&&this.rset.length==this.page_len)this.has_next=true;if(r.style){for(var i=0;i<r.style.length;i++){$yt(this.tab,r.style[i][0],r.style[i][1],r.style[i][2]);}}
if(this.aftertableprint)this.aftertableprint(this.tab);}
DataTable.prototype.get_col_width=function(i){if(this.colwidths&&this.colwidths.length&&this.colwidths[i])
return cint(this.colwidths[i])+'px';else return'100px';}
DataTable.prototype.make_head_tab=function(colnames){var r0=this.htab.insertRow(0);if(this.has_index){var c0=r0.insertCell(0);c0.className='report_head_cell';$w(c0,'30px');$a(c0,'div').innerHTML='Sr';this.total_width=30;}
for(var i=0;i<colnames.length;i++){var w=this.get_col_width(i);this.total_width+=cint(w);var c=r0.insertCell(r0.cells.length);c.className='report_head_cell';if(w)$w(c,w);$a(c,'div').innerHTML=colnames[i];c.val=colnames[i];}
$w(this.htab,this.total_width+'px');$w(this.tab,this.total_width+'px');}
DataTable.prototype.make_data_cell=function(ri,ci,val){var row=this.tab.rows[ri];var c=row.insertCell(row.cells.length);if(row.style.color)
c.style.color=row.style.color;if(row.style.backgroundColor)
c.style.backgroundColor=row.style.backgroundColor;if(row.style.fontWeight)
c.style.fontWeight=row.style.fontWeight;if(row.style.fontSize)
c.style.fontSize=row.style.fontSize;var w=this.get_col_width(ci);if(w)$w(c,w);c.val=val;var me=this;c.div=$a(c,'div','',{width:(cint(w)-7)+'px'});$s(c.div,val,this.coltypes[ci],this.coloptions[ci])}
DataTable.prototype.do_print=function(){this._get_query(true);args={query:this.query,title:this.rep_name?this.rep_name:this.dt,colnames:null,colwidhts:null,coltypes:null,has_index:this.has_index,has_headings:this.has_headings,check_limit:1,is_simple:(this.is_simple?'Yes':''),sc_id:(this.search_criteria?this.search_criteria.name:''),filter_values:docstring(this.filter_vals),finder:this.finder?this.finder:null};print_query(args);}
DataTable.prototype.do_export=function(){this._get_query(true);var me=this;export_ask_for_max_rows(this.query,function(q){export_csv(q,(me.rep_name?me.rep_name:me.dt),(me.search_criteria?me.search_criteria.name:''),me.is_simple,docstring(me.filter_vals));});}
DataTable.prototype.do_calc=function(){show_calc(this.tab,this.colnames,this.coltypes,1);}
DataTable.prototype.get_col_data=function(colname){var ci=0;if(!this.htab)return[];for(var i=1;i<this.htab.rows[0].cells.length;i++){var hc=this.htab.rows[0].cells[i];if(hc.val==colname){ci=i;break;}}
var ret=[];for(var ri=0;ri<this.tab.rows.length;ri++){ret[ret.length]=this.tab.rows[ri].cells[ci].val;}
return ret;}
DataTable.prototype.get_html=function(){var w=document.createElement('div');w=$a(w,'div');w.style.marginTop='16px';var tab=$a(w,'table');var add_head_style=function(c,w){c.style.fontWeight='bold';c.style.border='1px solid #000';c.style.padding='2px';if(w)$w(c,w);return c;}
var add_cell_style=function(c){c.style.padding='2px';c.style.border='1px solid #000';return c;}
tab.style.borderCollapse='collapse';var hr=tab.insertRow(0);var c0=add_head_style(hr.insertCell(0),'30px');c0.innerHTML='Sr';for(var i=1;i<this.htab.rows[0].cells.length;i++){var hc=this.htab.rows[0].cells[i];var c=add_head_style(hr.insertCell(i),hc.style.width);c.innerHTML=hc.innerHTML;}
for(var ri=0;ri<this.tab.rows.length;ri++){var row=this.tab.rows[ri];var dt_row=tab.insertRow(tab.rows.length);for(var ci=0;ci<row.cells.length;ci++){var c=add_cell_style(dt_row.insertCell(ci));c.innerHTML=row.cells[ci].innerHTML;}}
return w.innerHTML;}
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