# OCI

Node classes list of oci provider.

<script>listResources("oci");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'oci'

Diagram(providerName, () => {
	Cluster(providerName, () => {
		var provider = diagrams[providerName]
		for (var resourceGroupName in provider) {
			Cluster(providerName + '.' + resourceGroupName, () => {
				var resources = provider[resourceGroupName]
				for (var resourceName in resources) {
					if (!resourceName.endsWith('White')) {
						ctx[providerName + '_' + resourceGroupName + '_' + resourceName] = resources[resourceName](resourceName)
					}
				}
			})
			
		}
	})
})
```
