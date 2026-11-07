output "cloudops_vpc_id" {
  value = aws_vpc.cloudops.id
}

output "cloudops_internet_gateway_id" {
  value = aws_internet_gateway.cloudops.id
}

output "cloudops_public_subnet_ids" {
  value = {
    for name, subnet in aws_subnet.cloudops_public :
    name => subnet.id
  }
}

output "cloudops_private_subnet_ids" {
  value = {
    for name, subnet in aws_subnet.cloudops_private :
    name => subnet.id
  }
}
