/*
 * Copyright © Région Nord Pas de Calais-Picardie, 2016.
 *
 * This file is part of OPEN ENT NG. OPEN ENT NG is a versatile ENT Project based on the JVM and ENT Core Project.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation (version 3 of the License).
 *
 * For the sake of explanation, any module that communicate over native
 * Web protocols, such as HTTP, with OPEN ENT NG is outside the scope of this
 * license and could be license under its own terms. This is merely considered
 * normal use of OPEN ENT NG, and does not fall under the heading of "covered work".
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

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

		// Unique visitors
		aggProcessing.addIndicator(IndicatorFactory.getUniqueVisitorsIndicator(filters, writeDate));

		// Accounts and activated accounts
		aggProcessing.addIndicator(IndicatorFactory.getActivatedAccountsIndicator(writeDate));
	}
}
