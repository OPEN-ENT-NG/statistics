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
