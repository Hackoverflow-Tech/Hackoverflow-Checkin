import ParticipantCheckInClient from "./ParticipantCheckInClient";

interface Props {
    params: Promise<{ participantId: string }>;
}

export default async function ParticipantPage({ params }: Props) {
    // Render the check-in component directly for incoming participants
    return <ParticipantCheckInClient />;
}
