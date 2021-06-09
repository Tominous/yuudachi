import type { APIGuildInteraction } from 'discord-api-types/v8';
import API, { HttpException } from '@yuudachi/api';
import { CaseAction, CommandModules } from '@yuudachi/types';
import type { ArgumentsOf, WarnCommand } from '@yuudachi/interactions';
import i18next from 'i18next';
import { injectable } from 'tsyringe';

import Command from '../../Command';
import { checkMod, send } from '../../util';

@injectable()
export default class implements Command {
	public readonly category = CommandModules.Moderation;

	public constructor(private readonly api: API) {}

	private parse(args: ArgumentsOf<typeof WarnCommand>) {
		return {
			member: args.user,
			reason: args.reason,
			refId: args.reference,
		};
	}

	public async execute(
		message: APIGuildInteraction,
		args: ArgumentsOf<typeof WarnCommand>,
		locale: string,
	): Promise<void> {
		await checkMod(message, locale);

		const { member, reason, refId } = this.parse(args);
		if (reason && reason.length >= 1900) {
			throw new Error(i18next.t('command.mod.common.errors.max_length_reason', { lng: locale }));
		}

		const memberMention = `<@${member.user.id}>`;

		try {
			await this.api.guilds.createCase(message.guild_id, {
				action: CaseAction.WARN,
				reason: reason ?? undefined,
				moderatorId: message.member.user.id,
				targetId: member.user.id,
				contextMessageId: message.id,
				referenceId: refId ? Number(refId) : undefined,
			});

			void send(message, {
				content: i18next.t('command.mod.warn.success', { member: memberMention, lng: locale }),
			});
		} catch (e) {
			if (e instanceof HttpException) {
				switch (e.status) {
					case 404:
						throw new Error(i18next.t('common.errors.target_not_found', { lng: locale }));
				}
			}
			throw new Error(i18next.t('command.mod.warn.errors.failure', { member: memberMention, lng: locale }));
		}
	}
}
