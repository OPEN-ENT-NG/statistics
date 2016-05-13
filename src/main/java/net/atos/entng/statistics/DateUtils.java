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

package net.atos.entng.statistics;

import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import fr.wseduc.mongodb.MongoDb;

public class DateUtils {

	public static Date getFirstDayOfMonth(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		return getFirstDay(cal);
	}

	public static Date getFirstDayOfLastMonth(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		cal.add(Calendar.MONTH, -1);
		return getFirstDay(cal);
	}

	private static Date getFirstDay(Calendar cal) {
		cal.set(Calendar.DAY_OF_MONTH, 1);
		return cal.getTime();
	}

	public static String formatTimestamp(long unixTimestamp) {
		Date date = new Date();
		date.setTime(unixTimestamp);
		return MongoDb.formatDate(date);
	}

	/**
	 * @param date : string representing a unix timestamp (seconds since standard epoch of 1/1/1970)
	 * @return milliseconds since standard epoch of 1/1/1970
	 */
	public static Long parseStringDate(String date) {
		long seconds = Long.parseLong(date);
		return 	TimeUnit.MILLISECONDS.convert(seconds, TimeUnit.SECONDS);
	}
}
