package net.atos.entng.statistics.aggregation.indicators;

import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;

import org.entcore.common.aggregation.AggregationTools;
import org.entcore.common.aggregation.filters.mongo.DateFilter;
import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.processing.AggregationProcessing;


public class IndicatorHelper {

	public static void addIndicators(AggregationProcessing aggProcessing) {
		addIndicators(null, null, aggProcessing);
	}


	public static void addIndicators(Date from, Date to, AggregationProcessing aggProcessing) {
		if(aggProcessing == null) {
			throw new InvalidParameterException("Parameter aggProcessing is null");
		}

		Collection<IndicatorFilterMongoImpl> filters = new ArrayList<>();

		// DateFilter : keep events of yesterday if parameters "from" and "to" are not supplied
		Calendar cal = Calendar.getInstance();
		if (to == null) {
			to = AggregationTools.setToMidnight(cal);
		}
		if (from == null) {
			cal.add(Calendar.DAY_OF_MONTH, -1);
			from = AggregationTools.setToMidnight(cal);
		}
		filters.add(new DateFilter(from, to));


		// UserAccount Activation
		aggProcessing.addIndicator(IndicatorFactory.getActivationIndicator(filters));

		// Connections and unique visitors
		aggProcessing.addIndicator(IndicatorFactory.getConnectionIndicator(filters));

		// Access to applications
		aggProcessing.addIndicator(IndicatorFactory.getAccessIndicator(filters));
	}
}
