# Azure

Node classes list of [Azure](https://github.com/mingrammer/diagrams/tree/master/resources/azure) provider.

<script>listResources("azure");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'azure'

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
