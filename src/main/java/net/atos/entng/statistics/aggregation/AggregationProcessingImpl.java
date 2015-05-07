package net.atos.entng.statistics.aggregation;

import java.util.Date;

import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.processing.AggregationProcessing;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

public class AggregationProcessingImpl extends AggregationProcessing {

	private static final Logger log = LoggerFactory.getLogger(AggregationProcessingImpl.class);

	@Override
	public void process(Handler<JsonObject> callBack) {
		this.processAgg(null, callBack);
	}

	@Override
	public void process(Date marker, Handler<JsonObject> callBack) {
		this.processAgg(marker, callBack);
	}

	private void processAgg(Date writeDate, Handler<JsonObject> callBack) {
		if(indicators != null && !indicators.isEmpty()) {
			Object[] indicatorArray = indicators.toArray();

			for (int i = 0; i < indicators.size(); i++) {
				Indicator indicator = (Indicator) indicatorArray[i];
				if(writeDate != null) {
					indicator.setWriteDate(writeDate);
				}
				indicator.aggregate(callBack);
			}
		}
		else {
			log.warn("indicators is empty. Nothing was processed");
		}
	}

}
