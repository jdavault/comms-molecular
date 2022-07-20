# Load in some Tilt Commands we'll be using
load('ext://namespace', 'namespace_create', 'namespace_inject')
# Create the service namespace
namespace_create('apis')
# Build the docker image
docker_build('medicrea-comms-backend', '.', dockerfile='./local-dev/Dockerfile', target="app")
# Inject our yaml into the created namespace
k8s_yaml([
  namespace_inject(read_file('local-dev/api-gateway-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/chat-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/config-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/ingress-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/medicrea-app-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/nats-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/redis-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/sfdc_notification-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/sfdc_query-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/sfdc_tasks-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/sfdc_users-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/sfdc_webhooks-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/voice-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/notify-k8s.yaml'), 'apis'),
  namespace_inject(read_file('local-dev/voicemail-k8s.yaml'), 'apis'),
])
# Define our resources
k8s_resource('api', port_forwards=['3000'])
k8s_resource('voice', port_forwards=['3001'])
k8s_resource(
   workload='nats',
   port_forwards=['4222:4222', '6222:6222']
) 
