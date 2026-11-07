
output "voyage_instance_inventory" {
  description = "Existing Voyage EC2 configuration"

  value = {
    id                = data.aws_instance.voyage.id
    instance_type     = data.aws_instance.voyage.instance_type
    availability_zone = data.aws_instance.voyage.availability_zone
    private_ip        = data.aws_instance.voyage.private_ip
    public_ip         = data.aws_instance.voyage.public_ip
    subnet_id         = data.aws_instance.voyage.subnet_id
  }
}

output "vpc_inventory" {
  description = "Existing VPC configuration"

  value = {
    id                   = data.aws_vpc.voyage.id
    cidr_block           = data.aws_vpc.voyage.cidr_block
    enable_dns_support   = data.aws_vpc.voyage.enable_dns_support
    enable_dns_hostnames = data.aws_vpc.voyage.enable_dns_hostnames
  }
}

output "subnet_inventory" {
  description = "Existing subnet configuration"

  value = {
    id                      = data.aws_subnet.voyage.id
    cidr_block              = data.aws_subnet.voyage.cidr_block
    availability_zone       = data.aws_subnet.voyage.availability_zone
    map_public_ip_on_launch = data.aws_subnet.voyage.map_public_ip_on_launch
  }
}

output "security_group_inventory" {
  description = "Existing security group configuration"

  value = {
    id          = data.aws_security_group.voyage.id
    name        = data.aws_security_group.voyage.name
    vpc_id      = data.aws_security_group.voyage.vpc_id
    description = data.aws_security_group.voyage.description
    arn         = data.aws_security_group.voyage.arn
  }
}
