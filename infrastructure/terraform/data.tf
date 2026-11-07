data "aws_instance" "voyage" {
  instance_id = var.voyage_instance_id
}

data "aws_vpc" "voyage" {
  id = var.vpc_id
}

data "aws_subnet" "voyage" {
  id = var.subnet_id
}

data "aws_security_group" "voyage" {
  id = var.security_group_id
}
