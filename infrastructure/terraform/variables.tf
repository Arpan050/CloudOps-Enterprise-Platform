variable "aws_region" {
  description = "AWS deployment region"
  type        = string
}

variable "voyage_instance_id" {
  description = "Existing Voyage EC2 instance ID"
  type        = string
}

variable "vpc_id" {
  description = "Existing AWS VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Existing AWS subnet ID"
  type        = string
}

variable "security_group_id" {
  description = "Existing EC2 security group ID"
  type        = string
}
