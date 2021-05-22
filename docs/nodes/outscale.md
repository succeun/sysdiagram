# Outscale

Node classes list of outscale provider.

<script>listResources("outscale");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'outscale'

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
