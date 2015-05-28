function StatisticsController($scope, template, model, route, $location, orderByFilter) {

	this.initialize = function() {
		$scope.template = template;
		
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
		
		template.open('main', 'form');
	};

	$scope.getData = function() {
		$scope.form.processing = true;
		
		// temporary code. TODO : get dates from form
		$scope.form.start_date = 1327846400000;
		$scope.form.end_date = 2000438400000;
		
		var query = 'schoolId=' + $scope.form.school_id +
			"&indicator=" + $scope.form.indicator +
		  "&startDate=" + $scope.form.start_date +
			"&endDate=" + $scope.form.end_date;
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

				outputData[i][j] = {
					x : j,
					date : dates[j],
					profile : profiles[i],
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