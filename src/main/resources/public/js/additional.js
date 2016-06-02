// constants for directives 'barchart' and 'stackedgroupedBarchart'
var margin = {top: 20, right: 10, bottom: 20, left: 60},
    height = 250 - 0.5 - margin.top - margin.bottom,
    paddingLeft = 30,
    format = d3.format("d"),
    legendHeight = 100;

// Directive based on http://briantford.com/blog/angular-d3 : bar chart with a transition from stacked to grouped
module.directive('barchart', function ($window, $timeout) {
        var totalBar = [];
	  return {
	    restrict: 'E',
	    scope: {
	      val: '=', // data
	      grouped: '=', // boolean to display a grouped or stacked chart
	      indicator: '='
	    },
	    link: function (scope, element, attrs) {

		  var renderPromise;

	      // set up initial svg object
	      var vis = d3.select(element[0])
	        .append("svg")
	          .style('width', '100%')
	          .attr("height", height + margin.top + margin.bottom + legendHeight)
	          .append("g")
	          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          // Browser onresize event
          $window.onresize = function() {
            scope.$apply();
          };

          // Watch for resize event
          scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.render(scope.val, scope.val);
          });

	      scope.$watch('val', function (newVal, oldVal) {
 	          // reset grouped state to false
	          scope.grouped = false;

	    	  scope.render(newVal, oldVal);
	      });

	      scope.render = function (newVal, oldVal) {
	        // clear the elements inside of the directive
	        vis.selectAll('*').remove();

	        // if 'val' is undefined, exit
	        if (!newVal) {
	          return;
	        }

	        if (renderPromise) {
	        	$timeout.cancel(renderPromise);
	        }

	        renderPromise = $timeout(function () {
		        var parentElementWidth = d3.select(element[0]).node().offsetWidth;
		        var width = parentElementWidth - margin.left - margin.right;

		        // Based on: http://mbostock.github.com/d3/ex/stack.html
		        var n = newVal.length, // number of layers
		            m = newVal[0].length, // number of samples per layer
		            data = d3.layout.stack()(newVal);

		        var mx = m,
		            my = d3.max(data, function(d) {
		              return d3.max(d, function(d) {
		                return d.y0 + d.y;
		              });
		            }),
		            mz = d3.max(data, function(d) {
		              return d3.max(d, function(d) {
		                return d.y;
		              });
		            }),
		            x = function(d) { return d.x * width / mx; },
		            xPadding = function(d) { return (paddingLeft + d.x*width / mx); },
		            y0 = function(d) { return height - d.y0 * height / my; },
		            y1 = function(d) { return height - (d.y + d.y0) * height / my; },
		            y2 = function(d) { return d.y * height / mz; }; // or `my` not rescale

		        // Layers for each color
		        // =====================

		        var layers = vis.selectAll("g.layer")
		            .data(data)
		          .enter().append("g")
		            .style("fill", function(d, i) {
		            	return d[0].color;
			         })
		            .attr("class", "layer");

		        // Tooltip
		        // =======

		        var tip = d3.tip()
		        .attr('class', 'tooltip stat')
		        .offset([-10, 0])
		        .html(function(d) {
		          var label = (d.y > 1) ?
		        		  d.y + " " + scope.indicator.plural + " " + d.profile + "s" :
		        		  d.y + " " + scope.indicator.singular + " " + d.profile;
		          return '<div class="arrow"></div><div class="content">' + label + "</div>";
		        });

		        vis.call(tip);

		        // Bars
		        // ====

		        var bars = layers.selectAll("g.bar")
		            .data(function(d) { return d; })
		          .enter().append("g")
		            .attr("class", "bar")
		            .attr("transform", function(d) {
		              var translation = paddingLeft + x(d);
		              return "translate(" + translation + ",0)";
		            });

		        bars.append("rect")
		            .attr("width", x({x: 0.9}))
		            .attr("x", 0)
		            .attr("y", height)
		            .attr("height", 0)
		            .on('mouseover', tip.show)
		            .on('mouseout', tip.hide)
		          .transition()
		            .delay(function(d, i) { return i * 10; })
		            .attr("y", y1)
		            .attr("height", function(d) {
                        if (!totalBar[d.x]) {
                            totalBar[d.x] = 0;
                        };
                        totalBar[d.x] = totalBar[d.x] + d.y;
                        return y0(d) - y1(d);
		            });

		        // X-axis labels
		        // =============

		        var labels = vis.selectAll("text.label")
		            .data(data[0])
		          .enter().append("text")
		            .attr("class", "label")
		            .attr("x", xPadding)
		            .attr("y", height + 6)
		            .attr("dx", x({x: 0.45}))
		            .attr("dy", ".71em")
		            .attr("text-anchor", "middle")
		            .text(function(d, i) {
                        var displayedVal = totalBar[d.x];
                        totalBar[d.x] = 0;
		              return d.date + " (" + displayedVal + ")";
		            });
		        
        		vis.selectAll("text.label")
        		.call(wrap, x({x: 0.9}));

		        // Y-axis
		        // =============

		        var yScale = d3.scale.linear().domain([0, my]).rangeRound([height, 0]);

		        var yAxis = d3.svg.axis()
			        .scale(yScale)
			        .orient("left")
			        .tickFormat(format);

		        vis.append("g")
			        .attr("class", "y axis")
			        .call(yAxis)
			        .attr("transform", "translate(" + paddingLeft + ",0)")
			        .append("text")
			        .attr("transform", "rotate(-90)")
			        .attr("y", 6)
			        .attr("dy", ".71em")
			        .style("text-anchor", "end");

		        // Chart Key
		        // =========

            	function getProfile(d, i) {
            		return d[0].profile;
            	}
            	
            	function getColor(d, i) {
            		return d[0].color;
            	}
            	
            	drawLegend(vis, data, getProfile, getColor);
		        
		        // Animate between grouped and stacked
		        // ===================================

		        function updateYAxis(yMax) {
			          var yScale = d3.scale.linear().domain([0, yMax]).rangeRound([height, 0]);

			          var yAxis = d3.svg.axis()
				        .scale(yScale)
				        .orient("left")
				        .tickFormat(format);

			          vis.selectAll("g.y.axis")
			            .transition()
			              .duration(500)
			              .call(yAxis);
		        }

		        function transitionGroup() {
		          vis.selectAll("g.layer rect")
		            .transition()
		              .duration(500)
		              .delay(function(d, i) { return (i % m) * 10; })
		              .attr("x", function(d, i) { return x({x: 0.9 * ~~(i / m) / n}); })
		              .attr("width", x({x: 0.9 / n}))
		              .each("end", transitionEnd);

		          updateYAxis(mz);

		          function transitionEnd() {
		            d3.select(this)
		              .transition()
		                .duration(500)
		                .attr("y", function(d) { return height - y2(d); })
		                .attr("height", y2);
		          }
		        }

		        function transitionStack() {
		          vis.selectAll("g.layer rect")
		            .transition()
		              .duration(500)
		              .delay(function(d, i) { return (i % m) * 10; })
		              .attr("y", y1)
		              .attr("height", function(d) {
		                return y0(d) - y1(d);
		              })
		              .each("end", transitionEnd);

		          updateYAxis(my);

		          function transitionEnd() {
		            d3.select(this)
		              .transition()
		                .duration(500)
		                .attr("x", 0)
		                .attr("width", x({x: 0.9}));
		          }
		        }

		        // setup a watch on 'grouped' to switch between views
		        scope.$watch('grouped', function (newVal, oldVal) {
		          if (newVal) {
		            transitionGroup();
		          } else {
		            transitionStack();
		          }
		        });
	        }, 200);
	      };

	    }
	  };
	});




module.directive('piechart', function () {
	// constants
	var pieConstants = {
		svgHeight: 270,
		svgWidth: 285,
    	centerX: 150,
    	centerY: 130,
    	radiusX: 130,
    	radiusY: 100,
    	height: 30,
    	innerRadius: 0
    };
	
	return {
		restrict: 'E',
		scope: {
			val: '=', // Must contain two fields : globalData (aggregated data for all profiles) and detailData (data for each profile)
			grouped: '=', // boolean. If true, display data for each profile. 
			indicator: '='
		},
		link: function (scope, element, attrs) {
			scope.$watch('val', function (newVal, oldVal) {
				scope.render(newVal, oldVal);
			});
			
			scope.render = function (newVal, oldVal) {
		        // if 'val' is undefined, exit
		        if (!newVal) {
		          return;
		        }
		        
		        // Based on http://bl.ocks.org/NPashaP/9994181
	        	var Donut3D={};
	        	
	        	function pieTop(d, rx, ry, ir ){
	        		if(d.endAngle - d.startAngle === 0 ) return "M 0 0";
	        		var sx = rx*Math.cos(d.startAngle),
	        			sy = ry*Math.sin(d.startAngle),
	        			ex = rx*Math.cos(d.endAngle),
	        			ey = ry*Math.sin(d.endAngle);
	        			
	        		var ret =[];
	        		ret.push("M",sx,sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",ex,ey,"L",ir*ex,ir*ey);
	        		ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*sx,ir*sy,"z");
	        		return ret.join(" ");
	        	}

	        	function pieOuter(d, rx, ry, h ){
	        		var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
	        		var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);
	        		
	        		var sx = rx*Math.cos(startAngle),
	        			sy = ry*Math.sin(startAngle),
	        			ex = rx*Math.cos(endAngle),
	        			ey = ry*Math.sin(endAngle);
	        			
	        			var ret =[];
	        			ret.push("M",sx,h+sy,"A",rx,ry,"0 0 1",ex,h+ey,"L",ex,ey,"A",rx,ry,"0 0 0",sx,sy,"z");
	        			return ret.join(" ");
	        	}

	        	function pieInner(d, rx, ry, h, ir ){
	        		var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
	        		var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);
	        		
	        		var sx = ir*rx*Math.cos(startAngle),
	        			sy = ir*ry*Math.sin(startAngle),
	        			ex = ir*rx*Math.cos(endAngle),
	        			ey = ir*ry*Math.sin(endAngle);

	        			var ret =[];
	        			ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
	        			return ret.join(" ");
	        	}

	        	function getPercent(d){
	        		return (d.endAngle-d.startAngle > 0.2 ? 
	        				Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%' : '');
	        	}	
	        	
	        	Donut3D.transition = function(id, data, rx, ry, h, ir){
	        		function arcTweenInner(a) {
	        		  var i = d3.interpolate(this._current, a);
	        		  this._current = i(0);
	        		  return function(t) { return pieInner(i(t), rx+0.5, ry+0.5, h, ir);  };
	        		}
	        		function arcTweenTop(a) {
	        		  var i = d3.interpolate(this._current, a);
	        		  this._current = i(0);
	        		  return function(t) { return pieTop(i(t), rx, ry, ir);  };
	        		}
	        		function arcTweenOuter(a) {
	        		  var i = d3.interpolate(this._current, a);
	        		  this._current = i(0);
	        		  return function(t) { return pieOuter(i(t), rx-0.5, ry-0.5, h);  };
	        		}
	        		function textTweenX(a) {
	        		  var i = d3.interpolate(this._current, a);
	        		  this._current = i(0);
	        		  return function(t) { return 0.6*rx*Math.cos(0.5*(i(t).startAngle+i(t).endAngle));  };
	        		}
	        		function textTweenY(a) {
	        		  var i = d3.interpolate(this._current, a);
	        		  this._current = i(0);
	        		  return function(t) { return 0.6*rx*Math.sin(0.5*(i(t).startAngle+i(t).endAngle));  };
	        		}
	        		
	        		var _data = d3.layout.pie().sort(null).value(function(d) {return d.value;})(data);
	        		
	        		d3.select("#"+id).selectAll(".innerSlice").data(_data)
	        			.transition().duration(750).attrTween("d", arcTweenInner);
	        			
	        		d3.select("#"+id).selectAll(".topSlice").data(_data)
	        			.transition().duration(750).attrTween("d", arcTweenTop);
	        			
	        		d3.select("#"+id).selectAll(".outerSlice").data(_data)
	        			.transition().duration(750).attrTween("d", arcTweenOuter);
	        			
	        		d3.select("#"+id).selectAll(".percent").data(_data).transition().duration(750)
	        			.attrTween("x",textTweenX).attrTween("y",textTweenY).text(getPercent);
	        	};
	        	
	        	Donut3D.draw=function(id, data, x /*center x*/, y/*center y*/, 
	        			rx/*radius x*/, ry/*radius y*/, h/*height*/, ir/*inner radius*/){
	        	
	        		var _data = d3.layout.pie().sort(null).value(function(d) {return d.value;})(data);
	        		
	        		var slices = d3.select("#"+id).append("g").attr("transform", "translate(" + x + "," + y + ")")
	        			.attr("class", "slices");
	        			
	        		slices.selectAll(".innerSlice").data(_data).enter().append("path").attr("class", "innerSlice")
	        			.style("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
	        			.attr("d",function(d){ return pieInner(d, rx+0.5,ry+0.5, h, ir);})
	        			.each(function(d){this._current=d;});
	        		
	        		slices.selectAll(".topSlice").data(_data).enter().append("path").attr("class", "topSlice")
	        			.style("fill", function(d) { return d.data.color; })
	        			.style("stroke", function(d) { return d.data.color; })
	        			.attr("d",function(d){ return pieTop(d, rx, ry, ir);})
	        			.each(function(d){this._current=d;})
	        			.on('mouseover', tip.show)
	        			.on('mouseout', tip.hide);
	        		
	        		slices.selectAll(".outerSlice").data(_data).enter().append("path").attr("class", "outerSlice")
	        			.style("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
	        			.attr("d",function(d){ return pieOuter(d, rx-0.5,ry-0.5, h);})
	        			.each(function(d){this._current=d;})
	        			.on('mouseover', tip.show)
	        			.on('mouseout', tip.hide);

	        		slices.selectAll(".percent").data(_data).enter().append("text").attr("class", "percent")
	        			.attr("x",function(d){ return 0.6*rx*Math.cos(0.5*(d.startAngle+d.endAngle));})
	        			.attr("y",function(d){ return 0.6*ry*Math.sin(0.5*(d.startAngle+d.endAngle));})
	        			.text(getPercent).each(function(d){this._current=d;});
	        	};

	        	function getPiechartId(index) {
	        		return "piechart"+index;
	        	}
	        	
	        	function getPiechartLabelId(index) {
	        		return "piechartLabel"+index;
	        	}
	        	
		        // Tooltip
		        // =======
		    
		        var tip = d3.tip()
		        .attr('class', 'tooltip')
		        .offset([+30, 0])
		        .html(function(d) {
		          var label = d.data.count + " " + scope.indicator.plural + " " + d.data.module_id;
		          return '<div class="arrow"></div><div class="content">' + label + "</div>";
		        });
		        
		        // Draw piechart
		        // =============
		        
				var svgElem = d3.select(element[0])
					.append("svg")
					.attr("id",getPiechartId(0))
					.attr("height", pieConstants.svgHeight)
					.attr("width", pieConstants.svgWidth)
					.append("g");
				
				svgElem.call(tip);
				
		        Donut3D.draw(getPiechartId(0), newVal.globalData, pieConstants.centerX, pieConstants.centerY, 
		        		pieConstants.radiusX, pieConstants.radiusY, 
		        		pieConstants.height, pieConstants.innerRadius);
		        
		        // Chart Key
		        // =========

		        var svgLegendId = "svglegend";
		        var svgLegend = d3.select(element[0]).append("svg")
					.attr("id", svgLegendId)
					.attr("height", 200)
					.attr("width", pieConstants.svgWidth);
		        
		        var keyText = svgLegend.selectAll("text.key")
		            .data(newVal.globalData)
		          .enter().append("text")
		            .attr("class", "key")
		            .attr("y", function (d, i) {
		              return 6 + 30*(i%4);
		            })
		            .attr("x", function (d, i) {
		              return 155 * Math.floor(i/4) + 45;
		            })
		            .attr("dx", 15)
		            .attr("dy", ".71em")
		            .attr("text-anchor", "left")
		            .text(function(d, i) {
		              return d.module_id;
		            });

		        var keySwatches = svgLegend.selectAll("rect.swatch")
		            .data(newVal.globalData)
		          .enter().append("rect")
		            .attr("class", "swatch")
		            .attr("width", 20)
		            .attr("height", 20)
		            .style("fill", function(d, i) {
		            	return d.color;
		            })
		            .attr("y", function (d, i) {
		              return 30*(i%4);
		            })
		            .attr("x", function (d, i) {
		              return 155 * Math.floor(i/4) + 30;
		            });

		        
		        function appendProfileText(element, i, profil_id) {
		        	element.append("text")
		        		.attr("id",getPiechartLabelId(i))
		                .attr("x", pieConstants.centerX)
		                .attr("y", 20)
		                .attr("text-anchor", "middle")
		                .style("font-size", "16px")
		                .text(lang.translate(profil_id));
		        }
		        
		        // setup a watch on 'grouped' to switch between views
		        scope.$watch('grouped', function (newValue, oldValue) {
		        	if(newValue) {
		        		// Sort newVal.detailData[0] based on the module order of newVal.globalData ; the order must be kept for the transition
		        		var sortedDetailedData = [];
		        		for (var j=0; j < newVal.globalData.length; j++) {
		        			var foundElement = _.findWhere(newVal.detailData[0], {module_id: newVal.globalData[j].module_id});
		        			if(foundElement!==undefined) {
		        				sortedDetailedData.push(foundElement);
		        			}
		        		}
		        		
		        		for(var i=0; i < newVal.detailData.length; i++) {
		        			var id = getPiechartId(i);
		        			if(i===0) {
				        		Donut3D.transition(id, sortedDetailedData, 
				        				pieConstants.radiusX, pieConstants.radiusY, 
			    		        		pieConstants.height, pieConstants.innerRadius);
				        		
				        		appendProfileText(d3.select('#'+id), i, newVal.detailData[i][0].profil_id);
		        			}
		        			else {
		        				// Insert piecharts before legend
		        				var svgElem = d3.select(element[0])
			    					.insert("svg", "#"+svgLegendId)
			    					.attr("id",id)
			    					.attr("height", pieConstants.svgHeight)
			    					.attr("width", pieConstants.svgWidth)
			    					.append("g");
		        				
			        			Donut3D.draw(id, newVal.detailData[i], pieConstants.centerX, pieConstants.centerY, 
			    		        		pieConstants.radiusX, pieConstants.radiusY, 
			    		        		pieConstants.height, pieConstants.innerRadius);
			        			
			        			appendProfileText(svgElem, i, newVal.detailData[i][0].profil_id);			        			
		        			}
		        		}
		        		
		        	} else {
		        		for(var i=0; i < newVal.detailData.length; i++) {
		        			var id = getPiechartId(i);
		        			if(i===0) {
				        		Donut3D.transition(id, newVal.globalData, 
				        				pieConstants.radiusX, pieConstants.radiusY, 
			    		        		pieConstants.height, pieConstants.innerRadius);
		        			}
		        			else {
		        				d3.select("#"+id).remove();
		        			}
		        			d3.select("#"+getPiechartLabelId(i)).remove();
		        		}
		        	}
		        });
		        
			};
		}
	};
});




// Bar chart that is both stacked and grouped. Based on http://bl.ocks.org/gencay/4629518 and https://github.com/gencay/stackedGroupedChart
module.directive('stackedgroupedBarchart', function ($window) {
	  
	  return {
		restrict: 'E',
		scope: {
			val: '=',
			legend: '='
		},
        link: function (scope, element, attrs) {
        	// set up initial svg object
        	var svg = d3.select(element[0]).append("svg")
        	.style('width', '100%')
        	.attr("height", height + margin.top + margin.bottom + legendHeight)
        	.append("g")
        	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        	// Browser onresize event
        	$window.onresize = function() {
        		scope.$apply();
        	};

        	// Watch for resize event
        	scope.$watch(function() {
        		return angular.element($window)[0].innerWidth;
        	}, function() {
        		scope.render(scope.val, scope.val);
        	});

        	scope.$watch('val', function (newVal, oldVal) {
        		scope.render(newVal, oldVal);
        	});

        	scope.render = function (newVal, oldVal) {
        		// clear the elements inside of the directive
        		svg.selectAll('*').remove();

        		// if 'val' is undefined, exit
        		if (!newVal) {
        			return;
        		}

        		var parentElementWidth = d3.select(element[0]).node().offsetWidth;
        		var width = parentElementWidth - margin.left - margin.right;

        		var x0 = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
        		var x1 = d3.scale.ordinal();
        		var y = d3.scale.linear().range([height, 0]);

        		var xAxis = d3.svg.axis()
        		.scale(x0)
        		.orient("bottom");

        		var yAxis = d3.svg.axis()
        		.scale(y)
        		.orient("left")
        		.tickFormat(format);

        		var yBegin;

        		// TODO : innerColumns should be a parameter of the directive
        		var innerColumns = {
        				"column1" : ["Student", "Student not activated"],
        				"column2" : ["Relative", "Relative not activated"],
        				"column3" : ["Personnel", "Personnel not activated"],
        				"column4" : ["Teacher", "Teacher not activated"]
        		}; 

        		var data = newVal;

        		x0.domain(data.map(function(d) { return d.date; }));
        		x1.domain(d3.keys(innerColumns)).rangeRoundBands([0, x0.rangeBand()]);
        		y.domain([0, d3.max(data, function(d) { 
        			return d.total; 
        		})]);

        		// Tooltip
        		// =======

        		var tip = d3.tip()
        		.attr('class', 'tooltip')
        		.offset([-10, 0])
        		.html(function(d) {
        			return '<div class="arrow"></div><div class="content">' + d.label + "</div>";
        		});

        		// Bars
        		// ====

        		var project_stackedbar = svg.selectAll(".project_stackedbar")
        		.data(data)
        		.enter().append("g")
        		.attr("class", "g")
        		.attr("transform", function(d) { 
        			return "translate(" + x0(d.date) + ",0)"; 
        		});
        		
                project_stackedbar.selectAll("rect")
                .data(function(d) { return d.columnDetails; })
                .enter()
                .append("rect")
                .attr("width", x1.rangeBand())
                .attr("x", function(d) { 
                        return x1(d.column);
                })
                .style("fill", function(d) { return d.color; })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .attr("y", function(d) {
                	return height; 
                })
                .attr("height", function(d) { 
                	return 0; 
                })
                .transition()
                .duration(500)
                .attr("y", function(d) { 
                	return y(d.yEnd); 
                })
                .attr("height", function(d) { 
                	return y(d.yBegin) - y(d.yEnd); 
                });

        		svg.call(tip);

        		// Axis
        		// ====
        		
        		svg.append("g")
        		.attr("class", "x axis")
        		.attr("transform", "translate(0," + height + ")")
        		.call(xAxis)
        		.selectAll("g.tick text")
        		.call(wrap, x0.rangeBand());
        		
        		svg.append("g")
        		.attr("class", "y axis")
        		.call(yAxis)
        		.attr("transform", "translate(" + x0(data[0].date) + ",0)")
        		.append("text")
        		.attr("transform", "rotate(-90)")
        		.attr("y", 6)
        		.attr("dy", ".7em")
        		.style("text-anchor", "end");
        		
        		// Chart Key
        		// =========

        		function getProfile(d, i) {
        			return d.profile_id;
        		}

        		function getColor(d, i) {
        			return d.color;
        		}

        		drawLegend(svg, scope.legend, getProfile, getColor);
        	};
        }
    };
});


/**
 * Parameter 'getProfile' : function to get profile from data
 * Parameter 'getColor' : function to get color from data
 */
function drawLegend(d3element, data, getProfile, getColor) {
	var keyText = d3element.selectAll("text.key")
	.data(data)
	.enter().append("text")
	.attr("class", "key")
	.attr("y", function (d, i) {
		return height + 42 + 30*(i%2);
	})
	.attr("x", function (d, i) {
		return 155 * Math.floor(i/2) + 15;
	})
	.attr("dx", 15)
	.attr("dy", ".71em")
	.attr("text-anchor", "left")
	.text(function(d, i) {
		return getProfile(d, i);
	});
	
	var keySwatches = d3element.selectAll("rect.swatch")
	.data(data)
	.enter().append("rect")
	.attr("class", "swatch")
	.attr("width", 20)
	.attr("height", 20)
	.style("fill", function(d, i) {
		return getColor(d, i);
	})
	.attr("y", function (d, i) {
		return height + 36 + 30*(i%2);
	})
	.attr("x", function (d, i) {
		return 155 * Math.floor(i/2);
	});
}


// Function for responsive labels on axis, based on https://gist.github.com/mbostock/7555321
function wrap(labels, width) {
	labels.each(function() {
		var text = d3.select(this),
		words = text.text().split(/\s+/).reverse(),
		word,
		line = [],
		lineNumber = 0,
		lineHeight = 1.1, // ems
		x = text.attr("x"),
		dx = parseFloat(text.attr("dx")),
		y = text.attr("y"),
		dy = parseFloat(text.attr("dy")),
		tspan = text.text(null).append("tspan").attr("x", x).attr("dx", dx).attr("y", y).attr("dy", dy + "em");
		
		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan").attr("x", x).attr("dx", dx).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
			}
		}
	});
}