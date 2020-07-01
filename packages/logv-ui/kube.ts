import { V1Deployment, V1Service, NetworkingV1beta1Ingress } from '@kubernetes/client-node'
import YAML from 'yaml'

const objects = [
	<V1Deployment>{
		apiVersion: 'apps/v1',
		kind: 'Deployment',
		metadata: {
			name: 'ui',
		},
		spec: {
			replicas: 1,
			selector: {
				matchLabels: {
					app: 'ui',
				},
			},
			template: {
				metadata: {
					labels: {
						app: 'ui',
					},
				},
				spec: {
					containers: [
						{
							name: 'ui',
							image: process.env.IMAGE,
							ports: [
								{
									containerPort: 80,
								},
							],
						},
					],
					imagePullSecrets: [
						{
							name: 'gcloud',
						},
					],
				},
			},
		},
	},
	<V1Service>{
		apiVersion: 'v1',
		kind: 'Service',
		metadata: {
			name: 'ui',
		},
		spec: {
			selector: {
				app: 'ui',
			},
			ports: [
				{
					protocol: 'TCP',
					port: 80,
					targetPort: 80 as any,
				},
			],
		},
	},
	<NetworkingV1beta1Ingress>{
		apiVersion: 'networking.k8s.io/v1beta1',
		kind: 'Ingress',
		metadata: {
			name: 'ui',
			annotations: {
				'kubernetes.io/ingress.class': 'nginx',
			},
		},
		spec: {
			rules: [
				{
					host: 'ui.logv.app',
					http: {
						paths: [
							{
								path: '/',
								backend: {
									serviceName: 'ui',
									servicePort: 80 as any,
								},
							},
						],
					},
				},
			],
		},
	},
]

console.log(objects.map(o => YAML.stringify(o)).join('\n---\n'))
