function StatisticsController($scope, template, model) {

	this.initialize = function() {
		$scope.template = template;
		$scope.form = {};

		// Get Schools
		$scope.schools = [];
		for (var i=0; i < model.me.structures.length; i++) {
			$scope.schools.push({id: model.me.structures[i], name: model.me.structureNames[i]});
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
	};
	
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
			var query = http().serialize({schoolId: model.me.structures});
			model.getStructures(query, function(structures) {
				if (Array.isArray(structures) && structures.length > 0) {
					$scope.schools = structures;
					addAllMySchools();
					getCsvData();
				}
				else {
					notify.error('statistics.get.structures.error');
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
					// TODO : formatData for piechart
					$scope.chart.data = data;
				}
				else {
					$scope.chart.data = formatData(data);
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
		query += '&format=csv';
		
		model.getData(query, function(data) {
			// Replace string "rne"+structureId by rne, string "city"+structureId by city, and structureIds by structureNames
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
	
	function generateQuery(form, schoolIdArray) {
		var query = http().serialize({ schoolId: schoolIdArray}) +
		"&indicator=" + form.indicator +
		"&startDate=" +  form.from.unix() +
		"&endDate=" + form.to.unix();
		
		if(form.module!==undefined && form.module!==null) {
			query += '&module=' + form.module;
		}
		
		return query;
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
	

	// Format raw data for d3.js
	function formatData(inputData) {
		var dates = _.chain(inputData).pluck("date").sort().uniq().value();
		var orderedProfileArray = ['Teacher', 'Personnel', 'Student', 'Parent', 'Guest'];
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
					var substr = dates[j].substring(0, 10); // Keep 'yyyy-MM-dd' from 'yyyy-MM-dd HH:mm.ss.SSS'
					date = moment(substr).lang('fr').format('MMMM YYYY');
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
					outputData[i][j].y = data[0][$scope.form.indicator];
				}
				else {
					// Set default values when no data is found for the specified profile and date
					outputData[i][j].y = 0;
				}
			}
		}
		
		return outputData;
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
	
    var colorsMatch = {
        relative: '#48AEDF',
        teacher: '#6FBE2D',
        student: '#FE3956',
        personnel: '#9F47C5',
        guest: '#FFCC33',
        defaultColor: 'black'
    };

    function colorFromProfile(profile) {
    	var userType = profile.toLowerCase();
    	if(colorsMatch.hasOwnProperty(userType)) {
    		return colorsMatch[userType];
    	}
    	else {
    		return colorsMatch.defaultColor;
    	}
    }
    
    this.initialize();
    
    // TODO : remove temporary code
    var salesData=[
   	{label:"Basic", color:"#3366CC"},
   	{label:"Plus", color:"#DC3912"},
   	{label:"Lite", color:"#FF9900"},
   	{label:"Elite", color:"#109618"},
   	{label:"Delux", color:"#990099"}
   ];

   function randomData(){
	   return salesData.map(function(d){ 
		   return {label:d.label, value:1000*Math.random(), color:d.color};
	   });
   }
   
   $scope.testdmt = {};
   $scope.testdmt.piechartData = randomData();

}