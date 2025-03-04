import ical from 'ical-generator';
import { Client } from '@notionhq/client';
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

import config from '$lib/config';
import { ACCESS_KEY, NOTION_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

export const trailingSlash = 'never';

const notion = new Client({ auth: NOTION_TOKEN });

export const GET: RequestHandler = async ({ params, url }) => {
	const secret = url.searchParams.get('secret');
	if (secret !== ACCESS_KEY) {
		return new Response('Forbidden', { status: 403 });
	}

	const { id } = params;

	const databaseMetadata = await notion.databases.retrieve({ database_id: id });

	const databaseEntries = [];
	let query: QueryDatabaseResponse | { has_more: true; next_cursor: undefined } = {
		has_more: true,
		next_cursor: undefined
	};
	while (query.has_more) {
		query = await notion.databases.query({
			database_id: id,
			page_size: 100,
			start_cursor: query.next_cursor,
			filter: config.filter
		});
		databaseEntries.push(...query.results);
	}

	const filtered: {
		title: string;
		url: string;
		date: { start: string; end: string | null; time_zone: string | null };
	}[] = databaseEntries.flatMap((object) => {
		if (object.properties[config.dateProperty].date === null) {
			return [];
		}

		let title = object.properties[config.titleProperty].title[0].text.content 

		//optionally show some extra data based on status
		let status = object.properties['Status'].status.name; 
		if(!status.includes("Not started")) title += " [" + status + "] ";

		//console.log(object.properties[config.dateProperty].date );
		let date = object.properties[config.dateProperty].date || 
		{ 
			//support formulas
			start: new Date(object.properties[config.dateProperty].formula.string).toISOString().split('T')[0], 
			end: null, time_zone: null 
		};


		return [
			{
				title: title ,
				date: date,
				url: object.url
			}
		];
	});

	const calendar = ical({
		name: databaseMetadata.title[0].text.content,
		prodId: { company: 'Swanepoel', language: 'EN', product: 'notion-ics' }
	});
	filtered.forEach((event) => {
		calendar.createEvent({
			start: new Date(event.date.start),
			end: new Date(Date.parse(event.date.end ?? event.date.start) + 86400000), // end date is exclusive, so add 1 day
			allDay: true,
			summary: event.title,
			busystatus: config.busy,
			url: event.url
		});
	});

	return new Response(calendar.toString(), {
		status: 200,
		headers: {
			'content-type': 'text/calendar'
		}
	});
};
