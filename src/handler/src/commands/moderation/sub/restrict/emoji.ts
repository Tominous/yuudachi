import type { APIGuildInteraction, APIMessage, Snowflake } from 'discord-api-types/v8';
import type { Ok } from 'lexure';
import i18next from 'i18next';
import API, { HttpException } from '@yuudachi/api';
import { container } from 'tsyringe';
import ms from '@naval-base/ms';
import type { Sql } from 'postgres';
import { CaseAction } from '@yuudachi/types';
import { Tokens } from '@yuudachi/core';

import { send } from '../../../../util';

const { kSQL } = Tokens;

export async function emoji(
	message: APIMessage | APIGuildInteraction,
	maybeMember: Ok<Snowflake>,
	duration: string,
	locale: string,
	reason?: string,
	refId?: string,
) {
	const sql = container.resolve<Sql<any>>(kSQL);
	const api = container.resolve(API);

	const [roles] = await sql<[{ emoji_role_id: Snowflake | '' | null }?]>`
		select emoji_role_id
		from guild_settings
		where guild_id = ${message.guild_id!}
	`;

	if (!roles?.emoji_role_id) {
		throw new Error(i18next.t('command.mod.restrict.emoji.errors.no_role', { lng: locale }));
	}

	const [action] = await sql<[{ action_processed: boolean }?]>`
		select action_processed
		from cases
		where guild_id = ${message.guild_id!}
			and target_id = ${maybeMember.value}
			and role_id = ${roles.emoji_role_id}
		order by created_at desc
		limit 1`;

	if (action && !action.action_processed) {
		throw new Error(i18next.t('command.mod.restrict.emoji.errors.already_restricted', { lng: locale }));
	}

	const parsedDuration = ms(duration);
	if (parsedDuration < 300000 || isNaN(parsedDuration)) {
		throw new Error(i18next.t('command.common.errors.duration_format', { lng: locale }));
	}

	const memberMention = `<@${maybeMember.value}>`;

	try {
		await api.guilds.createCase(message.guild_id!, {
			action: CaseAction.ROLE,
			reason,
			moderatorId: 'author' in message ? message.author.id : message.member.user.id,
			targetId: maybeMember.value,
			roleId: roles.emoji_role_id,
			contextMessageId: message.id,
			referenceId: refId ? Number(refId) : undefined,
			actionExpiration: new Date(Date.now() + parsedDuration),
		});

		void send(message, {
			content: i18next.t('command.mod.restrict.emoji.success', { member: memberMention, lng: locale }),
		});
	} catch (e) {
		if (e instanceof HttpException) {
			switch (e.status) {
				case 403:
					throw new Error(i18next.t('command.mod.restrict.emoji.errors.missing_permissions', { lng: locale }));
				case 404:
					throw new Error(i18next.t('command.common.errors.target_not_found', { lng: locale }));
			}
		}
		throw new Error(i18next.t('command.mod.restrict.emoji.errors.failure', { member: memberMention, lng: locale }));
	}
}
