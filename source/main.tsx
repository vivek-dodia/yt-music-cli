// Main application orchestrator
import React from 'react';
import {NavigationProvider} from './stores/navigation.store.tsx';
import MainLayout from './components/layouts/MainLayout.tsx';
import {ThemeProvider} from './contexts/theme.context.tsx';
import {PlayerProvider} from './stores/player.store.tsx';
import {Box} from 'ink';

export default function Main() {
	return (
		<Box>
			<ThemeProvider>
				<PlayerProvider>
					<NavigationProvider>
						<MainLayout />
					</NavigationProvider>
				</PlayerProvider>
			</ThemeProvider>
		</Box>
	);
}
