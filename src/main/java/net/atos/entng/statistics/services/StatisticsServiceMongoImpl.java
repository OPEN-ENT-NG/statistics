package net.atos.entng.statistics.services;

import static net.atos.entng.statistics.DateUtils.formatTimestamp;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;
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

	public StatisticsServiceMongoImpl(String collection) {
		super(collection);
		this.collection = collection;
		this.mongo = MongoDb.getInstance();
	}

	@Override
	public void getStats(final List<String> schoolIds, final JsonObject params, final Handler<Either<String, JsonArray>> handler) {
		if(schoolIds==null || schoolIds.isEmpty()) {
			throw new IllegalArgumentException("schoolIds is null or empty");
		}

		String indicator = params.getString("indicator");
		Long start = (Long) params.getNumber("startDate");
		Long end = (Long) params.getNumber("endDate");

		boolean isAccessIndicator = TRACE_TYPE_SVC_ACCESS.equals(indicator);
		String groupedBy = isAccessIndicator ? "module/structures/profil" : "structures/profil";

		final QueryBuilder criteriaQuery = QueryBuilder.start(STATS_FIELD_GROUPBY).is(groupedBy)
				.and(STATS_FIELD_DATE).greaterThanEquals(formatTimestamp(start)).lessThan(formatTimestamp(end))
				.and(indicator).exists(true);
		if(isAccessIndicator) {
			criteriaQuery.and("module_id").is(params.getString("module"));
		}

		if(schoolIds.size() == 1) {
			criteriaQuery.and("structures_id").is(schoolIds.get(0));

			JsonObject projection = new JsonObject();
			projection.putNumber("_id", 0)
				.putNumber(indicator, 1)
				.putNumber("profil_id", 1)
				.putNumber("date", 1);

			mongo.find(collection, MongoQueryBuilder.build(criteriaQuery), null, projection, MongoDbResult.validResultsHandler(handler));
		}
		else {
			// When several school ids are supplied, sum stats for all schools
			final JsonObject aggregation = new JsonObject();
			JsonArray pipeline = new JsonArray();
			aggregation
				.putString("aggregate", collection)
				.putBoolean("allowDiskUse", true)
				.putArray("pipeline", pipeline);

			criteriaQuery.and("structures_id").in(schoolIds);
			pipeline.addObject(new JsonObject().putObject("$match", MongoQueryBuilder.build(criteriaQuery)));

			JsonObject groupBy = new JsonObject().putObject("$group", new JsonObject()
				.putObject("_id", new JsonObject().putString("date", "$date").putString("profil_id", "$profil_id"))
				.putObject(indicator, new JsonObject().putString("$sum", "$"+indicator)));
			pipeline.addObject(groupBy);

			QueryBuilder projection = QueryBuilder.start("_id").is(0)
					.and(STATS_FIELD_DATE).is("$_id.date")
					.and("profil_id").is("$_id.profil_id")
					.and(indicator).is(1);
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
