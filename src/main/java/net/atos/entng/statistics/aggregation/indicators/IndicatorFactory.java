package net.atos.entng.statistics.aggregation.indicators;

import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_MODULE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_PROFILE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_STRUCTURES;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_USER;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_ACTIVATION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_CONNEXION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class IndicatorFactory {

	public static final String STATS_FIELD_UNIQUE_VISITORS = "UNIQUE_VISITORS";

	// 1) Indicators that are incremented every day
	// UserAccount Activation
	public static Indicator getActivationIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<>();
		indicatorGroups.add(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
				.addChild(TRACE_FIELD_PROFILE)
		);

		Indicator indicator = new IndicatorMongoImpl(TRACE_TYPE_ACTIVATION, filters, indicatorGroups);
		indicator.setWriteDate(pWriteDate);
		return indicator;
	}

	// Connections
	public static Indicator getConnectionIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		indicatorGroups.add(
			new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
			.addChild(TRACE_FIELD_PROFILE));

		Indicator indicator = new IndicatorMongoImpl(TRACE_TYPE_CONNEXION, filters, indicatorGroups);
		indicator.setWriteDate(pWriteDate);
		return indicator;
	}

	// Access to applications
	public static Indicator getAccessIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		indicatorGroups.add(
			new IndicatorGroup(TRACE_FIELD_MODULE)
			.addChild(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
					.addChild(TRACE_FIELD_PROFILE)));

		Indicator indicator = new IndicatorMongoImpl(TRACE_TYPE_SVC_ACCESS, filters, indicatorGroups);
		indicator.setWriteDate(pWriteDate);
		return indicator;
	}

	// 2) Indicators that are recomputed every day
	// Unique visitors
	public static Indicator getUniqueVisitorsIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		final IndicatorGroup profileIg = new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
			.addAndReturnChild(TRACE_FIELD_PROFILE);
		indicatorGroups.add(profileIg);

		IndicatorMongoImpl indicator = new IndicatorMongoImpl(TRACE_TYPE_CONNEXION, filters, indicatorGroups){
			@Override
			protected void customizePipeline(JsonArray pipeline){
				// Remove "count" from stage "$group" in pipeline, and add "userId" to field _id
				for (int i = 0; i < pipeline.size(); i++) {
					JsonObject stage = pipeline.get(i);
					JsonObject group = stage.getObject("$group", null);
					if(group != null) {
						group.removeField("count");
						JsonObject id = group.getObject("_id", null);
						if(id != null) {
							id.putString(TRACE_FIELD_USER, "$"+TRACE_FIELD_USER);
						}
						break;
					}
				}

				// Add another "$group" stage in pipeline, to count unique visitors
				JsonObject groupBy = new JsonObject().putObject("$group", new JsonObject()
				.putObject("_id", getGroupByObject(new JsonObject(), profileIg))
				.putObject("count", new JsonObject().putNumber("$sum", 1)));
				pipeline.addObject(groupBy);
			}
		};
		indicator.setWriteKey(STATS_FIELD_UNIQUE_VISITORS);
		indicator.setWriteDate(pWriteDate);

		return indicator;
	}

	// Build the "_id" object for stage "$group"
	private static JsonObject getGroupByObject(JsonObject accumulator, IndicatorGroup group){
		if(group == null)
			return accumulator;

		return getGroupByObject(accumulator, group.getParent()).putString(group.getKey(), "$_id."+group.getKey());
	}


}
