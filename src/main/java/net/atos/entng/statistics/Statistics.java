package net.atos.entng.statistics;

import java.text.ParseException;
import java.util.Calendar;
import java.util.Date;

import net.atos.entng.statistics.aggregation.AggregateTask;
import net.atos.entng.statistics.controllers.StatisticsController;
import net.atos.entng.statistics.converter.Converter;

import org.entcore.common.aggregation.MongoConstants;
import org.entcore.common.http.BaseServer;
import org.entcore.common.mongodb.MongoDbConf;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.cron.CronTrigger;

public class Statistics extends BaseServer {

	@Override
	public void start() {
		super.start();

		JsonArray accessModules = container.config().getArray("access-modules", null);
		if(accessModules==null || accessModules.size()==0) {
			log.error("Parameter access-modules is null or empty");
			return;
		}

		// 1) Schedule daily aggregation
		/* By default, fire aggregate-cron at 1:15am every day.
		 * Be careful when setting fire times between midnight and 1:00 AM
		 * - "daylight savings" can cause a skip or a repeat depending on whether the time moves back or jumps forward.
		 */
		final String aggregateEventsCron = container.config().getString("aggregate-cron", "0 15 1 ? * * *");

		AggregateTask aggTask = new AggregateTask();
		try {
			new CronTrigger(vertx, aggregateEventsCron).schedule(aggTask);
		} catch (ParseException e) {
			log.fatal(e.getMessage(), e);
			return;
		}

		// In development environment, launch aggregations if parameter "aggregateOnStart" is set to true in module configuration
		if("dev".equals(container.config().getString("mode", null))
				&& container.config().getBoolean("aggregateOnStart", false)) {

            Date startDate = new Date();
            startDate.setTime(1430352000000L); // Thu, 30 Apr 2015 00:00:00 GMT

            Date endDate = new Date();
            endDate.setTime(1430438400000L); // Fri, 01 May 2015 00:00:00 GMT

			this.aggregateEvents(startDate, endDate);
		}


		// 2) Deploy worker verticle, used to convert from JSON to CSV
		int nbConverters = container.config().getNumber("nbConverters", 1).intValue();
		if(nbConverters < 1) {
			log.warn("nbConverters must be >= 1. Deploying 1 converter...");
			nbConverters = 1;
		}
		container.deployWorkerVerticle(Converter.class.getName(), nbConverters);

		// 3) Init controller
		 addController(new StatisticsController(MongoConstants.COLLECTIONS.stats.toString(), accessModules));
		 MongoDbConf.getInstance().setCollection(MongoConstants.COLLECTIONS.stats.toString());
	}


	// Aggregate documents of collection "events" for each day, from startDate to endDate
	private void aggregateEvents(final Date startDate, final Date endDate) {
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
									AggregateTask aggTask = new AggregateTask(fromCal.getTime(), toCal.getTime(), null, this);
									aggTask.handle(0L);
								}
							}
						} catch (Exception e) {
							log.error("Error in AggregateTask when checking status", e);
						}
					}
				};

				AggregateTask aggTask = new AggregateTask(fromCal.getTime(), toCal.getTime(), null, handler);
				aggTask.handle(event);
			}
		});
	}


}
