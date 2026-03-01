import { Metadata } from "next";
import ManualCheckInClient from "./ManualCheckInClient";

export const metadata: Metadata = {
    title: "Manual Check-in | Hackoverflow 4.0",
    description: "Manual participant check-in for Hackoverflow 4.0",
};

export default function ManualCheckInPage() {
    return <ManualCheckInClient />;
}
