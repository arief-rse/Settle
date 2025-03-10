import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { X } from "lucide-react";

interface SettingsProps {
    onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
    return (
        <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Settings panel placeholder. Implement your own settings UI here.
                </p>

                <Button
                    onClick={onClose}
                    className="w-full"
                >
                    Close
                </Button>
            </div>
        </Card>
    );
}

export default Settings; 