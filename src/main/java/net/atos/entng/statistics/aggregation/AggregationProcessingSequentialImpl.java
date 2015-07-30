package net.atos.entng.statistics.aggregation;

import java.util.Date;
import java.util.Iterator;

import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.processing.AggregationProcessing;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

public class AggregationProcessingSequentialImpl extends AggregationProcessing {

	private static final Logger log = LoggerFactory.getLogger(AggregationProcessingSequentialImpl.class);

	@Override
	public void process(final Handler<JsonObject> callBack) {
		if(indicators == null && indicators.isEmpty()) {
			log.warn("indicators is empty. Nothing was processed");
			return;
		}

		final Iterator<Indicator> it = indicators.iterator();
		Indicator indicator = it.next();

		// Agregate indicators one after the other
		indicator.aggregate(new Handler<JsonObject>() {
			@Override
			public void handle(JsonObject event) {
				if(it.hasNext()) {
					it.next().aggregate(this);
				}
				else {
					callBack.handle(event);
				}
			}
		});
	}

	@Override
	public void process(Date marker, Handler<JsonObject> callBack) {
		throw new UnsupportedOperationException();
	}

}
