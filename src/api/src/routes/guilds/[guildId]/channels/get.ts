import { Request, Response } from 'polka';
import { injectable } from 'tsyringe';
import Rest, { HttpException } from '@yuudachi/rest';
import { Route } from '@yuudachi/http';
import { RESTGetAPIGuildChannelsResult } from 'discord-api-types/v8';
import { forbidden, notFound } from '@hapi/boom';

@injectable()
export default class GetGuildChannelsRoute extends Route {
	public constructor(private readonly rest: Rest) {
		super();
	}

	public async handle(req: Request, res: Response) {
		let channels: RESTGetAPIGuildChannelsResult;
		try {
			channels = await this.rest.get(`/guilds/${req.params.guildId}/channels`);
		} catch (e) {
			if (e instanceof HttpException) {
				switch (e.status) {
					case 403:
						throw forbidden(e.body);
					case 404:
						throw notFound(e.body);
				}
			}

			throw e;
		}

		req.statusCode = 200;
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.end(JSON.stringify(channels));
	}
}
