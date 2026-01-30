pipeline {
    agent any

    environment {
        // Docker image info
        DOCKER_IMAGE = "your_dockerhub_username/task_api" // Replace with your Docker Hub username
        IMAGE_TAG = "latest"  // Or use Git commit hash

        // Kubernetes deployment info
        K8S_DEPLOYMENT = "task-api-deployment"
        K8S_CONTAINER = "task-api"  // container name inside deployment
        K8S_NAMESPACE = "default"

        // Credentials IDs in Jenkins
        DOCKER_CREDENTIALS_ID = "dockerhub-credentials"  // Set in Jenkins credentials
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/mariemsouadi123/Task-api.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Docker Login') {
            steps {
                script {
                    // Docker Hub login using Jenkins credentials
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, 
                                                      usernameVariable: 'DOCKER_USER', 
                                                      passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    }
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh "docker push ${DOCKER_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Update image in k8s deployment
                    sh "kubectl set image deployment/${K8S_DEPLOYMENT} ${K8S_CONTAINER}=${DOCKER_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}"
                    // Wait for rollout to finish
                    sh "kubectl rollout status deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}"
                }
            }
        }
    }

    post {
        always {
            // Clean up local images
            sh "docker image prune -f"
        }
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
