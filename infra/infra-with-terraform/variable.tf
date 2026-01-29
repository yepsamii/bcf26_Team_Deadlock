output "k8s_instances_public_ips" {
  value = aws_instance.k8s_instances[*].public_ip
}
output "k8s_instances_private_ips" {
  value = aws_instance.k8s_instances[*].private_ip
}
output "k8s_instances_private_dns" {
  value = aws_instance.k8s_instances[*].private_dns
}
output "database_public_ip" {
  value = aws_instance.database.public_ip
}
output "database_private_ip" {
  value = aws_instance.database.private_ip
}