// Directive based on http://briantford.com/blog/angular-d3
module.directive('chart', function ($window) {

	  // constants
	  var margin = {top: 20, right: 10, bottom: 20, left: 60},
	    height = 250 - 0.5 - margin.top - margin.bottom,
	    color = d3.interpolateRgb("#f77", "#77f"),
	    paddingLeft = 30,
	    nbTicks = 5;

	  return {
	    restrict: 'E',
	    scope: {
	      val: '=',
	      grouped: '='
	    },
	    link: function (scope, element, attrs) {

	      // set up initial svg object
	      var vis = d3.select(element[0])
	        .append("svg")
	          .style('width', '100%')
	          .attr("height", height + margin.top + margin.bottom + 100)
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
	            y0 = function(d) { return height - d.y0 * height / my; },
	            y1 = function(d) { return height - (d.y + d.y0) * height / my; },
	            y2 = function(d) { return d.y * height / mz; }; // or `my` not rescale

	        // Layers for each color
	        // =====================

	        var layers = vis.selectAll("g.layer")
	            .data(data)
	          .enter().append("g")
	            .style("fill", function(d, i) {
	              return color(i / (n - 1));
	            })
	            .attr("class", "layer");

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
	          .transition()
	            .delay(function(d, i) { return i * 10; })
	            .attr("y", y1)
	            .attr("height", function(d) {
	              return y0(d) - y1(d);
	            });

	        // X-axis labels
	        // =============

	        var labels = vis.selectAll("text.label")
	            .data(data[0])
	          .enter().append("text")
	            .attr("class", "label")
	            .attr("x", x)
	            .attr("y", height + 6)
	            .attr("dx", x({x: 0.45}))
	            .attr("dy", ".71em")
	            .attr("text-anchor", "middle")
	            .text(function(d, i) {
	              return d.date;
	            });

	        // Y-axis
	        // =============

	        var yScale = d3.scale.linear().domain([0, my]).rangeRound([height, 0]);
	        
	        var yAxis = d3.svg.axis()
		        .scale(yScale)
		        .orient("left")
		        .ticks(nbTicks);

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

	        var keyText = vis.selectAll("text.key")
	            .data(data)
	          .enter().append("text")
	            .attr("class", "key")
	            .attr("y", function (d, i) {
	              return height + 42 + 30*(i%3);
	            })
	            .attr("x", function (d, i) {
	              return 155 * Math.floor(i/3) + 15;
	            })
	            .attr("dx", x({x: 0.1}))
	            .attr("dy", ".71em")
	            .attr("text-anchor", "left")
	            .text(function(d, i) {
	              return d[0].profile;
	            });

	        var keySwatches = vis.selectAll("rect.swatch")
	            .data(data)
	          .enter().append("rect")
	            .attr("class", "swatch")
	            .attr("width", 20)
	            .attr("height", 20)
	            .style("fill", function(d, i) {
	              return color(i / (n - 1));
	            })
	            .attr("y", function (d, i) {
	              return height + 36 + 30*(i%3);
	            })
	            .attr("x", function (d, i) {
	              return 155 * Math.floor(i/3);
	            });

	        // Animate between grouped and stacked
	        // ===================================

	        function updateYAxis(yMax) {
		          var yScale = d3.scale.linear().domain([0, yMax]).rangeRound([height, 0]);
			        
		          var yAxis = d3.svg.axis()
			        .scale(yScale)
			        .orient("left")
			        .ticks(nbTicks);
			        
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
	      };
        
	    }
	  };
	});