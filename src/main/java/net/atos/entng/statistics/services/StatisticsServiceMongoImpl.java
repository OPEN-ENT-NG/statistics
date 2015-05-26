package net.atos.entng.statistics.services;

import static net.atos.entng.statistics.DateUtils.formatTimestamp;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;
import static org.entcore.common.aggregation.MongoConstants.STATS_FIELD_DATE;
import static org.entcore.common.aggregation.MongoConstants.STATS_FIELD_GROUPBY;

import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.Handler;
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
	public void getStats(final JsonObject params, final Handler<Either<String, JsonArray>> handler) {
		String indicator = params.getString("indicator");
		Long start = (Long) params.getNumber("startDate");
		Long end = (Long) params.getNumber("endDate");

		String groupedBy = TRACE_TYPE_SVC_ACCESS.equals(indicator) ? "module/structures/profil" : "structures/profil";

		QueryBuilder query = QueryBuilder.start(STATS_FIELD_GROUPBY).is(groupedBy)
				.and(STATS_FIELD_DATE).greaterThanEquals(formatTimestamp(start)).lessThan(formatTimestamp(end))
				.and("structures_id").is(params.getString("schoolId"))
				.and(indicator).exists(true);

		JsonObject projection = new JsonObject();
		projection.putNumber("_id", 0)
			.putNumber(indicator, 1)
			.putNumber("profil_id", 1)
			.putNumber("date", 1);

		mongo.find(collection, MongoQueryBuilder.build(query), null, projection, MongoDbResult.validResultsHandler(handler));
	}


}
