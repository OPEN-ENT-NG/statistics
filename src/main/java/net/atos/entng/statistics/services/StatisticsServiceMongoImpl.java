package net.atos.entng.statistics.services;

import static net.atos.entng.statistics.DateUtils.formatTimestamp;
import static net.atos.entng.statistics.controllers.StatisticsController.*;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_MODULE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_PROFILE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_STRUCTURES;
import static org.entcore.common.aggregation.MongoConstants.STATS_FIELD_DATE;
import static org.entcore.common.aggregation.MongoConstants.STATS_FIELD_GROUPBY;

import java.util.List;

import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import com.mongodb.QueryBuilder;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.Either;

public class StatisticsServiceMongoImpl extends MongoDbCrudService implements StatisticsService {

	private final String collection;
	private final MongoDb mongo;

	public static final String MODULE_ID = TRACE_FIELD_MODULE + "_id";
	public static final String PROFILE_ID = TRACE_FIELD_PROFILE + "_id";
	public static final String STRUCTURES_ID = TRACE_FIELD_STRUCTURES + "_id";

	private static final JsonObject sortJsonObject = new JsonObject().putNumber(STATS_FIELD_DATE, 1).putNumber(PROFILE_ID, 1);

	public StatisticsServiceMongoImpl(String collection) {
		super(collection);
		this.collection = collection;
		this.mongo = MongoDb.getInstance();
	}

	@Override
	public void getStats(final List<String> schoolIds, final JsonObject params, final Handler<Either<String, JsonArray>> handler) {
		this.getStatistics(schoolIds, params, handler, false);
	}

	@Override
	public void getStatsForExport(final List<String> schoolIds, final JsonObject params, final Handler<Either<String, JsonArray>> handler) {
		this.getStatistics(schoolIds, params, handler, true);
	}


	private void getStatistics(final List<String> schoolIds, final JsonObject params, final Handler<Either<String, JsonArray>> handler, boolean isExport) {
		if(schoolIds==null || schoolIds.isEmpty()) {
			throw new IllegalArgumentException("schoolIds is null or empty");
		}

		String indicator = params.getString(PARAM_INDICATOR);
		Long start = (Long) params.getNumber(PARAM_START_DATE);
		Long end = (Long) params.getNumber(PARAM_END_DATE);

		boolean isAccessIndicator = TRACE_TYPE_SVC_ACCESS.equals(indicator);
		String groupedBy = isAccessIndicator ? "module/structures/profil" : "structures/profil";

		final QueryBuilder criteriaQuery = QueryBuilder.start(STATS_FIELD_GROUPBY).is(groupedBy)
				.and(STATS_FIELD_DATE).greaterThanEquals(formatTimestamp(start)).lessThan(formatTimestamp(end))
				.and(indicator).exists(true);
		if(isAccessIndicator) {
			criteriaQuery.and(MODULE_ID).is(params.getString(PARAM_MODULE));
		}

		if(schoolIds.size() == 1) {
			criteriaQuery.and(STRUCTURES_ID).is(schoolIds.get(0));

			JsonObject projection = new JsonObject();
			projection.putNumber("_id", 0)
				.putNumber(indicator, 1)
				.putNumber(PROFILE_ID, 1)
				.putNumber(STATS_FIELD_DATE, 1);

			JsonObject sort = isExport ? sortJsonObject : null;

			mongo.find(collection, MongoQueryBuilder.build(criteriaQuery), sort, projection, MongoDbResult.validResultsHandler(handler));
		}
		else {
			// When several school ids are supplied, sum stats for all schools
			final JsonObject aggregation = new JsonObject();
			JsonArray pipeline = new JsonArray();
			aggregation
				.putString("aggregate", collection)
				.putBoolean("allowDiskUse", true)
				.putArray("pipeline", pipeline);

			criteriaQuery.and(STRUCTURES_ID).in(schoolIds);
			pipeline.addObject(new JsonObject().putObject("$match", MongoQueryBuilder.build(criteriaQuery)));

			JsonObject id = new JsonObject().putString(STATS_FIELD_DATE, "$"+STATS_FIELD_DATE).putString(PROFILE_ID, "$"+PROFILE_ID);
			JsonObject groupBy = new JsonObject().putObject("$group", new JsonObject()
				.putObject("_id", id)
				.putObject(indicator, new JsonObject().putString("$sum", "$"+indicator)));
			pipeline.addObject(groupBy);

			QueryBuilder projection = QueryBuilder.start("_id").is(0)
					.and(STATS_FIELD_DATE).is("$_id."+STATS_FIELD_DATE)
					.and(PROFILE_ID).is("$_id."+PROFILE_ID)
					.and(indicator).is(1);

			if(isExport) {
				// Export stats for each structure_id
				id.putString(STRUCTURES_ID, "$"+STRUCTURES_ID);
				projection.and(STRUCTURES_ID).is("$_id."+STRUCTURES_ID);
				pipeline.addObject(new JsonObject().putObject("$sort", sortJsonObject));
			}
			pipeline.addObject(new JsonObject().putObject("$project", MongoQueryBuilder.build(projection)));

			mongo.command(aggregation.toString(), new Handler<Message<JsonObject>>() {
				@Override
				public void handle(Message<JsonObject> message) {
					if ("ok".equals(message.body().getString("status")) && message.body().getObject("result", new JsonObject()).getInteger("ok") == 1){
						JsonArray result = message.body().getObject("result").getArray("result");
						handler.handle(new Either.Right<String, JsonArray>(result));
					} else {
						String error = message.body().toString();
						handler.handle(new Either.Left<String, JsonArray>(error));
					}
				}
			});
		}
	}

}
