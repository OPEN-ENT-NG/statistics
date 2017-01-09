function StatisticsController($scope, template, model) {

	this.initialize = function() {
        $scope.display = {
            form: true,
            admin: false,
            chart: true
        };

        $scope.generationDates = {};

		$scope.template = template;
        $scope.form = {};

		// Get Schools
		$scope.schools = [];
		for (var i=0; i < model.me.structures.length; i++) {
			$scope.schools.push({id: model.me.structures[i], name: model.me.structureNames[i]});
		}
		// getting all the substructures
		model.getSubstructures(function(substructures) {

			// adding to schools list if not already present.
			for (var j=0; j < substructures.length; j++) {
				checkAndAdd(substructures[j]);
			}

			var isLocalAdmin = (model.me.functions &&
			model.me.functions.ADMIN_LOCAL &&
			model.me.functions.ADMIN_LOCAL.scope);

			if(!isLocalAdmin) {
				endInitialization();
				return;
			}

			var schools = _.union(model.me.functions.ADMIN_LOCAL.scope, model.me.structures);
			if(schools.length === model.me.structures.length) {
				endInitialization();
			}
			else {
				// ADMIN_LOCAL.scope has schools that are not in model.me.structures. We need to get their names

				var query = http().serialize({schoolId: schools});
				model.getStructures(query, function(structures) {
					if (Array.isArray(structures) && structures.length > 0) {
						$scope.schools = structures;
					}
					endInitialization();
				});
			}
		});
	};

	function checkAndAdd(structure) {
		var found = $scope.schools.some(function (school) {
			return school.id === structure.id;
		});
		if (!found) { $scope.schools.push({ id: structure.id, name: structure.name }); }
	}

	function endInitialization() {
		addAllMySchools();
		
		// Get indicators and modules. Initialize dates
		$scope.indicators = [];
		$scope.modules = [];
		model.getMetadata(function(result){
			if (result && result.indicators && result.modules) {
				$scope.indicators = result.indicators;
				$scope.modules = formatModules(result.modules);
				if($scope.modules && $scope.modules.length > 0) {
					$scope.modules.push({name: lang.translate('statistics.form.all.applications')});
				}
				
				var fromDates = [];
				var toDates = [];
				initDateArrays(fromDates, toDates);
				$scope.dates = fromDates;
				$scope.toDates = toDates;
				
				displayDefaultChart();
				template.open('main', 'form');		
			}
			else {
				notify.error('statistics.initialization.error');
			}
		});
	}
	
	function addAllMySchools() {
		if($scope.schools.length > 1) {
			var allSchoolIds = _.pluck($scope.schools, "id").join(",");
			$scope.schools.push({id: allSchoolIds, name: lang.translate('statistics.all.my.schools')});
		}
	}
	
	function displayDefaultChart() {
		// Display chart "number of connections"
		$scope.form.school_id = $scope.schools[$scope.schools.length-1].id;
		$scope.form.from = $scope.dates[0].moment;
		$scope.form.indicator = 'LOGIN';
		$scope.form.to = $scope.toDates[$scope.toDates.length-1].moment;
		
		$scope.getData();
	}
	
	function initDateArrays(fromDates, toDates) {
		if(!Array.isArray(fromDates) || !Array.isArray(toDates)) {
			console.log("Error : parameter fromDates or toDates is not an  array");
			return;
		}
		
		var maxDate = moment().startOf('month'); // 1st day of current month
		
		// Set minDate to september 1st of current school year
		var year = moment().year();
		var september = 8;
		if(moment().month() < september) {
			year = year - 1;
		}
		var minDate = moment().year(year).month(september).startOf('month');
		fromDates.push(getDateObjectForNgOptions(minDate.clone()));
		
		while(minDate.isBefore(maxDate)) {
			var date = minDate.add(1, 'months').clone();
			fromDates.push(getDateObjectForNgOptions(date));
			toDates.push(getDateObjectForNgOptions(date, true));
		}
		
		// Add yesterday
		var yesterday = moment().startOf('day');
		if(yesterday.isAfter(maxDate) || toDates.length===0) {
			toDates.push({
				label: lang.translate('yesterday'),
				moment: yesterday
			});
		}
	}
	
	// Return a date object, formatted for ng-options.
	// Parameter "displayPreviousMonthForLabel" is a boolean to display previous month (e.g. "september" instead of "october")
	function getDateObjectForNgOptions(moment, displayPreviousMonthForLabel) {
		return {
			label: (displayPreviousMonthForLabel===true) ? formatMomentAsPreviousMonth(moment) : formatMoment(moment),
			moment: moment
		};
	}
	
	function formatMoment(moment) {
		return moment.lang('fr').format('MMMM YYYY');
	}
	
	function formatMomentAsPreviousMonth(moment) {
		return formatMoment(moment.clone().add(-1, 'months'));
	}
	
	$scope.translate = function(label) {
		var result = lang.translate(label);
		if(label === "ACCESS") {
			result = result + ' ' + lang.translate("statistics.form.to.applications");
		}
		return result;
	};
    
    $scope.generation = function() {
        notify.info(lang.translate('statistics.admin.generate.info.start'));
        var schoolIdArray = getSchoolIdArray($scope.form);
        $scope.form.from = moment($scope.form.from).seconds(0);
        $scope.form.to = moment($scope.form.to ).seconds(0);
        var query = generateQuery($scope.form, schoolIdArray);
        model.generation(query, function(data) {
            notify.info(lang.translate('statistics.admin.generate.info.end'));
        });
        $scope.form.from = $scope.dates[0].moment;
        $scope.form.indicator = 'LOGIN';
        $scope.form.to = $scope.toDates[$scope.toDates.length-1].moment;
    };

    /* If pFormat = "csv", get data as CSV and save it as a file.
     * Else, get data as JSON and display chart */
	$scope.getData = function(pFormat) {
		$scope.form.processing = true;

		if ('csv' === pFormat) {
			var aSchool = $scope.schools[0];
			var getStructuresMetadata = (aSchool && aSchool.city === undefined && aSchool.uai === undefined);
			
			if(!getStructuresMetadata) {
				getCsvData();
				return;
			}

			// Get UAI and city of structures
			var query = generateQuery($scope.form, schoolIdArray);
			model.getStructures(query, function(structures) {
				if (Array.isArray(structures) && structures.length > 0) {
					$scope.schools = structures;
					addAllMySchools();
					getCsvData();
				}
				else {
					notify.error('statistics.get.structures.error');
					$scope.form.processing = false;
					return;
				}
			});
		}
		else {
			if($scope.form.from.isAfter($scope.form.to) || $scope.form.from.isSame($scope.form.to)) {
				notify.error('statistics.invalid.dates');
				$scope.form.processing = false;
				return;
			}

			var schoolIdArray = getSchoolIdArray($scope.form);
			var query = generateQuery($scope.form, schoolIdArray);
			$scope.chart = {};
			$scope.chart.form = angular.copy($scope.form); // "Save" form data for CSV export

			model.getData(query, function(data) {
				var chartForm = $scope.chart.form;
				$scope.chart.indicatorName = {};
				$scope.chart.indicatorName.plural = lang.translate(chartForm.indicator).toLowerCase();
				$scope.chart.indicatorName.singular = lang.translate(chartForm.indicator + '.singular').toLowerCase();
				
				if(chartForm.indicator==="ACCESS" && chartForm.module===undefined) {
					$scope.chart.accessAllModules = true;
					$scope.chart.data = formatDataForPieChart(data);
					$scope.chart.allData = {
						globalData: $scope.chart.data,
						detailData: extractDetailedData(data)
					};
				}
				else if(chartForm.indicator==="ACTIVATED_ACCOUNTS") {
					$scope.chart.data = formatDataForStackedGroupedBarChart(data, 'ACCOUNTS');

					var profiles = ['Teacher', 'Personnel', 'Student', 'Relative'];
					var legendData = [];
					for (var i=0; i<profiles.length; i++) {
						legendData.push({
							profile_id: lang.translate(profiles[i]),
							color: colorFromProfile(profiles[i].toLowerCase())
						});
					}
					legendData.push({
						profile_id: lang.translate('statistics.accounts.not.activated'),
						color: notActivatedColor
					});
					$scope.chart.legendData = legendData;
				}
				else {
					$scope.chart.data = formatDataForBarChart(data);
				}
				
				template.open('chart', 'chart');
				$scope.form.processing = false;
				$scope.chart.title = getChartTitle(chartForm.indicator, schoolIdArray, chartForm.module);
				$scope.$apply();
			}, function() {
				$scope.form.processing = false;
				$scope.$apply();
			});
		}

	};
	
	function getCsvData() {
		// Export data corresponding to displayed chart (i.e. data from $scope.chart.form, not from $scope.form)
		var schoolIdArray = getSchoolIdArray($scope.chart.form);
		var query = generateQuery($scope.chart.form, schoolIdArray);

		model.getData(query, function(data) {
			// Replace string "uai"+structureId by uai, string "city"+structureId by city, and structureIds by structureNames
			var formattedData = data;
			_.map(schoolIdArray, function(schoolId) {
				var school = _.find($scope.schools, function(school) {
					return schoolId === school.id;
				});
				if(school && school.name) {
					formattedData = formattedData.replace(new RegExp('uai'+schoolId, 'g'), school.uai)
						.replace(new RegExp('city'+schoolId, 'g'), school.city)
						.replace(new RegExp(schoolId, 'g'), school.name);
				}
			});
			
			// Replace applications' technicalNames by displayNames
			_.map($scope.modules, function(module) {
				if(module && module.name && module.technicalName) {
					formattedData = formattedData.replace(new RegExp(module.technicalName, 'g'), module.name);
				}
			});

			var csvFilename = getCsvFilename($scope.chart.form);

			// Process the response as if it was a file
			if (window.navigator.msSaveOrOpenBlob) { // IE 10+
				formattedData = preprendBOM(formattedData);
				
				var blob = new Blob([formattedData]);
				window.navigator.msSaveOrOpenBlob(blob, csvFilename);
			}
			else {
				formattedData = preprendBOM(encodeURIComponent(formattedData));
			    var uri = 'data:application/csv;charset=utf-8,' + formattedData;
			    var hiddenElement = document.createElement('a');
			    
			    if ('download' in hiddenElement) { // For browsers that support attribute "download" (e.g. Chrome and Firefox)
				    hiddenElement.href = uri;
				    hiddenElement.download = csvFilename;
				    document.body.appendChild(hiddenElement);
				    hiddenElement.click();
				    document.body.removeChild(hiddenElement);
			    }
			    else { // Other browsers such as Safari
			    	location.href = uri;
			    	notify.info(lang.translate('statistics.rename.downloaded.file.to.csv'));
			    }
			}

			$scope.form.processing = false;
			$scope.$apply();
			
		}, function() {
			$scope.form.processing = false;
			$scope.$apply();
		});
	}
	
	// Prepend BOM character ('\uFEFF') : it forces Excel 2007+ to open a CSV file with charset UTF-8
	function preprendBOM(string) {
		return '\uFEFF' + string;
	}
	
	function getSchoolIdArray(form) {
		return form.school_id.split(",");
	}

	// making a json instead of a query
	function generateQuery(form, schoolIdArray) {
		var query = [];
		query.push({"schoolIdArray" : schoolIdArray});
		query.push( {"indicator" : form.indicator });
		query.push( {"startDate" : form.from.unix() });
		query.push( {"endDate" : form.to.unix() });

		var json;

		if(form.module!==undefined && form.module!==null) {
			query.push({"module": form.module});
			json = {
				schoolIdArray : schoolIdArray,
				indicator : form.indicator,
				startDate : form.from.unix(),
				endDate : form.to.unix(),
				module: form.module
			};
		} else {
			json = {
				schoolIdArray : schoolIdArray,
				indicator : form.indicator,
				startDate : form.from.unix(),
				endDate : form.to.unix()
			};
		}

		return json;
	}

	function getCsvFilename(form) {
		var separator = "-";
		var filename = lang.translate(form.indicator).toLowerCase() + separator;
		if(form.module!==undefined && form.module!==null) {
			filename += form.module + separator;
		}
		
		var schoolIdArray = form.school_id.split(",");
		if(schoolIdArray.length > 1) {
			filename += 'multi' + separator;
		}
		else {
			filename += getSchoolName(schoolIdArray[0]) + separator;
		}
		
		return filename + moment().lang('fr').format('YYYY-MM-DD') + ".csv";
	}
	

	// Format raw data for directive 'piechart'
	function formatDataForPieChart(inputData) {
		var indicator = $scope.chart.form.indicator;
		
		// 1) Group data by module_id, then sort data in descending order
		var dataGroupedByModule = _.groupBy(inputData, function(element){ 
			return element.module_id; 
		});
		var modules = _.keys(dataGroupedByModule);

		var result = _.map(modules, function(module){
            // Only keep fields "indicator" and "module_id"
            var cleanedData = _.map(dataGroupedByModule[module], function(elem){
                return { 
            		module_id: elem.module_id,
            		count: elem[indicator]
                };
            });
            // Sum indicator's values for each module_id
            return _.reduce(cleanedData, function(a,b){ 
            	return { 
            		module_id: a.module_id, 
            		count: a.count + b.count
                };
            });
		});
		result = _.sortBy(result, function(element){ return - element.count; });
		
		
		var nbTop = 3;
		var colors = ["#3366CC", "#DC3912", "#109618", "#990099"];
		$scope.chart.topModulesIds = [];
		
		if(result.length > nbTop) {
			// 2) Keep values for the top 3 applications. Sum the remaining values and label it as "others"
			var n = result.length - nbTop;
			var topModules = _.initial(result, n);
			$scope.chart.topModulesIds = _.pluck(topModules, 'module_id');
			
			var remainingModules = _.last(result, n);
			var totalOfRemainingModules = countTotal(remainingModules);
			
			var otherModules = {
				module_id: lang.translate("statistics.others"),
				count : totalOfRemainingModules
			};
			topModules.push(otherModules);

			result = topModules;
		}
		
		var totalCount = countTotal(result);
		var moduleToColorMap = {};
		for(var i=0; i < result.length; i++) {
			moduleToColorMap[result[i].module_id] = colors[i];
		}
		$scope.chart.moduleToColorMap = moduleToColorMap;
		
		// 3) Add fields for directive "piechart"
		addFieldsForPieChartDirective(result, totalCount);
		
		return result;
	}
	
	function countTotal(dataArray, indicator) {
	    if(dataArray===undefined || dataArray.length===0) {
	    	return 0;
	    }
		
	    if(indicator===undefined) {
	      indicator = 'count';
	    }
	    
		return dataArray.map(function(elem){ 
			return elem[indicator];
		}).reduce(function(a,b){ 
			return a + b;
		});
	}
	
	function addFieldsForPieChartDirective(dataArray, totalCount) {
		for(var i=0; i < dataArray.length; i++) {
			dataArray[i].total = totalCount;
			dataArray[i].value = dataArray[i].count / totalCount;
			dataArray[i].color = $scope.chart.moduleToColorMap[dataArray[i].module_id];
			dataArray[i].module_id = getApplicationName(dataArray[i].module_id);
		}
	}
	
	
	// Returns the same data than function 'formatDataForPieChart', but detailed by profile
	function extractDetailedData(data) {
		var indicator = $scope.chart.form.indicator;
		var dataGroupedByProfile = _.groupBy(data, function(element){ return element.profil_id; });
		var profiles = _.keys(dataGroupedByProfile);

		return _.map(profiles, function(profile){
			// Partition data in two groups : "top" modules and "others". TODO when upgrading to a newer version of underscore.js : use function "_.partition"
			var topModules = [];
			var remainingModules = [];
			var dataArray = dataGroupedByProfile[profile];
			for(var i=0; i < dataArray.length; i++) {
				var element = {
					module_id: dataArray[i].module_id,
					profil_id: profile,
					count: dataArray[i][indicator]
				};
				if(_.contains($scope.chart.topModulesIds, dataArray[i].module_id)) {
					topModules.push(element);
				}
				else {
					remainingModules.push(element);
				}
			}
			
			if(topModules.length < $scope.chart.topModulesIds.length) {
				// Add default values to topModules
				var detailedModulesIds = _.pluck(topModules, 'module_id');
				var missingModulesIds = _.difference($scope.chart.topModulesIds, detailedModulesIds);
				_.map(missingModulesIds, function(moduleId) {
					topModules.push({
						module_id: moduleId,
						profil_id: profile,
						count: 0
					});
				});
			}

			
			var totalOfRemainingModules = countTotal(remainingModules);
			var otherModules = {
				module_id: lang.translate("statistics.others"),
				profil_id: profile,
				count : totalOfRemainingModules
			};
			topModules.push(otherModules);

			var totalCount = countTotal(topModules);
			addFieldsForPieChartDirective(topModules, totalCount);
			
			return topModules;
		});
	}
	
	/* Format raw data for directive 'stackedgroupedBarchart'.
	 * Parameter 'totalFieldName' is the name of the field corresponding to the total
	 */
	function formatDataForStackedGroupedBarChart(inputData, totalFieldName) {
		var indicator = $scope.chart.form.indicator;
		
		var dataGroupedByDate = _.chain(inputData).map(function(elem) {
			elem.date = substringDate(elem.date);
			return elem;
		})
		.groupBy("date")
		.value();
		
		var result = [];
		for (var date in dataGroupedByDate) {
		    var details = [];
		    
		    var orderedProfileArray = ['Teacher', 'Personnel', 'Student', 'Relative'];
		    dataGroupedByDate[date] = _.sortBy(dataGroupedByDate[date], function(element) {
		    	return orderedProfileArray.indexOf(element.profil_id);
		    });
		    
		    for (var i=0; i<dataGroupedByDate[date].length; i++) {
		        var column = "column" + (i+1);
		        var element = dataGroupedByDate[date][i];
		        var nbActivated = element[indicator];
		        var nbTotal = element[totalFieldName];
		        var percentageActivated = +(100*nbActivated / (nbTotal)).toFixed(2);
		        var activatedAccounts = {
		            name: element.profil_id,
		            column: column,
		            yBegin: 0,
		            yEnd: nbActivated,
		            color : colorFromProfile(element.profil_id),
		            label: nbActivated + 
		            	lang.translate('statistics.accounts.activated.on')
		            	.replace(/\{0\}/g, lang.translate(element.profil_id)) + 
		            	nbTotal +
		            	' (' + percentageActivated + '%)'
		        };
		        details.push(activatedAccounts);

		        var notActivatedAccounts = {
		            name: element.profil_id + " not activated",
		            column: column,
		            yBegin: nbActivated,
		            yEnd: nbTotal,
		            color: notActivatedColor,
		            label: (nbTotal - nbActivated) + 
		            	lang.translate('statistics.accounts.not.activated.on')
		            	.replace(/\{0\}/g, lang.translate(element.profil_id)) +
		            	nbTotal +
		            	' (' + (100 - percentageActivated) + '%)'
		        };
		        details.push(notActivatedAccounts);
		    }

		    var resultElem = {date: date, columnDetails: details};
		    resultElem.total = d3.max(resultElem.columnDetails, function(d) { 
		      return d.yEnd; 
		    });
		    result.push(resultElem);
		}
		result = _.chain(result).sortBy(function(element) {
			return element.date;
		})
		.map(function(element){
			element.date = formatDate(element.date);
			return element;
		})
		.value();
		return result;
	}
	
	// Format raw data for directive 'barchart'
	function formatDataForBarChart(inputData) {
		var dates = _.chain(inputData).pluck("date").sort().uniq().value();
		var orderedProfileArray = ['Teacher', 'Personnel', 'Student', 'Relative', 'Guest'];
		var profiles = _.chain(inputData).pluck("profil_id").uniq().sort(function(thisProfile, thatProfile){
			var thisIndex = orderedProfileArray.indexOf(thisProfile);
			var thatIndex = orderedProfileArray.indexOf(thatProfile);
			if(thisIndex === -1) {
				return 1;
			}
			else if(thatIndex === -1) {
				return -1;
			}
			return thisIndex - thatIndex;
		}).value();
		var outputData = [];
		$scope.chart.profiles = profiles;

		for(var i=0; i < profiles.length; i++) {
			outputData[i] = [];
			for(var j=0; j < dates.length; j++) {
				var y0value = (i===0) ? 0 : (outputData[i-1][j].y + outputData[i-1][j].y0);

				var date;
				if(dates[j].length > 10) {
					var substr = substringDate(dates[j]);
					date = formatDate(substr);
				}
				else {
					date = dates[j];
				}
				
				outputData[i][j] = {
					x : j,
					date : date,
					profile : lang.translate(profiles[i]),
					y0 : y0value,
					color : colorFromProfile(profiles[i])
				};

				var data = _.chain(inputData).where({"profil_id":profiles[i], "date":dates[j]}).value();
				if(data && data.length > 0) {
					outputData[i][j].y = data[0][$scope.chart.form.indicator];
				}
				else {
					// Set default values when no data is found for the specified profile and date
					outputData[i][j].y = 0;
				}
			}
		}
		
		return outputData;
	}
	
	function substringDate(dateString) {
		return dateString.substring(0, 10); // Keep 'yyyy-MM-dd' from 'yyyy-MM-dd HH:mm.ss.SSS'
	}
	
	function formatDate(dateString) {
		return moment(dateString).lang('fr').format('MMMM YYYY');
	}
	
	function formatModules(modules) {
		var result = [];
		for(var i=0; i<modules.length; i++) {
			var module = {
				technicalName : modules[i],
				name : getApplicationName(modules[i])
			};
			result.push(module);
		}
		result.sort(function(thisModule, thatModule) {
			return thisModule.name.localeCompare(thatModule.name);
		});
		return result;
	}
	
	function getApplicationName(moduleName) {
		var app = _.find(model.me.apps, function(app){
			if(app.address && app.address.indexOf('/') !== -1) {
				var appPrefix = app.address.split('/')[1];
				return moduleName.toLowerCase() === appPrefix;
			}
			return false;
		});
		var label = (app !== undefined) ? 
				lang.translate(app.displayName) : 
				lang.translate(moduleName); // used for apps that do not have a dedicated vert.x module (e.g. "AdminConsole")
		return label;
	}
	
	function getChartTitle(indicator, schoolIdArray, module) {
		var indicatorName = lang.translate(indicator).toLowerCase();
		var title;
		if(indicator === 'ACCESS') {
			if(module) {
				title = lang.translate('statistics.number.of.to.module')
					.replace(/\{0\}/g, indicatorName)
					.replace(/\{1\}/g, getApplicationName(module));
			}
			else {
				title = lang.translate('statistics.number.of.with.apostrophe').replace(/\{0\}/g, indicatorName) + 
					" " + lang.translate('statistics.form.to.applications');
			}
		}
		else if(indicator === 'ACTIVATION') {
			title = lang.translate('statistics.number.of.with.apostrophe').replace(/\{0\}/g, indicatorName);
		}
		else {
			title = lang.translate('statistics.number.of').replace(/\{0\}/g, indicatorName);
		}

		if(schoolIdArray.length > 1) {
			title += ' ' + lang.translate('statistics.for.my.schools');
		}
		else {
			title += ' ' + lang.translate('statistics.for.school').replace(/\{0\}/g, getSchoolName(schoolIdArray[0]));
		}

		return title;
	}
	
	function getSchoolName(schoolId) {
		var school = _.find($scope.schools, function(school) {
			return school.id === schoolId;
		});
		if (school && school.name) {
			return school.name;
		}
		return '';
	}

    var notActivatedColor = '#ADA6A6';
    var colorsMatch = {
        relative: '#48AEDF',
        teacher: '#6FBE2D',
        student: '#FE3956',
        personnel: '#9F47C5',
        guest: '#FFCC33',
        defaultColor: 'black'
    };

    function colorFromProfile(profile) {
        var userType = profile;
        if(userType != null && userType != "null" && colorsMatch.hasOwnProperty(userType.toLowerCase())) {
            return colorsMatch[userType.toLowerCase()];
        }
        else {
            return colorsMatch.defaultColor;
        }
    }

    this.initialize();
    
}