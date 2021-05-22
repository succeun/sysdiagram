# K8S

Node classes list of k8s provider.

<script>listResources("k8s");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'k8s'

Diagram(providerName, () => {
	Cluster(providerName, () => {
		var provider = diagrams[providerName]
		for (var resourceGroupName in provider) {
			Cluster(providerName + '.' + resourceGroupName, () => {
				var resources = provider[resourceGroupName]
				for (var resourceName in resources) {
					ctx[providerName + '_' + resourceGroupName + '_' + resourceName] = resources[resourceName](resourceName)
				}
			})
			
		}
	})
})
```
