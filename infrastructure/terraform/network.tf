locals {
  public_subnets = {
    public_a = {
      cidr_block        = "10.20.1.0/24"
      availability_zone = "ap-south-1a"
    }
    public_b = {
      cidr_block        = "10.20.2.0/24"
      availability_zone = "ap-south-1b"
    }
  }

  private_subnets = {
    private_a = {
      cidr_block        = "10.20.11.0/24"
      availability_zone = "ap-south-1a"
    }
    private_b = {
      cidr_block        = "10.20.12.0/24"
      availability_zone = "ap-south-1b"
    }
  }
}

# Dedicated CloudOps VPC
resource "aws_vpc" "cloudops" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "cloudops-vpc"
    Project     = "CloudOps-Enterprise-Platform"
    Environment = "development"
    ManagedBy   = "Terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "cloudops" {
  vpc_id = aws_vpc.cloudops.id

  tags = {
    Name      = "cloudops-igw"
    Project   = "CloudOps-Enterprise-Platform"
    ManagedBy = "Terraform"
  }
}

# Public subnets
resource "aws_subnet" "cloudops_public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.cloudops.id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = false

  tags = {
    Name = "cloudops-${each.key}"
    Tier = "public"
  }
}

# Private subnets
resource "aws_subnet" "cloudops_private" {
  for_each = local.private_subnets

  vpc_id                  = aws_vpc.cloudops.id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = false

  tags = {
    Name = "cloudops-${each.key}"
    Tier = "private"
  }
}

# Public route table
resource "aws_route_table" "cloudops_public" {
  vpc_id = aws_vpc.cloudops.id

  tags = {
    Name = "cloudops-public-rt"
    Tier = "public"
  }
}

# Internet route for public subnets
resource "aws_route" "cloudops_public_internet" {
  route_table_id         = aws_route_table.cloudops_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.cloudops.id
}

# Private route table: only the automatic local VPC route
resource "aws_route_table" "cloudops_private" {
  vpc_id = aws_vpc.cloudops.id

  tags = {
    Name = "cloudops-private-rt"
    Tier = "private"
  }
}

# Associate public subnets
resource "aws_route_table_association" "cloudops_public" {
  for_each = aws_subnet.cloudops_public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.cloudops_public.id
}

# Associate private subnets
resource "aws_route_table_association" "cloudops_private" {
  for_each = aws_subnet.cloudops_private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.cloudops_private.id
}
