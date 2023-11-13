import { ICalEventBusyStatus } from 'ical-generator';
import type { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints';

export default {
	filter: {
		and: [
			//{ property: 'Status', select: { does_not_equal: 'Done' } },
		]
	},
	dateProperty: 'Action Date Extended',
	titleProperty: 'Name',
	busy: ICalEventBusyStatus.FREE
} as {
	filter: Readonly<QueryDatabaseParameters['filter']>;
	dateProperty: Readonly<string>;
	titleProperty: Readonly<string>;
	busy: Readonly<ICalEventBusyStatus>;
};
