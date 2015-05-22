package net.atos.entng.statistics.aggregation.indicators;

import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;

import net.atos.entng.statistics.DateUtils;

import org.entcore.common.aggregation.AggregationTools;
import org.entcore.common.aggregation.filters.mongo.DateFilter;
import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.processing.AggregationProcessing;


public class IndicatorHelper {

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

		Date writeDate = DateUtils.getFirstDayOfMonth(from);

		// UserAccount Activation
		aggProcessing.addIndicator(IndicatorFactory.getActivationIndicator(filters, writeDate));

		// Connections
		aggProcessing.addIndicator(IndicatorFactory.getConnectionIndicator(filters, writeDate));

		// Access to applications
		aggProcessing.addIndicator(IndicatorFactory.getAccessIndicator(filters, writeDate));


		// DateFilter to keep all events of current month
		filters = new ArrayList<>();
		from = DateUtils.getFirstDayOfMonth(to);
		if(from.equals(to)) {
			from = DateUtils.getFirstDayOfLastMonth(to);
		}
		filters.add(new DateFilter(from, to));

		writeDate = DateUtils.getTheDayBefore(to);

		// Unique visitors
		aggProcessing.addIndicator(IndicatorFactory.getUniqueVisitorsIndicator(filters, writeDate));
	}
}
