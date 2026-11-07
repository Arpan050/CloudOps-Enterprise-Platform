
output "cloudops_security_groups" {
  description = "CloudOps security group IDs"

  value = {
    edge = aws_security_group.edge.id
    app  = aws_security_group.app.id
    data = aws_security_group.data.id
  }
}
