package net.atos.entng.statistics.aggregation.indicators;

import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_MODULE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_PROFILE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_STRUCTURES;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_USER;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_ACTIVATION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_CONNEXION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;
import static net.atos.entng.statistics.aggregation.indicators.IndicatorConstants.STATS_FIELD_UNIQUE_VISITORS;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

import org.entcore.common.aggregation.MongoConstants.COLLECTIONS;
import org.entcore.common.aggregation.filters.dbbuilders.MongoDBBuilder;
import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;

public class IndicatorFactory {

	// 1) Indicators that are incremented every day
	// UserAccount Activation
	public static Indicator getActivationIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
        Collection<IndicatorGroup> indicatorGroups = new ArrayList<>();
        indicatorGroups.add(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
                .addAndReturnChild(TRACE_FIELD_PROFILE)
        );
        
        IndicatorMongoImpl indicator = new IndicatorMongoImpl(TRACE_TYPE_ACTIVATION, filters, indicatorGroups){
            @Override
            protected void customizePipeline(JsonArray pipeline){
                int triggerSize = 0;
                // Remove "count" from stage "$group" in pipeline, add userCount instead, and add "userId" to field _id
                for (int i = 0; i < pipeline.size(); i++) {
                    JsonObject stage = pipeline.get(i);
                    JsonObject group = stage.getObject("$group", null);
                    if(group != null) {
                        group.removeField("count");
                        JsonObject id = group.getObject("_id", null);
                        if(id != null && id.size() == 0) {
                            id.putString(TRACE_FIELD_USER, "$"+TRACE_FIELD_USER);
                        } else if(id != null && id.size() > 0) {// We are in a "structures" stats query 
                            id.putString(TRACE_FIELD_STRUCTURES, "$"+TRACE_FIELD_STRUCTURES).putString(TRACE_FIELD_PROFILE, "$"+TRACE_FIELD_PROFILE).putString(TRACE_FIELD_USER, "$"+TRACE_FIELD_USER);
                            triggerSize = 1;
                        }
                        group.putObject("userCount", new JsonObject().putNumber("$min", 1));
                        break;
                    }
                }

                // Add another "$group" stage in pipeline, to count unique activation per user
                JsonObject groupByActiv = new JsonObject();
                if(triggerSize == 0){
                    groupByActiv.putObject("$group", new JsonObject()
                    .putObject("_id", new JsonObject())
                    .putObject("count", new JsonObject().putString("$sum", "$userCount")));
                } else {
                    groupByActiv.putObject("$group", new JsonObject()
                    .putObject("_id", new JsonObject().putString(TRACE_FIELD_STRUCTURES, "$_id."+TRACE_FIELD_STRUCTURES).putString(TRACE_FIELD_PROFILE, "$_id."+TRACE_FIELD_PROFILE))
                    .putObject("count", new JsonObject().putString("$sum", "$userCount")));
                }
                pipeline.addObject(groupByActiv);
            }
            
        };
        
        indicator.setWriteDate(pWriteDate);
        return indicator;
    }

	// Connections
	public static Indicator getConnectionIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		indicatorGroups.add(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
			.addAndReturnChild(TRACE_FIELD_PROFILE));

		Indicator indicator = new IndicatorMongoImpl(TRACE_TYPE_CONNEXION, filters, indicatorGroups);
		indicator.setWriteDate(pWriteDate);
		return indicator;
	}

	// Access to applications
	public static Indicator getAccessIndicator(Collection<IndicatorFilterMongoImpl> filters, Date pWriteDate) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		indicatorGroups.add(new IndicatorGroup(TRACE_FIELD_MODULE)
			.addAndReturnChild(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true))
			.addAndReturnChild(TRACE_FIELD_PROFILE));

		Indicator indicator = new IndicatorMongoImpl(TRACE_TYPE_SVC_ACCESS, filters, indicatorGroups);
		indicator.setWriteDate(pWriteDate);
		return indicator;
	}

	// 2) Indicators that are recomputed every day
	// Accounts and activated accounts
	public static Indicator getActivatedAccountsIndicator(Date pWriteDate) {
		IndicatorCustomImpl indicator = new IndicatorCustomImpl();
		indicator.setWriteDate(pWriteDate);
		return indicator;
	}

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

			@Override
			// Set the indicator's value (instead of incrementing it)
			protected void writeAction(MongoDBBuilder criteriaQuery, int resultsCount, Handler<Message<JsonObject>> handler){
				mongo.update(COLLECTIONS.stats.name(),
						MongoQueryBuilder.build(criteriaQuery),
						new MongoUpdateBuilder().set(this.getWriteKey(), resultsCount).build(),
						true,
						true,
						handler);
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
