import { LoadingScreen } from "@/components/ui/loading-screen";

export default function Loading() {
    return (
        <div className="flex match-parent min-h-screen items-center justify-center">
            <LoadingScreen text="Loading Route Data" />
        </div>
    );
}
