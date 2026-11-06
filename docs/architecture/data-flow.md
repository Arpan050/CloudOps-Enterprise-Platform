# Data Flow (Draft)

1. A user interacts with the Voyage frontend.
2. The frontend sends requests to the existing backend API through the current web entry point.
3. The backend reads or writes the existing PostgreSQL database (confirm actual topology during audit).
4. A booking-related event may be published to a queue for asynchronous processing.
5. A serverless consumer processes the event and records the processing result.
6. Operational logs and metrics are collected for troubleshooting and demonstration.
7. A separate batch analytics workflow processes synthetic or sanitized booking events and writes derived output for reporting.

Do not place real personal data or payment details in demonstration datasets. This flow must be updated to match implemented behavior.
