pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "mariemsouadi12189"     // Replace with your Docker Hub username
        BACKEND_IMAGE  = "task_api"              // Docker image name
        IMAGE_TAG      = "latest"                // fixed tag or use git commit hash
    }

    stages {

        stage("Checkout Code") {
            steps {
                git branch: 'main',
                    credentialsId: 'github-pat',   // <-- Jenkins GitHub PAT credential
                    url: 'https://github.com/mariemsouadi123/Task-api'
            }
        }

        stage("Build Docker Image") {
            steps {
                script {
                    // Build Docker image
                    docker.build("${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}", ".")
                }
            }
        }

        stage("Push Docker Image") {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',  // Jenkins Docker Hub creds
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh """
                        echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage("Deploy to Kubernetes") {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')
                ]) {
                    sh """
                        export KUBECONFIG=\$KUBECONFIG_FILE

                        # Apply Deployment and Service
                        kubectl apply -f k8s/deployment.yaml
                        kubectl apply -f k8s/service.yaml

                        # Wait until rollout completes
                        kubectl rollout status deployment/task-api-deployment -n default
                    """
                }
            }
        }
    }

    post {
        always {
            // Clean local Docker images
            sh "docker image prune -f"
        }
        success { echo "✅ Pipeline successful!" }
        failure { echo "❌ Pipeline failed!" }
    }
}
