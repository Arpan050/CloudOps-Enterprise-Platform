
resource "aws_security_group" "edge" {
  name        = "cloudops-edge-sg"
  description = "Public entry point for CloudOps"
  vpc_id      = aws_vpc.cloudops.id

  tags = {
    Name    = "cloudops-edge-sg"
    Project = "CloudOps-Enterprise-Platform"
    Tier    = "edge"
  }
}

resource "aws_security_group" "app" {
  name        = "cloudops-app-sg"
  description = "Application services security group"
  vpc_id      = aws_vpc.cloudops.id

  tags = {
    Name    = "cloudops-app-sg"
    Project = "CloudOps-Enterprise-Platform"
    Tier    = "application"
  }
}

resource "aws_security_group" "data" {
  name        = "cloudops-data-sg"
  description = "Database and cache security group"
  vpc_id      = aws_vpc.cloudops.id

  tags = {
    Name    = "cloudops-data-sg"
    Project = "CloudOps-Enterprise-Platform"
    Tier    = "data"
  }
}
