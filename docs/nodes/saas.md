# Saas

Node classes list of [Saas](https://github.com/mingrammer/diagrams/tree/master/resources/saas) provider.

<script>listResources("saas");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'saas'

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
