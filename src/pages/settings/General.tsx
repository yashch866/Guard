import SettingsLayout from "@/components/SettingsLayout";
import { VolumeControl } from "@/components/VolumeControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/config";

export default function General() {
    const handleReboot = async () => {
        if (confirm('Are you sure you want to reboot the system? This will close all applications.')) {
            try {
                const backendUrl = await getBackendUrl();
                const response = await fetch(`${backendUrl}/system/reboot`, {
                    method: 'POST',
                });
                if (!response.ok) {
                    throw new Error('Failed to initiate reboot');
                }
                alert('System reboot initiated. The application will close shortly.');
            } catch (error) {
                console.error('Reboot failed:', error);
                alert('Failed to reboot system: ' + error.message);
            }
        }
    };

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <VolumeControl />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            variant="destructive" 
                            onClick={handleReboot}
                        >
                            Reboot System
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
}
