pipeline {
    agent any

    environment {
        // Docker image info
        DOCKER_IMAGE = "mariemsouadi12189/task_api"
        IMAGE_TAG = "latest"

        // Kubernetes info
        K8S_DEPLOYMENT = "task-api-deployment"
        K8S_CONTAINER  = "task-api"
        K8S_NAMESPACE  = "default"

        // Jenkins credentials
        DOCKER_CREDENTIALS_ID = "dockerhub-creds"
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
                sh """
                docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} .
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

        stage('Trivy Image Scan') {
            steps {
                sh """
                mkdir -p trivy-report

                # JSON report
                trivy image \
                  --severity HIGH,CRITICAL \
                  --scanners vuln \
                  --format json \
                  --output trivy-report/trivy-report.json \
                  ${DOCKER_IMAGE}:${IMAGE_TAG} || true

                # HTML report
                trivy image \
                  --severity HIGH,CRITICAL \
                  --scanners vuln \
                  --format template \
                  --template "@trivy-templates/html.tpl" \
                  --output trivy-report/trivy-report.html \
                  ${DOCKER_IMAGE}:${IMAGE_TAG} || true
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
               withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                 sh """
                 export KUBECONFIG=$KUBECONFIG

                 kubectl config get-contexts
                 kubectl set image deployment/${K8S_DEPLOYMENT} \
                   ${K8S_CONTAINER}=${DOCKER_IMAGE}:${IMAGE_TAG} \
                   -n ${K8S_NAMESPACE}

                 kubectl rollout status deployment/${K8S_DEPLOYMENT} \
                   -n ${K8S_NAMESPACE}
                 """
        }
    }
}

    post {
        always {
            archiveArtifacts artifacts: 'trivy-report/*', fingerprint: true
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

