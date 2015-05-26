package net.atos.entng.statistics.aggregation;

import java.util.Date;

import net.atos.entng.statistics.aggregation.indicators.IndicatorHelper;

import org.entcore.common.aggregation.processing.AggregationProcessing;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;


public class AggregateTask implements Handler<Long> {

	private static final Logger log = LoggerFactory.getLogger(AggregateTask.class);
	private Date writeDate, from, to;
	private Handler<JsonObject> handler;

	public AggregateTask() {
	}

	public AggregateTask(Date pFrom, Date pTo, Date pWriteDate, Handler<JsonObject> pHandler) {
		writeDate = pWriteDate;
		from = pFrom;
		to = pTo;
		handler = pHandler;
	}

	@Override
	public void handle(Long event) {
		log.info("Execute AggregateTask.");

		AggregationProcessing aggProcessing = new AggregationProcessingSequentialImpl();
		IndicatorHelper.addIndicators(from, to, aggProcessing);

		Handler<JsonObject> handler = (this.handler!=null) ? this.handler : new Handler<JsonObject>() {
			@Override
			public void handle(JsonObject event) {
				try {
					if (!"ok".equals(event.getString("status", null))) {
						log.error("Error in AggregateTask : status is different from ok." + event.toString());
					}
				} catch (Exception e) {
					log.error("Error in AggregateTask when checking status", e);
				}
			}
		};

		aggProcessing.process(writeDate, handler);
	}

}
