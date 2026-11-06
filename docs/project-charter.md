# Project Charter

## Title
CloudOps Enterprise Platform: Cloud Infrastructure, Automation & Deployment Ecosystem

## Purpose
Implement and demonstrate an integrated cloud and DevOps environment that covers all eight modules in the supplied Cloud Computing Major Project brief.

## Workload
The existing Voyage travel application is the proposed workload. Its actual source structure, deployment method, services, database, and runtime dependencies must be confirmed during the initial audit. Do not assume that the present application is already a microservices system.

## Scope

1. Cloud infrastructure provisioning and virtualization.
2. Cloud networking, storage and data layer.
3. Serverless architecture and microservices design.
4. Cloud security, IAM, encryption and monitoring.
5. Automation and Infrastructure as Code.
6. CI/CD pipeline engineering.
7. Big Data, AI and stream processing.
8. No-code cloud application deployment and final integration.

## Constraints

- AWS is the selected cloud provider.
- Submission deadline: 12 November 2026.
- Existing EC2: reported as `t2.micro`, 1 GiB RAM, currently hosting Voyage.
- Remaining AWS promotional credits: user-reported USD 100; verify account billing details.
- User has configured a USD 20 limit; verify whether this is an AWS Budget notification or another spend-control feature.
- Target incremental spend: USD 0. Any expected charge requires review before resource creation.

## Acceptance principle
Each module must have an observable implementation or execution, a test or validation result, and evidence. Documentation-only placeholders must be identified as incomplete. Any substitution for a named service in the assignment must be documented with its reason and confirmed against faculty expectations.

## Out of scope unless explicitly approved
- Rebuilding Voyage from scratch.
- Migrating or restarting the live application without a rollback plan.
- Provisioning paid managed services merely to match a technology name.
- Claiming production readiness based only on a local prototype.
