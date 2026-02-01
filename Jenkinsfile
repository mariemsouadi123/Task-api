pipeline {
    agent any

    environment {
        // Docker image info
        DOCKER_IMAGE = "mariemsouadi12189/task_api"
        IMAGE_TAG    = "latest"

        // Kubernetes info
        K8S_NAMESPACE  = "default"

        // Jenkins credentials
        DOCKER_CREDENTIALS_ID = "dockerhub-creds"
        KUBECONFIG_CRED_ID    = "kubeconfig"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/mariemsouadi123/Task-api'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} ."
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh """
                mkdir -p trivy-report

                # Scan Docker image using host Trivy installation
                trivy image --severity HIGH,CRITICAL --format html \
                    --output trivy-report/trivy-report.html \
                    ${DOCKER_IMAGE}:${IMAGE_TAG} || true
                """
            }
        }

        stage('Docker Login & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: env.DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh """
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                    docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: env.KUBECONFIG_CRED_ID, variable: 'KUBECONFIG_FILE')]) {
                    sh """
                    export KUBECONFIG=\$KUBECONFIG_FILE

                    # Apply deployment and service YAMLs
                    kubectl apply -f k8s/deployment.yaml -n ${K8S_NAMESPACE}
                    kubectl apply -f k8s/service.yaml -n ${K8S_NAMESPACE}

                    # Wait for rollout to complete
                    DEPLOYMENT_NAME=\$(kubectl get deployment -n ${K8S_NAMESPACE} -o jsonpath='{.items[0].metadata.name}')
                    echo "Waiting for rollout of deployment: \$DEPLOYMENT_NAME"
                    kubectl rollout status deployment/\$DEPLOYMENT_NAME -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        always {
            // Archive and display the Trivy HTML report
            archiveArtifacts artifacts: 'trivy-report/trivy-report.html', fingerprint: true

            publishHTML(target: [
                reportDir: 'trivy-report',
                reportFiles: 'trivy-report.html',
                reportName: 'Trivy Vulnerability Report',
                keepAll: true,
                allowMissing: false,
                alwaysLinkToLastBuild: true
            ])

            // Cleanup unused Docker images
            sh "docker image prune -f"
        }

        success {
            echo "✅ Pipeline completed successfully!"
        }

        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
