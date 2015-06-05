function StatisticsController($scope, template, model) {

	this.initialize = function() {
		$scope.template = template;

		// Init variables used in template form.html
		$scope.form = {};
		$scope.form.school_id = $scope.getAllSchoolIds();
		
		$scope.schools = [];
		if(model.me.structures.length > 1) {
			$scope.schools.push({id: $scope.getAllSchoolIds(), name: lang.translate('statistics.all.my.schools')});
		}
		for (var i=0; i < model.me.structures.length; i++) {
			$scope.schools.push({id: model.me.structures[i], name: model.me.structureNames[i]});
		}

		$scope.indicators = [];
		$scope.modules = [];
		model.getMetadata(function(result){
			if (result && result.indicators && result.modules) {
				$scope.indicators = result.indicators;
				$scope.modules = formatModules(result.modules);
			}
		});
		
		$scope.dates = getDates();
		
		template.open('main', 'form');
	};
	
	// Init dates used in form
	function getDates() {
		var maxDate = moment().startOf('month'); // 1st day of current month
		
		// Set minDate to september 1st of current school year
		var year = moment().year();
		var september = 8;
		if(moment().month() < september) {
			year = year - 1;
		}
		var minDate = moment().year(year).month(september).startOf('month');

		var dates = [];
		dates.push(getDateObjectForNgOptions(minDate.clone()));
		while(minDate.isBefore(maxDate)) {
			var date = minDate.add(1, 'months').clone();
			dates.push(getDateObjectForNgOptions(date));
		}
		
		// Add yesterday
		var yesterday = moment().startOf('day').add(-1, 'days');
		if(yesterday.isAfter(maxDate)) {
			dates.push({
				label: "Hier", // TODO
				moment: yesterday
			});
		}
		
		return dates;
	}
	
	// Return a date object, formatted for ng-options
	function getDateObjectForNgOptions(moment) {
		return {
			label: formatMoment(moment),
			moment: moment
		};
	}
	
	function formatMoment(moment) {
		return moment.lang('fr').format('MMMM YYYY');
	}
	
	$scope.translate = function(label) {
		return lang.translate(label);
	};
	
	// Get data and display chart
	$scope.getData = function() {
		$scope.form.processing = true;

		if($scope.form.from.isAfter($scope.form.to) || $scope.form.from.isSame($scope.form.to)) {
			notify.error('statistics.invalid.dates');
			$scope.form.processing = false;
			return;
		}
		
		
		var schoolIdArray = $scope.form.school_id.split(",");
		
		var query = http().serialize({ schoolId: schoolIdArray}) +
			"&indicator=" + $scope.form.indicator +
		  "&startDate=" +  $scope.form.from.unix() +
			"&endDate=" + $scope.form.to.unix();
		if($scope.form.module!==undefined && $scope.form.module!==null) {
			query += '&module=' + $scope.form.module;
		}
		
		$scope.chart = {};
		
		template.open('chart', 'chart');
		model.getData(query, function(data) {
			$scope.chart.data = formatData(data);
			$scope.form.processing = false;
			$scope.chart.title = getChartTitle($scope.form.indicator, schoolIdArray, $scope.form.module);
			$scope.$apply();
		});
	};

	// Format raw data for d3.js
	function formatData(inputData) {
		var dates = _.chain(inputData).pluck("date").sort().uniq().value();
		var profiles = _.chain(inputData).pluck("profil_id").sort().uniq().value();
		var outputData = [];

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
			return '/'+ moduleName.toLowerCase() === app.prefix;
		});
		var label = (app !== undefined) ? lang.translate(app.displayName) : moduleName;
		return label;
	}
	
	function getChartTitle(indicator, schoolIdArray, module) {
		var indicatorName = lang.translate(indicator).toLowerCase();
		var title;
		if(indicator === 'ACCESS' && module) {
			title = lang.translate('statistics.number.of.to.module')
						.replace(/\{0\}/g, indicatorName)
						.replace(/\{1\}/g, getApplicationName(module));
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
		var index = model.me.structures.indexOf(schoolId);
		var schoolName;
		if(index >= 0) {
			schoolName = model.me.structureNames[index];
		}
		return schoolName;
	}
	
	// Return a string like "schoolId1,schoolId2,...,schoolIdn"
	$scope.getAllSchoolIds = function() {
		return model.me.structures.toString();
	};
	
	// TODO : get colors from theme.css	
    var colorsMatch = {
        relative: '#4bafd5',
        teacher: '#46bfaf',
        student: '#ff8500',
        personnel: '#763294',
        guest: '#db6087',
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
}