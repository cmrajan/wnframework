// Sidebar Menu
function SidebarMenu() {
	this.menu_items = {};	
	this.menu_lists = {};
	this.menu_dt_details = {};
	this.menu_page = new Page('_menu');
	this.menu_page.cont.onshow = function() {
		if(sidebar_menu.cur_node) sidebar_menu.cur_node.show_selected();
	}
	this.wrapper = $a(this.menu_page.cont.body,'div','',{margin:'8px'});
	this.head = $a(this.wrapper, 'div', 'standard_title');
	this.body = $a(this.wrapper, 'div');
  
	// make tree
	this.tree_wrapper = $a($i('menu_div'),'div','center_area',{padding:'4px',paddingBottom:'0px',marginRight:'0px'});
	this.menu_tree = new Tree($a(this.tree_wrapper,'div'),'100%',1);
}

// Menu Click
// ----------

SidebarMenu.prototype.menu_click = function(n) {
  if(n.menu_item.menu_item_type == 'DocType') {
    sidebar_menu.cur_node = n;
    sidebar_menu.show_listing(n.menu_item.name);
  } else if(n.menu_item.menu_item_type == 'New') {
  	newdoc(n.menu_item.link_id);
  } else if(n.menu_item.menu_item_type == 'Single') {
    loaddoc(n.menu_item.link_id, n.menu_item.link_id, null, n); 
    n.toggle();
  } else if(n.menu_item.menu_item_type == 'Page') {
    loadpage(n.menu_item.link_id, n.onload, n); 
    n.toggle();
  } else if(n.menu_item.menu_item_type == 'Report') {
    loadreport(n.menu_item.link_id, n.menu_item.criteria_name, n.onload, n);
  } else {
  	if(n.onload) n.onload();
    n.toggle();
  }
}

// Make Menu
// ----------

pscript.set_menu_style = function(level) {
	var opt = {}
	if(level==0) {
		opt = {
			show_exp_img:0, show_icon:0 
			,label_style:{padding:'4px', cursor: 'pointer',color:'#222',marginBottom:'4px',fontSize:'14px',borderBottom:'1px solid #CCC',fontWeight: 'bold', backgroundColor:'#EEE'}
			//,onselect_style:{color: '#56C'}
			//,ondeselect_style:{color: '#000'}
		}
	} else if(level==1) {
		opt = {
			show_exp_img:0, show_icon:0
			,label_style:{padding:'4px', paddingTop:'0px', marginBottom:'4px', cursor: 'pointer',borderBottom:'1px solid #CCC',fontSize:'12px',marginLeft:'8px'}
			,onselect_style:{fontWeight: 'bold'}
			,ondeselect_style:{fontWeight: 'normal'}
		}
	} if(level>=2) {
		opt = {
			show_exp_img:0, show_icon:0 
			,label_style:{padding:'4px', paddingTop:'0px', marginBottom:'4px', cursor: 'pointer',borderBottom:'1px dashed #EEE',fontSize:'11px',marginLeft:'12px'}
			,onselect_style:{fontWeight: 'bold'}
			,ondeselect_style:{fontWeight: 'normal'}
		}
	}
	return opt
}

SidebarMenu.prototype.make_menu = function(parent_node) {
  var me = sidebar_menu;
  var callback = function(r,rt) {
  	// style
  	// -----
  	var level = 0
  	if(parent_node) level = parent_node.level;
  	var opt = pscript.set_menu_style(level);

    // add nodes
    // ---------
    for(var i=0;i<r.message.length;i++) {
      var n = me.menu_tree.addNode(
      	parent_node,
      	r.message[i].menu_item_label,
      	(r.message[i].icon ? 'images/icons/' + r.message[i].icon : ''),
      	me.menu_click,
      	(r.message[i].has_children ? me.make_menu : null),
      	opt);

      n.menu_item = r.message[i];
      if(n.menu_item.onload) {
      	n.onload = eval('var a='+n.menu_item.onload+';a'); // set function
      }
      if(n.menu_item.menu_item_type=='DocType')
        me.menu_items[n.menu_item.name] = n.menu_item;
      // level
      // -----
      if(parent_node) n.level = parent_node.level + 1;
      else n.level = 1;
      
      // callback parent tree
    }
    if(parent_node) { parent_node.show_expanded(); }
  }
  $c_obj('Menu Control','get_children',parent_node ? parent_node.menu_item.name : '', callback);
}

SidebarMenu.prototype.show_listing = function(mid) {
  // get DocType Details
  // -------------------
  loadpage('_menu');
  var me = sidebar_menu;
  var mi = me.menu_items[mid];
  if(!me.menu_dt_details[mid]) {
    $c_obj('Menu Control', 'get_dt_details', mi.link_id + '~~~' + mi.doctype_fields, 
      function(r,rt) { me.menu_dt_details[mi.name] = r.message; if(r.message) me.show_listing(mi.name); });
    return;
  }

  me.head.innerHTML = mi.menu_item_label;

  if(me.cur_menu_lst) 
    $dh(me.cur_menu_lst.wrapper);

  if(!me.menu_lists[mi.name]) {

    var lst = new Listing(mi.menu_item_label);
    lst.cl = me.menu_dt_details[mi.name].columns;
    lst.dt = mi.link_id;

    lst.opts = {
		cell_style : {padding:'3px 2px',borderBottom:'1px dashed #CCC'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		head_style : {height:'20px',overflow:'hidden',verticalAlign:'middle',fontWeight:'bold',padding:'1px'},
		head_main_style : {padding:'0px'},
		hide_export : 1,
		hide_print : 1,
		hide_refresh : 0,
		hide_rec_label: 0,
		show_calc: 0,
		show_empty_tab : 0,
		show_bottom_paging: 0,
		round_corners: 0,
		no_border: 1,
		show_new: 1,
		show_report: 1
    }
    
    if(user_defaults.hide_report_builder) lst.opts.show_report = 0;
    
    lst.is_std_query = 1;
    lst.get_query = function() {
      q = {};
      var fl = [];
      q.table = repl('`tab%(dt)s`', {dt:this.dt});
      
      for(var i=0;i<this.cl.length;i++) fl.push(q.table+'.`'+this.cl[i][0]+'`')
      q.fields = fl.join(', ');
      q.conds = q.table + '.docstatus < 2 ';
      this.sort_order = in_list(this.coltypes, 'Date') ? 'DESC' : 'ASC';
      this.sort_by = 'name';
      this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
      this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
    }
  
    lst.colwidths=['5%']; lst.colnames=['Sr']; lst.coltypes=['Data']; lst.coloptions = [''];

    for(var i=0;i < lst.cl.length;i++) {
      lst.colwidths[i+1] = cint(100/lst.cl.length) + '%';
      lst.colnames[i+1] = lst.cl[i][1];
      lst.coltypes[i+1] = lst.cl[i][2];
      lst.coloptions[i+1] = lst.cl[i][3];
    }

    lst.make($a(this.body, 'div', '', {display:'none'}));

    var sf = me.menu_dt_details[mi.name].filters;
    for(var i=0;i< sf.length;i++) {
      if(in_list(['Int','Currency','Float','Date'], sf[i][2])) {
        lst.add_filter('From '+sf[i][1], sf[i][2], sf[i][3], mi.link_id, sf[i][0], '>=');
        lst.add_filter('To '+sf[i][1], sf[i][2], sf[i][3], mi.link_id, sf[i][0], '<=');
      } else {
        lst.add_filter(sf[i][1], sf[i][2], sf[i][3], mi.link_id, sf[i][0], (in_list(['Data','Text','Link'], sf[i][2]) ? 'LIKE' : ''));
      }
    }

    me.menu_lists[mi.name] = lst;
    lst.run();
  }

  $ds(me.menu_lists[mi.name].wrapper);
  me.cur_menu_lst = me.menu_lists[mi.name];
  
}
var sidebar_menu;
function setup_side_bar() {
  if(!left_sidebar_width) return;
  sidebar_menu = new SidebarMenu();	
  sidebar_menu.make_menu('');
}

startup_lst[startup_lst.length] = setup_side_bar;

