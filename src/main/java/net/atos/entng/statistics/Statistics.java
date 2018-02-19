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

import java.text.ParseException;
import java.util.Calendar;
import java.util.Date;

import net.atos.entng.statistics.aggregation.AggregateTask;
import net.atos.entng.statistics.controllers.StatisticsController;

import org.entcore.common.aggregation.MongoConstants;
import org.entcore.common.http.BaseServer;
import org.entcore.common.mongodb.MongoDbConf;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import fr.wseduc.cron.CronTrigger;

public class Statistics extends BaseServer {

	@Override
	public void start() throws Exception {
		super.start();

		JsonArray accessModules = config.getJsonArray("access-modules", null);
		if(accessModules==null || accessModules.size()==0) {
			log.error("Parameter access-modules is null or empty");
			return;
		}

		// 1) Schedule daily aggregation
		/* By default, fire aggregate-cron at 1:15am every day.
		 * Be careful when setting fire times between midnight and 1:00 AM
		 * - "daylight savings" can cause a skip or a repeat depending on whether the time moves back or jumps forward.
		 */
		final String aggregateEventsCron = config.getString("aggregate-cron", "0 15 1 ? * * *");

		AggregateTask aggTask = new AggregateTask();
		try {
			new CronTrigger(vertx, aggregateEventsCron).schedule(aggTask);
		} catch (ParseException e) {
			log.fatal(e.getMessage(), e);
			return;
		}

		// In development environment, launch aggregations if parameter "aggregateOnStart" is set to true in module configuration
		if("dev".equals(config.getString("mode", null))
				&& config.getBoolean("aggregateOnStart", false)) {

            Date startDate = new Date();
            startDate.setTime(1430352000000L); // Thu, 30 Apr 2015 00:00:00 GMT

            Date endDate = new Date();
            endDate.setTime(1430438400000L); // Fri, 01 May 2015 00:00:00 GMT

			this.aggregateEvents(vertx, startDate, endDate);
		}


		// 2) Init controller
		 addController(new StatisticsController(vertx, MongoConstants.COLLECTIONS.stats.toString(), accessModules));
		 MongoDbConf.getInstance().setCollection(MongoConstants.COLLECTIONS.stats.toString());

        // FIXME : the statistics will be kept one year to antoher. No repositoryEvents management
    }


	// Aggregate documents of collection "events" for each day, from startDate to endDate
	public void aggregateEvents(Vertx vertx, final Date startDate, final Date endDate) {
		final Calendar fromCal = Calendar.getInstance();
		fromCal.setTime(startDate);

		final Calendar toCal = (Calendar) fromCal.clone();
		toCal.add(Calendar.DAY_OF_MONTH, 1);

		// Launch aggregations sequentially, one after the other
		vertx.setTimer(1000L, new Handler<Long>() {
			@Override
			public void handle(final Long event) {
				Handler<JsonObject> handler = new Handler<JsonObject>() {
					@Override
					public void handle(JsonObject aggregateEvent) {
						try {
							if (!"ok".equals(aggregateEvent.getString("status", null))) {
								log.error("Error in AggregateTask : status is different from ok." + aggregateEvent.toString());
							}
							else {
								// Increment dates
								fromCal.add(Calendar.DAY_OF_MONTH, 1);
								toCal.add(Calendar.DAY_OF_MONTH, 1);

								if(fromCal.getTime().before(endDate)) {
									AggregateTask aggTask = new AggregateTask(fromCal.getTime(), toCal.getTime(), this);
									aggTask.handle(0L);
								}
							}
						} catch (Exception e) {
							log.error("Error in AggregateTask when checking status", e);
						}
					}
				};

				AggregateTask aggTask = new AggregateTask(fromCal.getTime(), toCal.getTime(), handler);
				aggTask.handle(event);
			}
		});
	}


}
