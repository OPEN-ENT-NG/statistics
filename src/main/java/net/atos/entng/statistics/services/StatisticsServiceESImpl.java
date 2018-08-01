package net.atos.entng.statistics.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.elasticsearch.ElasticSearch;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static fr.wseduc.webutils.Utils.isNotEmpty;
import static net.atos.entng.statistics.aggregation.indicators.IndicatorConstants.STATS_FIELD_ACTIVATED_ACCOUNTS;
import static net.atos.entng.statistics.aggregation.indicators.IndicatorConstants.STATS_FIELD_UNIQUE_VISITORS;
import static net.atos.entng.statistics.controllers.StatisticsController.*;
import static org.entcore.common.aggregation.MongoConstants.*;

public class StatisticsServiceESImpl implements StatisticsService {

	private static final Logger log = LoggerFactory.getLogger(StatisticsServiceESImpl.class);
	private final ElasticSearch es = ElasticSearch.getInstance();

	@Override
	public void getStats(List<String> schoolIds, JsonObject params, Handler<Either<String, JsonArray>> handler) {
		if(schoolIds == null || schoolIds.isEmpty()) {
			handler.handle(new Either.Left<>("schoolIds is null or empty"));
			return;
		}

		final String indicator = params.getString(PARAM_INDICATOR);
		final Long start = params.getLong(PARAM_START_DATE);
		final Long end = params.getLong(PARAM_END_DATE);

		final JsonObject range = new JsonObject()
				.put("range", new JsonObject()
						.put("date", new JsonObject()
								.put("gte", start).put("lt", end)));
		final JsonObject structures = new JsonObject();
		if (schoolIds.size() == 1) {
			structures.put("term", new JsonObject().put("structures", schoolIds.get(0)));
		} else {
			structures.put("terms", new JsonObject().put("structures", new JsonArray(schoolIds)));
		}

		final JsonArray filter = new JsonArray();
		final JsonObject perMonth = new JsonObject()
				.put("date_histogram", new JsonObject().put("field", TRACE_FIELD_DATE).put("interval", "month"));

		JsonObject groupBy = new JsonObject();
		AtomicBoolean groupByModule = new AtomicBoolean(false);

		switch (indicator) {
			case TRACE_TYPE_SVC_ACCESS:
				final String module = params.getString(PARAM_MODULE);
				if (isNotEmpty(module)) {
					filter.add(new JsonObject().put("term", new JsonObject().put(PARAM_MODULE, module)));
				} else {
					perMonth.clear();
					perMonth.put("terms", new JsonObject().put("field", "module"));
					groupByModule.set(true);
				}
			case TRACE_TYPE_CONNEXION:
			case TRACE_TYPE_ACTIVATION:
				filter.add(new JsonObject().put("term", new JsonObject().put("event-type", indicator)));
				perMonth.put("aggs", new JsonObject().put("group_by", groupBy
						.put("terms", new JsonObject().put("field", TRACE_FIELD_PROFILE))));
				break;
			case STATS_FIELD_UNIQUE_VISITORS:
				filter.add(new JsonObject().put("term", new JsonObject().put("event-type", TRACE_TYPE_CONNEXION)));
				perMonth.put("aggs", new JsonObject().put("group_by", groupBy
						.put("terms", new JsonObject().put("field", TRACE_FIELD_PROFILE))
						.put("aggs", new JsonObject()
								.put("unique_count", new JsonObject().put("cardinality", new JsonObject()
										.put("field", TRACE_FIELD_USER)
										.put("precision_threshold", 5000)
						)))
				));
				break;
			case STATS_FIELD_ACTIVATED_ACCOUNTS:

				break;
			default:
				handler.handle(new Either.Left<>("invalid.indicator"));
				return;
		}
		filter.add(structures).add(range);
		JsonObject search = new JsonObject()
				.put("size", 0)
				.put("query", new JsonObject().put("bool", new JsonObject().put("filter", filter)))
				.put("aggs", new JsonObject().put("per_month", perMonth));

		es.search("events", search, ar -> {
			if (ar.succeeded()) {
				try {
					handler.handle(new Either.Right<>(format(ar.result(), indicator, groupByModule.get())));
				} catch (Exception e) {
					log.error("Error formatting aggregation result.", e);
					handler.handle(new Either.Left<>(e.getMessage()));
				}
			} else {
				log.error("Error in aggregation.", ar.cause());
				handler.handle(new Either.Left<>(ar.cause().getMessage()));
			}
		});

	}

	private JsonArray format(JsonObject result, String indicator, boolean groupByMobule) {
		final DateFormat df = new SimpleDateFormat("yyyy-MM-dd 00:00.00.000");
		final JsonArray months = result.getJsonObject("aggregations")
				.getJsonObject("per_month").getJsonArray("buckets");
		final JsonArray results = new JsonArray();
		for (Object o: months) {
			final JsonObject j = (JsonObject) o;
			final String dateMonth;
			if (groupByMobule) {
				dateMonth = j.getString("key");
			} else {
				dateMonth = df.format(new Date(j.getLong("key")));
			}
			final JsonArray buckets = j.getJsonObject("group_by").getJsonArray("buckets");
			for (Object o2: buckets) {
				final JsonObject j2 = (JsonObject) o2;
				final String profile = j2.getString("key");
				final int count;
				if (STATS_FIELD_UNIQUE_VISITORS.equals(indicator)) {
					count = j2.getJsonObject("unique_count").getInteger("value");
				} else {
					count = j2.getInteger("doc_count");
				}
				results.add(new JsonObject()
						.put(groupByMobule ? "module_id" : "date", dateMonth)
						.put("profil_id", profile)
						.put(indicator, count)
				);
			}
		}
		return results;
	}

	@Override
	public void getStatsForExport(List<String> schoolIds, JsonObject params, Handler<Either<String, JsonArray>> handler) {
		getStats(schoolIds, params, handler);
	}

}
