// class content tip
ContentTip = function(parent, tip_content, cs){

  $y(parent,{position:'relative', cursor:'pointer'});
  
  this.parent = parent;
  this.tip_content = tip_content;
  if(cs) this.cs = cs;
  
  this.make();
  
  this.onhover();
}

// make tip body
ContentTip.prototype.make = function(){

  // Tip body wrapper
  this.wrapper = $a(null,'div','tip', {paddingBottom:'8px'});
  this.body = $a(this.wrapper,'div','tip_body');
  
  // arrow container
  this.arrow_wrapper = $a(null,'div','tip_arrow_container');
  this.arrow_main = $a(this.arrow_wrapper,'div','tip_arrow main');
  this.arrow_border = $a(this.arrow_wrapper,'div','tip_arrow border');

  // set parent
  this.parent.tip = this.wrapper;
  
  this.set_style()
  
  this.set_param();
}

// set parameter
ContentTip.prototype.set_param = function(){

  // set tip width
  $(this.wrapper).appendTo('body');
  
  var tmp = $a(null,'div');
  tmp.innerHTML = this.tip_content;
  this.body.appendChild(tmp);
  
  this.parent.width = $(this.wrapper).outerWidth() + 4*2;

	this.set_parent();
}

// set parent
ContentTip.prototype.set_parent = function(){

  $(this.wrapper).remove();
  
  // set tip
  $(this.wrapper).appendTo(this.parent);
  $(this.arrow_wrapper).appendTo(this.body);
}

// onhover
ContentTip.prototype.onhover = function(){
		
  // set hover
	$(this.parent).hover(
  
		function(){
      $y(this.tip, {width:this.width + 'px'});    
      var top = - ($(this.tip).outerHeight());
      
			$(this.tip)
				.css('top', top + 'px')
				.css('display', 'block')
		},
		
		function(e){
      $(this.tip).css('display','none');
		}
	);
}

// set style
ContentTip.prototype.set_style = function(){

	// custom-css
	if(this.cs){
		for(d in this.cs){
			if(d == 'backgroundColor'){
			  //$y(this.body,{backgroundColor:this.cs[d]});
			  //$y(this.arrow_main,{borderTop:'10px solid ' + this.cs[d]});
				this.body.style[d] = this.cs[d];
				this.arrow_main.style['borderTop'] = '14px solid ' + this.cs[d];
			}
			else if(!d.match(/border+/g)){
				this.body.style[d] = this.cs[d];
			}
		}	
	}
	
	this.set_border(4);
}


// set border
ContentTip.prototype.set_border = function(border_size, border_color){

  var bs = border_size ? border_size : 0;
  var bc = border_color ? border_color : '#444';

  $y(this.body, {border: bs + 'px' + ' solid ' + bc});
  
  if(bs){
    $y(this.arrow_border,{borderTop: bs + 14 + 'px' + ' solid ' + bc});
    $y(this.arrow_border,{borderLeft: (bs + 14) / 2 + 'px' + ' transparent ' + bc});
    $y(this.arrow_border,{borderRight: (bs + 14) / 2 + 'px' + ' transparent ' + bc});
    $y(this.arrow_border,{top:bs + 'px'});
  }
  else{
    $y(this.arrow_border,{border: '0px' + ' solid ' + bc});
  }
}
