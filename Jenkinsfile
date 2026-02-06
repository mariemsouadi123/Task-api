pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "mariemsouadi12189/task_api"
        IMAGE_TAG    = "latest"

        K8S_NAMESPACE = "default"

        DOCKER_CREDENTIALS_ID = "dockerhub-creds"
        KUBECONFIG_CRED_ID    = "kubeconfig"

        // Trivy DB cache (already downloaded)
        TRIVY_CACHE_DIR = "/var/jenkins_home/.cache/trivy"
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

        stage('Trivy Image Scan (Offline)') {
            steps {
                sh '''
                mkdir -p trivy-report

                export TRIVY_CACHE_DIR=/var/jenkins_home/.cache/trivy
                export TRIVY_OFFLINE_SCAN=true
                export TRIVY_SKIP_DB_UPDATE=true

                trivy image \
                  --offline-scan \
                  --severity HIGH,CRITICAL \
                  --format table \
                  ${DOCKER_IMAGE}:${IMAGE_TAG} \
                  | tee trivy-report/trivy-report.txt || true
                '''
            }
        }

        stage('Checkov Scan') {
           steps {
               sh '''
               mkdir -p checkov-report
               docker run --rm \
                 -v $PWD:/workspace \
                 bridgecrew/checkov \
                 -d /workspace/k8s \
                 --framework kubernetes \
                 --output table | tee checkov-report/checkov-report.txt
              '''
    }
}

        stage('Docker Login & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    docker push mariemsouadi12189/task_api:latest
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([
                    file(credentialsId: KUBECONFIG_CRED_ID, variable: 'KUBECONFIG_FILE')
                ]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG_FILE

                    kubectl apply -f k8s/deployment.yaml -n default
                    kubectl apply -f k8s/service.yaml -n default

                    DEPLOYMENT_NAME=$(kubectl get deployment -n default -o jsonpath="{.items[0].metadata.name}")

                    echo "Waiting for rollout of deployment: $DEPLOYMENT_NAME"
                    kubectl rollout status deployment/$DEPLOYMENT_NAME -n default
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'trivy-report/trivy-report.txt', fingerprint: true
            archiveArtifacts artifacts: 'checkov-report/checkov-report.txt', fingerprint: true

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
