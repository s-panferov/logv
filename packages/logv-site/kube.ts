import { V1Deployment, V1Service, NetworkingV1beta1Ingress } from '@kubernetes/client-node'
import YAML from 'yaml'

const objects = [
	<V1Deployment>{
		apiVersion: 'apps/v1',
		kind: 'Deployment',
		metadata: {
			name: 'site',
		},
		spec: {
			replicas: 1,
			selector: {
				matchLabels: {
					app: 'site',
				},
			},
			template: {
				metadata: {
					labels: {
						app: 'site',
					},
				},
				spec: {
					containers: [
						{
							name: 'site',
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
			name: 'site',
		},
		spec: {
			selector: {
				app: 'site',
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
			name: 'site',
			annotations: {
				'kubernetes.io/ingress.class': 'nginx',
			},
		},
		spec: {
			rules: [
				{
					host: 'logv.app',
					http: {
						paths: [
							{
								path: '/',
								backend: {
									serviceName: 'site',
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
