provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "app_wacs" {
  name = "app-wacs-cluster"
}

resource "aws_ecs_task_definition" "app_wacs" {
  family                   = "app-wacs"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512

  container_definitions = jsonencode([
    {
      name      = "app-wacs"
      image     = "app-wacs:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "REACT_APP_API_URL"
          value = "http://api:3001"
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "app_wacs" {
  name            = "app-wacs-service"
  cluster         = aws_ecs_cluster.app_wacs.id
  task_definition = aws_ecs_task_definition.app_wacs.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = ["subnet-12345678", "subnet-87654321"]
    security_groups  = ["sg-12345678"]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_wacs.arn
    container_name   = "app-wacs"
    container_port   = 3000
  }
}

resource "aws_lb" "app_wacs" {
  name               = "app-wacs-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = ["sg-12345678"]
  subnets            = ["subnet-12345678", "subnet-87654321"]
}

resource "aws_lb_target_group" "app_wacs" {
  name        = "app-wacs-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = "vpc-12345678"
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

resource "aws_lb_listener" "app_wacs" {
  load_balancer_arn = aws_lb.app_wacs.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_wacs.arn
  }
} 