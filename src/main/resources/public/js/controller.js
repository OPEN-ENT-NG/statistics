function StatisticsController($scope, template, model) {

	this.initialize = function() {
		$scope.template = template;

		// Init variables used in template form.html
		$scope.form = {};
		
		$scope.schools = [];
		for (var i=0; i < model.me.structures.length; i++) {
			$scope.schools.push({id: model.me.structures[i], name: model.me.structureNames[i]});
		}

		$scope.indicators = [];
		$scope.modules = [];
		model.getMetadata(function(result){
			if (result && result.indicators && result.modules) {
				$scope.indicators = result.indicators;
				$scope.modules = result.modules;
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
		dates.push(minDate.clone());
		while(minDate.isBefore(maxDate)) {
			var date = minDate.add(1, 'months').clone();
			dates.push(date);
		}
		
		// Add today
		var today = moment().startOf('day');
		if(today.isAfter(maxDate)) {
			dates.push(today);
		}
		
		return dates;
	}
	
	$scope.formatMoment = function(moment) {
		return moment.format('DD/MM/YYYY');
	};
	
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
		
		var query = 'schoolId=' + $scope.form.school_id +
			"&indicator=" + $scope.form.indicator +
		  "&startDate=" +  $scope.form.from.unix() +
			"&endDate=" + $scope.form.to.unix();
		if($scope.form.module!==undefined && $scope.form.module!==null) {
			query += '&module=' + $scope.form.module;
		}
		
		$scope.chart = {};
		$scope.chart.indicator = $scope.form.indicator;
		
		template.open('chart', 'chart');
		model.getData(query, function(data) {
			$scope.chart.data = formatData(data);
			$scope.form.processing = false;
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
				var y0value = 0;
				if(i>0) {
					y0value = outputData[i-1][j].y + outputData[i-1][j].y0;
				}

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
					y0 : y0value
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
	
	this.initialize();
}