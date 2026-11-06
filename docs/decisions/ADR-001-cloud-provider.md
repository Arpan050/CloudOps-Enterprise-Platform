# ADR-001: Select AWS as the Cloud Provider

- Status: Accepted
- Date: 2026-11-06

## Context
The project constraints specify AWS.

## Decision
Use AWS as the primary public-cloud provider. Use the existing AWS account and existing EC2 instance where suitable.

## Consequences
- Resource regions, account-plan restrictions, promotional-credit expiry and service prices must be checked before provisioning.
- Avoid multi-cloud implementation within the short submission window.
