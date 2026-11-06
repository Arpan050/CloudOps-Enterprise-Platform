# CloudOps Enterprise Platform

**Cloud Infrastructure, Automation & Deployment Ecosystem**

A cloud-computing capstone implementing the eight modules in the supplied major-project brief. The existing Voyage application is the proposed workload for the platform; it will be inspected before any application refactoring or infrastructure changes.

## Project constraints

- Cloud provider: AWS
- Existing workload: Voyage on an existing `t2.micro` EC2 instance (1 GiB RAM)
- Reported remaining AWS promotional credits: USD 100 (verify in Billing)
- Configured budget threshold: USD 20 (verify whether this is an alert or an actual spend cap)
- Target incremental spend: USD 0
- Submission date: 12 November 2026
- No production-impacting changes to the existing Voyage deployment without a backup and explicit change plan.

## Eight required workstreams

| # | Assignment module | Project location | Evidence required |
|---|---|---|---|
| 1 | Infrastructure provisioning & virtualization | `infrastructure/terraform/`, `containers/` | Instance, network and container evidence |
| 2 | Networking, storage & data layer | `infrastructure/terraform/`, `application/` | Network layout, storage and secure DB connectivity |
| 3 | Serverless & microservices | `serverless/`, `application/services/`, `kubernetes/` | Function execution, service health and orchestration evidence |
| 4 | Security, IAM, encryption & monitoring | `security/`, `monitoring/` | Least-privilege policy, encryption configuration, logs and alerts |
| 5 | Automation & Infrastructure as Code | `infrastructure/terraform/` | Reviewed Terraform plan and reproducible configuration |
| 6 | CI/CD pipeline engineering | `cicd/` | Build, test and deployment workflow evidence |
| 7 | Big Data, AI & stream processing | `data-engineering/`, `machine-learning/` | Reproducible data pipeline, model training and inference output |
| 8 | No-code deployment & final integration | `no-code/` | No-code app connected to an API and deployment evidence |

## Repository status

This is the initial repository scaffold. A folder or README does **not** mean a module is implemented. Update each workstream's status only after the implementation has been executed and tested.

## Working rules

1. Audit before changing infrastructure.
2. Never commit AWS credentials, private keys, `.env` files, database passwords, tokens, or real customer data.
3. Review estimated AWS charges before creating a resource. The USD 20 budget may be an alert, not a hard spending stop.
4. Prefer local execution and existing resources where practical.
5. Back up existing application configuration and data before modifying Voyage.
6. Record commands, test results, screenshots and limitations. Do not claim unexecuted work as complete.

## First actions

1. Inspect the current EC2 instance and Voyage containers using the read-only audit checklist in `docs/operations/initial-audit.md`.
2. Record actual AWS region, VPC, subnet, security groups, EBS volume and account billing-plan details.
3. Review `docs/architecture/overview.md` and update it to match the audited environment.
4. Only then create or change AWS resources.

## Suggested local workflow

Use WSL or another Linux shell:

```bash
git status
git add .
git commit -m "chore: initialize CloudOps capstone structure"
```
