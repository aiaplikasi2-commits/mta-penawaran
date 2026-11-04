# Security Specification - CV Mulia Tekhnik Abadi (MTA)

## 1. Data Invariants
- Each document must contain a valid ID conforming to standard string limits (`size() <= 128` and regex `^[a-zA-Z0-9_\-]+$`).
- Critical records (`letters`, `basts`, `invoices`, `customers`, `slips`, `karyawan`, `settings`) have strict schema constraints to prevent prototype pollution and database bloat.
- Settings are stored at `/settings/company_settings` and can only contain designated company information keys.
- Deletion operations must be atomic and verified.

## 2. Tested Resource Paths
- `/settings/{settingsId}`
- `/letters/{letterId}`
- `/customers/{customerId}`
- `/basts/{bastId}`
- `/invoices/{invoiceId}`
- `/karyawan/{karyawanId}`
- `/slips/{slipId}`
