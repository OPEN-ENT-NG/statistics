package net.atos.entng.statistics.aggregation.indicators;

import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_MODULE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_PROFILE;
import static org.entcore.common.aggregation.MongoConstants.TRACE_FIELD_STRUCTURES;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_ACTIVATION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_CONNEXION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;

import java.util.ArrayList;
import java.util.Collection;

import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;

public class IndicatorFactory {

	// UserAccount Activation
	public static Indicator getActivationIndicator(Collection<IndicatorFilterMongoImpl> filters) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<>();
		indicatorGroups.add(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
				.addChild(TRACE_FIELD_PROFILE)
		);

		return new IndicatorMongoImpl(TRACE_TYPE_ACTIVATION, filters, indicatorGroups);
	}


	// Connections
	public static Indicator getConnectionIndicator(Collection<IndicatorFilterMongoImpl> filters) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		indicatorGroups.add(
			new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
			.addChild(TRACE_FIELD_PROFILE));

		return new IndicatorMongoImpl(TRACE_TYPE_CONNEXION, filters, indicatorGroups);
	}

	// Access to applications
	public static Indicator getAccessIndicator(Collection<IndicatorFilterMongoImpl> filters) {
		Collection<IndicatorGroup> indicatorGroups = new ArrayList<IndicatorGroup>();
		indicatorGroups.add(
			new IndicatorGroup(TRACE_FIELD_MODULE)
			.addChild(new IndicatorGroup(TRACE_FIELD_STRUCTURES).setArray(true)
					.addChild(TRACE_FIELD_PROFILE)));

		return new IndicatorMongoImpl(TRACE_TYPE_SVC_ACCESS, filters, indicatorGroups);
	}

}
