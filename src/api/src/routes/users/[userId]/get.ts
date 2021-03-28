import type { Request, Response } from 'polka';
import { injectable } from 'tsyringe';
import Rest, { HttpException } from '@yuudachi/rest';
import { Route } from '@yuudachi/http';
import type { RESTGetAPIUserResult } from 'discord-api-types';
import { forbidden, notFound } from '@hapi/boom';

@injectable()
export default class GetUserRoute extends Route {
	public constructor(private readonly rest: Rest) {
		super();
	}

	public async handle(req: Request, res: Response) {
		let user: RESTGetAPIUserResult;
		try {
			user = await this.rest.get(`/users/${req.params.userId}`);
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
		res.end(JSON.stringify(user));
	}
}
