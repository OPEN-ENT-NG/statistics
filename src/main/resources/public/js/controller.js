function StatisticsController($scope, template, model, route, $location, orderByFilter) {

//	this.initialize = function() {
//	}
//	this.initialize();


	// POC
	var inputData = [
	     {
	    	 "date" : "2015-02-01 01:00.00.000",
	    	 "profil_id" : "Teacher",
	    	 "ACTIVATION" : 159
	     },
	     {
	    	 "date" : "2015-02-01 01:00.00.000",
	    	 "profil_id" : "Student",
	    	 "ACTIVATION" : 100
	     },
	     {
	    	 "date" : "2015-03-01 01:00.00.000",
	    	 "profil_id" : "Student",
	    	 "ACTIVATION" : 100
	     },
	     {
	    	 "date" : "2015-03-01 01:00.00.000",
	    	 "profil_id" : "Relative",
	    	 "ACTIVATION" : 36
	     },
	     {
	    	 "date" : "2015-04-01 01:00.00.000",
	    	 "profil_id" : "Teacher",
	    	 "ACTIVATION" : 10
	     },
	     {
	    	 "date" : "2015-04-01 01:00.00.000",
	    	 "profil_id" : "Relative",
	    	 "ACTIVATION" : 14
	     }
    ];

	var dates = _.chain(inputData).pluck("date").sort().uniq().value();
	var profiles = _.chain(inputData).pluck("profil_id").sort().uniq().value();
	var indicator = "ACTIVATION";
	var outputData = [];

	// Init outputData with default values, because data might not exists for the specified profile and date
	for(var i=0; i < profiles.length; i++) {
		outputData[i] = [];
		for(var j=0; j < dates.length; j++) {
			outputData[i].push({
				x : j,
				y : 0,
				date : dates[j],
				profile : profiles[i],
				y0 : 0
			});
		}   	 
	}

	for(var i=0; i < profiles.length; i++) {
		for(var j=0; j < dates.length; j++) {
			var data = _.chain(inputData).where({"profil_id":profiles[i], "date":dates[j]}).value();
			var y0value = 0;
			if(i>0) {
				y0value = outputData[i-1][j].y + outputData[i-1][j].y0;
			}

			if(data && data.length > 0) {
				var output = {
					x : j,
					y : data[0][indicator],
					date : data[0].date,
					profile : data[0].profil_id,
					y0 : y0value
				};
				outputData[i][j] = output;
			}
			else {
				outputData[i][j].y0 = y0value; 
			}
		}
	}

	$scope.data = outputData;
}