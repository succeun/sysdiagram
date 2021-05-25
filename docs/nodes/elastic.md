# Elastic

Node classes list of [Elastic](https://github.com/mingrammer/diagrams/tree/master/resources/elastic) provider.

<script>listResources("elastic");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'elastic'

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
