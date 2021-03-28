import dynamic from 'next/dynamic';
import { Grid, Heading } from '@chakra-ui/react';
import type { RESTGetAPICurrentUserGuildsResult, RESTGetAPIGuildResult } from 'discord-api-types/v8';

const GuildIcon = dynamic(() => import('~/components/GuildIcon'));

const GuildDisplay = ({
	id,
	guild,
	fallbackGuild,
}: {
	id: string;
	guild?: { guild: RESTGetAPIGuildResult | null };
	fallbackGuild?: { guilds: RESTGetAPICurrentUserGuildsResult };
}) =>
	guild?.guild ?? fallbackGuild?.guilds.length ? (
		<Grid
			templateColumns={{ base: 'auto', md: '300px' }}
			gap={{ base: '16px' }}
			justifyItems="center"
			justifyContent="center"
			alignItems="center"
			textAlign="center"
			mt={4}
			mb={8}
			color="white"
		>
			<GuildIcon guild={guild?.guild ?? fallbackGuild?.guilds.find((guild) => guild.id === id)} />
			<Heading fontSize="2xl">
				{guild?.guild?.name ?? fallbackGuild?.guilds.find((guild) => guild.id === id)?.name}
			</Heading>
		</Grid>
	) : null;

export default GuildDisplay;
