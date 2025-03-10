import { useState } from "react";
import { Button } from "../../ui/button";
import { Settings as SettingsIcon } from "lucide-react";
import Settings from "./Settings";

export function SettingsButton() {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 p-0"
            >
                <SettingsIcon className="h-4 w-4" />
            </Button>

            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </>
    );
}

export default SettingsButton; 