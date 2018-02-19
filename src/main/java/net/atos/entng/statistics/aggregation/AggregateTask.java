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

import net.atos.entng.statistics.aggregation.indicators.IndicatorHelper;

import org.entcore.common.aggregation.processing.AggregationProcessing;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;


public class AggregateTask implements Handler<Long> {

	private static final Logger log = LoggerFactory.getLogger(AggregateTask.class);
	private Date from, to;
	private Handler<JsonObject> handler;

	public AggregateTask() {
	}

	public AggregateTask(Date pFrom, Date pTo, Handler<JsonObject> pHandler) {
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

		aggProcessing.process(handler);
	}

}
