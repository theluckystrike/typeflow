import React from 'react';

import { createRoot } from 'react-dom/client';
import SidePanel from './sidepanel';
import { UserProvider } from './providers/UserProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { CustomShortcutsProvider } from './providers/CustomShortcutProvider';
import { FixedShortcutsProvider } from './providers/FixedShortcutProvider';
import { ConstantsProvider } from './providers/ConstantsProvider';
import { ProfilesProvider } from './providers/ProfilesProvider';

const App: React.FC = () => {
    return (
        <UserProvider>
            <ProfilesProvider>
                <SettingsProvider>
                    <ConstantsProvider>
                        <FixedShortcutsProvider>
                            <CustomShortcutsProvider>
                                <SidePanel />
                            </CustomShortcutsProvider>
                        </FixedShortcutsProvider>
                    </ConstantsProvider>
                </SettingsProvider>
            </ProfilesProvider>
        </UserProvider>
    );
};

const root = createRoot(document.getElementById("root")!);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
