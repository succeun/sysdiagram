# Programming

Node classes list of [Programming](https://github.com/mingrammer/diagrams/tree/master/resources/programming) provider.

<script>listResources("programming");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'programming'

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
